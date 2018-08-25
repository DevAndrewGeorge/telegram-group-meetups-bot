B1;4205;0c// importing modules
const TelegramBot = require('node-telegram-bot-api');
const fs = require("fs");
const config = require("./config");


// creating bot

function setup() {
    const token = fs.readFileSync(config.telegram.token_path, "utf-8");
    const webhook_endpoint = config.https.fqdn + ":" + config.bot.port + "/bot" + token;
    const options = {
	webHook: {
	    port: 443,
	    host: "0.0.0.0",
	    key:  config.https.key_path,
	    cert: config.https.cert_path
	}
    }

    const bot = new TelegramBot(token, options);
    bot.setWebHook(webhook_endpoint, { certificate: options.webHook.cert });
    return bot;
}

const bot = setup();
