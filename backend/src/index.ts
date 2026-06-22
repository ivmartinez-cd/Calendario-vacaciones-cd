import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';

async function bootstrap() {
  const app = createApp();

  const server = app.listen(env.port, () => {
    console.log(`🚀 Canal Directo API escuchando en http://localhost:${env.port}/api`);
    console.log(`📖 Docs: http://localhost:${env.port}/api/docs`);
  });

  const shutdown = async () => {
    console.log('\n🛑 Cerrando servidor...');
    server.close();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((err) => {
  console.error('Error al iniciar el servidor:', err);
  process.exit(1);
});
