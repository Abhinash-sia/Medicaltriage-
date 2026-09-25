import pino from 'pino';

// Create structured pino logger
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  // Sensitive field redacting to enforce healthcare privacy and security logging guidelines
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'headers.authorization',
      'headers.cookie',
      'body.password',
      'body.passwordHash',
      'body.jwtSecret',
      'body.apiKey',
      'body.token',
      'body.accessToken',
      'body.patientData',
      'body.medicalHistory',
      'body.symptoms',
      'body.chiefComplaint',
      'body.rawTranscript',
      'body.extractedText',
      'password',
      'passwordHash',
      'jwtSecret',
      'apiKey',
      'token',
      'accessToken',
      'authorization',
      'GEMINI_API_KEY',
      'SARVAM_API_KEY',
      'GOOGLE_APPLICATION_CREDENTIALS',
    ],
    remove: true,
  },
});
