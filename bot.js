// importing modules
const fs = require("fs");
const winston = require("winston");
const TelegramBot = require("node-telegram-bot-api");
const database = require("./mongo");
const config = require("./config");
const dialog = require("./dialog");
const nunjucks = require("nunjucks");
const MongoError = require("./MongoError");


// command modules
const start = require("./commands/start");
const createcalendar = require("./commands/createcalendar");
const editcalendar = require("./commands/editcalendar");
const listcalendars = require("./commands/listcalendars");
const respond = require("./commands/respond");
const skip = require("./commands/skip");


// writing PID to file
const pid = require("npid").create("/var/run/hostess.pid", true);
pid.removeOnExit();


// setting up logging
const message_logger = winston.createLogger({
    level: config.log.level,
    transports: [
        new winston.transports.File({ filename: config.log.message_log_path }),
        new winston.transports.Console()
    ]
});

const application_logger = winston.createLogger({
    level: config.log.level,
    transports: [
        new winston.transports.File({ filename: config.log.application_log_path }),
        new winston.transports.Console()
    ],
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.label({ label: 'BOT'}),
        winston.format.printf(info => `[${info.label.toUpperCase()}] [${info.level.toUpperCase()}] [${info.timestamp}] ${info.message}`)
    )
});


// helper funcdtions
function handleMessage(message) {
    // unified exit callback for all messages received
    function sendMessage(err, responseText) {
        if (err instanceof MongoError) {
            application_logger.error({
                label: "MONGO"
            });
        } else if (err instanceof RangeError) {

        }
        /* if (err instanceof MongoError) {

        } else if (err instanceof RangeError) {

        } */

        message_logger.info({
            timestamp: Math.round((new Date()).getTime() / 1000),
            user_id: message.from.id,
            chat_id: message.chat.id,
            action: parsed_text["command"],
            incoming: false
        });
        bot.sendMessage(chat_id, responseText, {parse_mode: "Markdown"});
    }

    const parsed_text = parseMessageText(message.text);
    const user = message.from,
        chat_id = message.chat.id,
        args = parsed_text["arguments"];

    // logging history
    message_logger.info({
        timestamp: message.date,
        user_id: message.from.id,
        chat_id: message.chat.id,
        action: parsed_text["command"],
        incoming: true
    });


    // executing relative paths
    // TODO: reduce this down to a single case
    switch (parsed_text["command"].toLowerCase()) {
        case "/start":
            start(user, chat_id, args, database, sendMessage);
            break;
        case "/createcalendar":
            createcalendar(user, chat_id, args, database, sendMessage);
            break;
        case "/listcalendars":
        case "/listcalendar":
            listcalendars(user, chat_id, args, database, sendMessage);
            break;
        case "/editcalendar":
            editcalendar(user, chat_id, args, database, sendMessage);
            break;
        case "/respond":
            respond(user, chat_id, args, database, sendMessage);
            break;
        case "/skip":
            skip(user, chat_id, args, database, sendMessage);
            break;
    }
}


// helper functions
/*
Exit Codes:
1: error with opening token file
2: error setting up getUpdates
3: error setting up setWebhook
*/
function setup() {
    if (config.telegram.fetch_method === "webhook") {
        setWebhook();
    } else {
        getUpdates();
    }
}

function readToken() {
    try {
        return fs.readFileSync(config.telegram.token_path, "utf-8");
    } catch (err) {
        application_logger.log({
            level: 'error',
            message: err.code === "ENOENT" ?
                `No token file at ${config.telegram.token_path}` :
                `Unexpected error with token file at ${config.telegram.token_path}. Associated error message: ${err.message}.`
        });
        process.exit(1);
    }
}


function getUpdates() {
    const options = {
        "polling": {
            "interval": 0
        }
    };

    const bot = new TelegramBot(readToken(), options);
    bot.deleteWebHook().then(
        function(success) {
            application_logger.log({
                level: 'info',
                message: 'getUpdates(): webhook deleted (if one existed)'
            });

            bot.getUpdates().then(
                function(success) {
                    application_logger.log({
                        level: 'info',
                        message: 'Update polling successfully established.'
                    });
                    bot.on("message", handleMessage);
                },
                function(failure) {
                    application_logger.log({
                        level: 'error',
                        message: 'Failed to setup update polling.'
                    });
                    process.exit(2);
                }
            )
        },
        function(failure) {
            application_logger.log({
                level: 'warning',
                message: 'getUpdates(): failed to delete webhook (if one existed)'
            });
            process.exit(2);
        }
    )
}

function setWebhook() {
    const options = {
        "webHook": {
            port: config.https.port,
            host: config.https.ip,
            key:  config.https.key_path,
            cert: config.https.cert_path
        }
    };

    const bot = new TelegramBot(readToken(), options);
    const webhook_endpoint = "https://" + config.https.fqdn + ":" + config.https.port + "/bot" + token;

    bot.setWebHook(webhook_endpoint, { certificate: options.webHook.cert }).then(
        function(success) {
            application_logger.log({
                level: 'info',
                message: `Webhook successfully established at https://${config.https.fqdn}:${config.https.port}`
            });
            bot.on("message", handleMessage);
        },
        function(failure) {
            application_logger.log({
                level: 'error',
                message: `Webhook unable to established at https://${config.https.fqdn}:${config.https.port} (${failure}). Exiting.`
            });
            process.exit(3);
        }
    );
}


//
function parseMessageText(text) {
    const args = text.split(" ");
    parsed = {}
    parsed["command"] = args[0][0] === "/" ? args[0] : "/respond";
    parsed["arguments"] = parsed["command"] !== "/respond" ? args.slice(1) : args;
    return parsed;
}

setup();