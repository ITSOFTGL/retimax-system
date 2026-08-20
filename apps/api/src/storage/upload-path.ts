import { ConfigService } from '@nestjs/config';
import { join, isAbsolute } from 'path';

export function resolveUploadDir(config?: ConfigService): string {
  const dir = config?.get<string>('UPLOAD_DIR') ?? process.env.UPLOAD_DIR ?? './uploads';
  return isAbsolute(dir) ? dir : join(process.cwd(), dir);
}
