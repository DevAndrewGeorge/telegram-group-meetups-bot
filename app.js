const os = require("os");
const fs = require("fs");
const ini = require("ini");
const winston = require("winston");
const mailgun = require("mailgun-js");
const Alerter = require("error-alerts");
const HostessBot = require("./HostessBot");
const Commander = require("./Commander");
const CommanderBackend = require("./CommanderBackend");
const log = require("./logger");


/* ==============================================
SETUP RELATED COMMANDS
============================================== */
function readConfigFile(path) {
  return ini.parse(
    fs.readFileSync(
      path,
      "utf-8"
    )
  );
}


function configurePidFile(filepath) {
  const pid = require("npid").create(filepath, true);
  pid.removeOnExit();
}


function configureAlerter(config, alert_callback) {
  // general setup
  Alerter.root(config.alerter_log_dir);
  Alerter.from("alerter@hostess.tyrantsdevelopment.com").contact(config.alerter_contact);

  // for basic errors
  Alerter.one().act(alert_callback).minute().on().threshold(3).cooldown(60);
  Alerter.one().act(alert_callback).hour().on().threshold(180).cooldown(60);

  // mongo and telegram errors need to be escalated immediately
  Alerter.one("MongoError").act(alert_callback).minute().on().threshold(1).cooldown(1);
  Alerter.one("HostessBot_ETELEGRAM").act(alert_callback).minute().on().threshold(1).cooldown(1);

  // start the bot now
  Alerter.start();
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
      certificate: https_config.ca_path
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
  const config = readConfigFile(process.argv[2]);


  // setting up Alerter
  function send_email(err, timespan) {
    const data = {
      from: `${os.hostname()}`,
      to: config.mailgun.to,
      subject: "Alerter Error",
      text: `Error received in the last ${timespan}!\n\n${err.toString()}`
    };

    mailgun(config.mailgun.api_key, config.mailgun.domain).messages().send(data);
  }
  configureAlerter(config.monitoring, send_email);
  

  // immediately implement error handling that builds on top of Alerter
  const fatal_callback = err => {
    console.error(err.stack);
    Alerter.dead(err, () => { process.exit(4); });
    process.exit(4);
  };

  process.on("uncaughtException", fatal_callback);
  process.on("unhandledRejection", fatal_callback);

  
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
  if (config.telegram.fetch_method == "update") {
    configureUpdates(token);
  } else {
    configureWebhook(token, config.https);
  }
}


main();


