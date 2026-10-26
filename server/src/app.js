import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import { api } from './routes/api.js';
import { sessionMiddleware } from './middleware/session.js';
import { AppError, errorHandler } from './utils/errors.js';

export const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: env.clientOrigin.split(',').map((origin) => origin.trim()), methods: ['GET','POST','PATCH','OPTIONS'], allowedHeaders: ['Content-Type','X-Session-Id'] }));
app.use(express.json({ limit: '32kb' }));
app.get('/api/v1/health', (_req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({ status: connected ? 'ok' : 'unavailable', database: connected ? 'connected' : 'disconnected' });
});
app.use('/api/v1', rateLimit({ windowMs: env.rateLimitWindowMs, limit: env.rateLimitMax, standardHeaders: 'draft-7', legacyHeaders: false, handler: (_req, _res, next) => next(new AppError(429, 'RATE_LIMIT_EXCEEDED', 'Too many requests. Please try again shortly.')) }));
app.use('/api/v1', sessionMiddleware, api);
if (env.nodeEnv === 'production') {
  const clientDist = resolve(dirname(fileURLToPath(import.meta.url)), '../../client/dist');
  if (!existsSync(clientDist)) throw new Error(`Production client build is missing: ${clientDist}`);
  app.use(express.static(clientDist, { index: false, maxAge: '1y', setHeaders: (res, path) => {
    if (path.endsWith('index.html')) res.setHeader('Cache-Control', 'no-cache');
  } }));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(resolve(clientDist, 'index.html'));
  });
}
app.use((_req, _res, next) => next(new AppError(404, 'NOT_FOUND', 'The requested resource was not found.')));
app.use(errorHandler);
