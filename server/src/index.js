import { setServers } from 'node:dns';
import mongoose from 'mongoose';
import { app } from './app.js';
import { env } from './config/env.js';

if (env.dnsServers.length) setServers(env.dnsServers);

if (env.nodeEnv === 'production' && !env.sessionSecret) throw new Error('SESSION_SECRET must be configured in production.');

try {
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 10000 });
  console.log(JSON.stringify({ level: 'info', message: 'MongoDB connected' }));
  const server = app.listen(env.port, () => console.log(JSON.stringify({ level: 'info', message: `API listening on ${env.port}`, model: env.geminiModel })));
  server.on('error', async (error) => {
    console.error(JSON.stringify({ level: 'error', message: error.code === 'EADDRINUSE' ? `Port ${env.port} is already in use` : 'HTTP server failed', detail: error.message }));
    await mongoose.disconnect();
    process.exitCode = 1;
  });

  const shutdown = (signal) => {
    console.log(JSON.stringify({ level: 'info', message: `Received ${signal}; shutting down`}));
    server.close(() => mongoose.disconnect().finally(() => process.exit(0)));
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT', () => shutdown('SIGINT'));
} catch (error) {
  console.error(JSON.stringify({ level: 'error', message: 'MongoDB connection failed', detail: error.message }));
  process.exit(1);
}
