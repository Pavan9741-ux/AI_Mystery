import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';

const secret = env.sessionSecret || 'development-only-secret-change-before-deploy';
const sign = (nonce) => createHmac('sha256', secret).update(nonce).digest('base64url');
const createSessionId = () => {
  const nonce = randomBytes(32).toString('base64url');
  return `${nonce}.${sign(nonce)}`;
};

export function sessionMiddleware(req, _res, next) {
  let sessionId = req.get('x-session-id');
  if (!sessionId && req.method === 'POST' && req.path === '/sessions') {
    req.isNewSession = true;
    req.sessionId = createSessionId();
    return next();
  }
  if (!sessionId || !/^[A-Za-z0-9_-]{43}\.[A-Za-z0-9_-]{43}$/.test(sessionId)) return next(new AppError(401, 'SESSION_UNAUTHORIZED', 'A valid investigation session is required.'));
  const [nonce, signature] = sessionId.split('.');
  const expected = Buffer.from(sign(nonce));
  if (!timingSafeEqual(Buffer.from(signature), expected)) return next(new AppError(401, 'SESSION_UNAUTHORIZED', 'A valid investigation session is required.'));
  req.sessionId = sessionId;
  next();
}
