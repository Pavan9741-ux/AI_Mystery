export class AppError extends Error {
  constructor(status, code, message, details = []) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function errorHandler(error, _req, res, next) {
  void next;
  const status = error.status ?? 500;
  const code = error.code ?? 'INTERNAL_SERVER_ERROR';
  if (status >= 500) console.error(JSON.stringify({ level: 'error', code, message: error.message }));
  res.status(status).json({ error: { code, message: status >= 500 && code === 'INTERNAL_SERVER_ERROR' ? 'Something went wrong. Please try again.' : error.message, details: error.details ?? [] } });
}
