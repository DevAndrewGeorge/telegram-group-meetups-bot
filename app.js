const path = require("path");
const fs = require("fs");
const ini = require("ini");
const winston = require("winston");
const HostessBot = require("./HostessBot");
const Commander = require("./Commander");
const CommanderBackend = require("./CommanderBackend");
const log = require("./logger");


/* ==============================================
SETUP RELATED COMMANDS
============================================== */
function readConfigFile() {
  return ini.parse(
    fs.readFileSync(
      path.join(__dirname, "config.ini"),
      "utf-8"
    )
  );
}


function configurePidFile(filepath) {
  const pid = require("npid").create(filepath, true);
  pid.removeOnExit();
}


function readToken(filepath) {
  try {
    return fs.readFileSync(filepath, "utf-8");
  } catch (err) {
    winston.loggers.get("application").error(
      err.code === "ENOENT" ?
        `No token file at ${filepath}` :
        `Unexpected error with token file at ${filepath}. Associated error message: ${err.message}.`
    );
    process.exit(1);
  }
}


function configureUpdates(token) {
  function startListening(_) {
    winston.loggers.get("application").info("Update polling successfully established.");
  }

  // we exit program because the app will run as a service
  function exitProgram(_) {
    winston.loggers.get("application").error("Failed to setup update polling.");
    process.exit(2);
  }

  const options = {
    "polling": {
      "interval": 0
    }
  };

  const bot = new HostessBot(token, options, new Commander(CommanderBackend));
  bot.getUpdates().then(startListening, exitProgram);
  return bot;
}


function configureWebhook(token, https_config) {
  function startListening(_) {
    winston.loggers.get("application").info(`Webhook successfully established at https://${https_config.fqdn}:${https_config.port}`);
  }

  // we exit program because the app will run as a service
  function exitProgram(failure) {
    winston.loggers.get("application").error(`Webhook unable to established at https://${https_config.fqdn}:${https_config.port} (${failure}). Exiting.`);
    process.exit(3);
  }

  const options = {
    "webHook": {
      port: https_config.port,
      host: https_config.ip,
      key:  https_config.key_path,
      cert: https_config.cert_path
    }
  };

  const bot = new HostessBot(token, options, new Commander(CommanderBackend));
  const webhook_endpoint = "https://" + https_config.fqdn + ":" + https_config.port + "/bot" + token;
  bot.setWebHook(
    webhook_endpoint,
    {
      certificate: options.webHook.cert
    }
  ).then(
    startListening,
    exitProgram
  );

  return bot;
}


/* ==============================================
ENTRY POINT
============================================== */
function main() {
  //
  const config = readConfigFile();
  

  // creating PID file in the event program is running as a service
  configurePidFile(config.pid.filepath);


  //setup logging
  log.configureApplicationLogger(
    config.log.application_log_path,
    config.log.level
  );

  log.configureMessageLogger(
    config.log.message_log_path,
    config.log.level
  );


  // setup backend/database
  CommanderBackend.initalize(config.mongo);

  
  // initializing bot / start listening for messages
  const token = readToken(config.telegram.token_path);


  // TODO: general bot error handling
  let hostess_bot;
  if (config.telegram.fetch_method == "update") {
    hostess_bot = configureUpdates(token);
  } else {
    hostess_bot = configureWebhook(token);
  }
  hostess_bot.on("message", hostess_bot.receiveMessage);
}


main();

