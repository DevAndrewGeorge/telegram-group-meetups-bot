// importing modules
const fs = require("fs");
const winston = require("winston");
const TelegramBot = require("node-telegram-bot-api");
const database = require("./database");
const config = require("./config");
const dialog = require("./dialog");
const nunjucks = require("nunjucks");


// command modules
const start = require("./commands/start");
const createcalendar = require("./commands/createcalendar");


// writing PID to file
const pid = require("npid").create("/var/run/hostess.pid", true);
pid.removeOnExit();


// setting up logging
const logger = winston.createLogger({
    level: config.log.level,
    transports: [
        new winston.transports.File({ filename: process.env.APP_DIRECTORY + "/app.log" }),
        new winston.transports.Console()
    ]
});


// helper functions
function setup() {
    const token = fs.readFileSync(config.telegram.token_path, "utf-8");
    const webhook_endpoint = "https://" + config.https.fqdn + ":" + config.https.port + "/bot" + token;
    const options = {
	webHook: {
	    port: config.https.port,
	    host: config.https.ip,
	    key:  config.https.key_path,
	    cert: config.https.cert_path
	    }
    }

    const bot = new TelegramBot(token, options);
    bot.setWebHook(webhook_endpoint, { certificate: options.webHook.cert });
    return bot;
}


function parseMessageText(text) {
    const args = text.split(" ");
    parsed = {}
    parsed["command"] = args[0][0] === "/" ? args[0] : "";
    parsed["arguments"] = parsed["command"] ? args.slice(1) : args;
    return parsed;
}


function main() {
    // bot.on handler
    function handleMessage(message) {
        // unified exit callback for all messages received
        function sendMessage(err, responseText) {
            bot.sendMessage(chat_id, responseText, {parse_mode: 'Markdown'});
        }

        const parsed_text = parseMessageText(message.text);
        const user = message.from,
            chat_id = message.chat.id,
            args = parsed_text["arguments"];
    
        switch (parsed_text["command"].toLowerCase()) {
            case "/start":
                start(user, chat_id, args, database, sendMessage);
                break;
            case "/createcalendar":
                createcalendar(user, chat_id, args, database, sendMessage);
                break;
        }
    
        logger.debug({
            user_id: message.from.id,
            username: message.from.username,
            timestamp: message.date,
            chat_id: message.chat.id,
            action: message.text
        });
    }


    // setting up bot
    const bot = setup();

    bot.on("message", handleMessage);
}

main();