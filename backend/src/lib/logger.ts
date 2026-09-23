import pino from 'pino';

// Create structured pino logger
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  // Sensitive field redacting to enforce healthcare privacy logging guidelines
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'body.password',
      'body.jwtSecret',
      'body.apiKey',
      'body.patientData',
      'body.medicalHistory',
      'body.symptoms',
    ],
    remove: true,
  },
});
