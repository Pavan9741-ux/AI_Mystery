import dotenv from 'dotenv';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const envPath = [resolve(serverRoot, '.env'), resolve(serverRoot, '..', '.env')].find(existsSync);
if (envPath) dotenv.config({ path: envPath });

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 5000),
  mongoUri: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/ai_mystery_room',
  geminiApiKey: process.env.GEMINI_API_KEY ?? '',
  geminiModel: process.env.GEMINI_MODEL ?? 'gemini-3.5-flash-lite',
  geminiThinkingLevel: process.env.GEMINI_THINKING_LEVEL ?? 'low',
  aiTimeoutMs: Number(process.env.AI_GENERATION_TIMEOUT_MS ?? 120000),
  aiMaxRetries: Number(process.env.AI_MAX_RETRIES ?? 2),
  aiMaxOutputTokens: Number(process.env.AI_MAX_OUTPUT_TOKENS ?? 12000),
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  dnsServers: (process.env.DNS_SERVERS ?? '').split(',').map((server) => server.trim()).filter(Boolean),
  sessionSecret: process.env.SESSION_SECRET ?? '',
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 900000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX ?? 30),
};
