const winston = require("winston");


function configureMessageLogger(filepath, log_level) {
  winston.loggers.add("message", {
    level: log_level,
    transports: [
      new winston.transports.File({ filename: filepath }),
      new winston.transports.Console()
    ]
  });
}


function configureApplicationLogger(filepath, log_level) {
  winston.loggers.add("application", {
    level: log_level,
    transports: [
      new winston.transports.File({ filename: filepath }),
      new winston.transports.Console()
    ],
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.label({ label: "BOT"}),
      winston.format.printf(info => `[${info.label.toUpperCase()}] [${info.level.toUpperCase()}] [${info.timestamp}] ${info.message}`)
    )
  });

  winston.loggers.add("database", {
    level: log_level,
    transports: [
      new winston.transports.File({ filename: filepath }),
      new winston.transports.Console()
    ],
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.label({ label: "DB"}),
      winston.format.printf(info => `[${info.label.toUpperCase()}] [${info.level.toUpperCase()}] [${info.timestamp}] ${info.message}`)
    )
  });
}


module.exports = {
  configureMessageLogger: configureMessageLogger,
  configureApplicationLogger: configureApplicationLogger
};