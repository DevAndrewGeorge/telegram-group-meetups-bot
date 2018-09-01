// importing modules
const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const config = require("./config");
const winston = require("winston");


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


function parseCommand(text) {
    const args = text.split(" ");
    return {
        command: args[0][0] === "/" ? args[0] : "",
        arguments: args.length > 1 ? args.slice(1) : []
    }
}


function start(bot, user, chat_id, arguments) {
    bot.sendMessage(
        chat_id,
        "Hello, @" + user.username + "! Type /create [name] to begin creatinga calendar with [name]."
    )
    .catch(error => console.log(error));
}


function main() {
    // setting up bot
    const bot = setup();

    bot.on("message", msg => {
        const command = parseCommand(msg.text);
        switch (command["command"]) {
            case "/start":
                start(bot, msg.from, msg.chat.id, command["arguments"]);
        }

        logger.debug({
            user_id: msg.from.id,
            username: msg.from.username,
            timestamp: msg.date,
            chat_id: msg.chat.id,
            action: msg.text
        });
    });
}

main();