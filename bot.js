// importing modules
const fs = require("fs");
const winston = require("winston");
const TelegramBot = require("node-telegram-bot-api");
const database = require("./database");
const config = require("./config");
const dialog = require("./dialog");
const nunjucks = require("nunjucks");


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
    function greet() {
    }

    function insert_react(err, res, fields) {
        console.log(err);
        // TODO: error handling
        const str = nunjucks.renderString(
            dialog['responses']['start/0'],
            { username: user.username }
        ) + "\n\n" + dialog['tooltips']['start/0'];
        bot.sendMessage(chat_id, str, {parse_mode: 'Markdown'});
    }

    function lookup_react(err, res, fields) {
        // TODO: error handling
        if (res.length === 0) {
            database.set_active_calendar(user.id, null, insert_react);
            return;
        }

        if (res[0]['calender_title']) {
            const str = nunjucks.renderString(
                dialog['responses']['start/2'],
                { username: user.username, calendar_title: res[0]['calendar_title'] }
            );
            bot.sendMessage(chat_id, str, {parse_mode: 'Markdown'});
        } else {
            const str = nunjucks.renderString(
                dialog['responses']['start/1'],
                { username: user.username }
            ) + "\n\n" + dialog['tooltips']['start/1'];
            bot.sendMessage(chat_id, str, {parse_mode: 'Markdown'});
        }
    }

    database.get_active_calendar(user.id, lookup_react);
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