import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  rol: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private toUsuarioDto(user: {
    id: string;
    nombre: string;
    email: string;
    rol: string;
    activo: boolean;
    createdAt: Date;
  }) {
    return {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      activo: user.activo,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.usuario.findUnique({ where: { email } });
    if (!user || !user.activo) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const tokens = await this.issueTokens(user.id, user.email, user.rol);
    return {
      ...tokens,
      usuario: this.toUsuarioDto(user),
    };
  }

  async refresh(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { usuario: true },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date() || !stored.usuario.activo) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const tokens = await this.issueTokens(
      stored.usuario.id,
      stored.usuario.email,
      stored.usuario.rol,
    );

    return {
      ...tokens,
      usuario: this.toUsuarioDto(stored.usuario),
    };
  }

  async logout(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }

  async validateUser(userId: string) {
    const user = await this.prisma.usuario.findUnique({ where: { id: userId } });
    if (!user || !user.activo) {
      throw new UnauthorizedException('Usuario no autorizado');
    }
    return user;
  }

  private async issueTokens(userId: string, email: string, rol: string) {
    const payload: JwtPayload = { sub: userId, email, rol };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES', '15m'),
    });

    const refreshToken = randomBytes(48).toString('hex');
    const tokenHash = this.hashToken(refreshToken);
    const refreshExpires = this.config.get<string>('JWT_REFRESH_EXPIRES', '7d');
    const expiresAt = new Date(Date.now() + this.parseDurationMs(refreshExpires));

    await this.prisma.refreshToken.create({
      data: {
        tokenHash,
        usuarioId: userId,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  private parseDurationMs(value: string): number {
    const match = value.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000;
    const amount = Number(match[1]);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return amount * multipliers[unit];
  }
}
