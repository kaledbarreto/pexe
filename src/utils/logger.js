const { createLogger, format, transports } = require('winston');

// Saída: "2026-10-20 14:03:12 [INFO] mensagem" (+ stack em erros)
const logger = createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: format.combine(
        format.errors({ stack: true }),
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(({ timestamp, level, message, stack }) =>
            `${timestamp} [${level.toUpperCase()}] ${message}${stack ? `\n${stack}` : ''}`
        )
    ),
    transports: [new transports.Console()],
});

module.exports = logger;
