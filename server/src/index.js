import { setServers } from 'node:dns';
import mongoose from 'mongoose';
import { app } from './app.js';
import { env } from './config/env.js';

if (env.dnsServers.length) setServers(env.dnsServers);

if (env.nodeEnv === 'production' && !env.sessionSecret) throw new Error('SESSION_SECRET must be configured in production.');

const isTransientSrvDnsError = (error) =>
  ['ECONNREFUSED', 'ETIMEOUT', 'ENOTFOUND'].includes(error.code) && error.message.includes('querySrv');

async function connectMongo() {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 10000 });
      return;
    } catch (error) {
      if (!isTransientSrvDnsError(error) || attempt === 3) throw error;
      console.warn(JSON.stringify({ level: 'warn', message: 'Temporary MongoDB SRV DNS lookup failure; retrying', attempt }));
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }
}

try {
  console.log(JSON.stringify({ level: 'info', message: 'Connecting to MongoDB' }));
  await connectMongo();
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
  const srvDnsBlocked = isTransientSrvDnsError(error);
  const mongoAuthFailed = error.code === 8000 || error.codeName === 'AuthenticationFailed';
  console.error(JSON.stringify({
    level: 'error',
    message: 'MongoDB connection failed',
    detail: srvDnsBlocked
      ? 'Node could not resolve the Atlas SRV record. Set DNS_SERVERS=8.8.8.8,1.1.1.1 in the active .env file, then restart the server. Also confirm outbound DNS (port 53) is allowed.'
      : mongoAuthFailed
        ? 'MongoDB Atlas rejected the database credentials. Verify the database user and password in Atlas Database Access, update MONGODB_URI in the active .env file, and URL-encode special characters in the password.'
        : error.message,
  }));
  process.exit(1);
}
