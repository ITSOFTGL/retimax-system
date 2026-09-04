import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Admin123!', 12);

  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@retimax.local' },
    update: { username: 'admin' },
    create: {
      nombre: 'Administrador RETIMAX',
      email: 'admin@retimax.local',
      username: 'admin',
      passwordHash,
      rol: 'ADMIN',
    },
  });

  const proveedor = await prisma.proveedor.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      nombre: 'Proveedor Italia Demo',
    },
  });

  const cliente = await prisma.cliente.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      nombre: 'Cliente Demo',
      telefono: '+591 70000000',
      notas: 'Cliente de prueba para desarrollo local',
    },
  });

  const empPassword = await bcrypt.hash('Empleado123!', 12);
  const empleado = await prisma.empleado.upsert({
    where: { email: 'alex@retimax.local' },
    update: { carnet: '100001' },
    create: {
      nombre: 'Alex',
      apellido: 'Demo',
      email: 'alex@retimax.local',
      carnet: '100001',
      especialidad: 'ELECTRICO',
    },
  });

  await prisma.usuario.upsert({
    where: { email: 'alex@retimax.local' },
    update: { empleadoId: empleado.id, rol: 'EMPLEADO', username: 'alex' },
    create: {
      nombre: 'Alex Demo',
      email: 'alex@retimax.local',
      username: 'alex',
      passwordHash: empPassword,
      rol: 'EMPLEADO',
      empleadoId: empleado.id,
    },
  });

  console.log('Seed completado:', {
    admin: admin.username,
    empleado: 'alex',
    proveedor: proveedor.nombre,
    cliente: cliente.nombre,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
