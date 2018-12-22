const winston = require("winston");
const TelegramBot = require("node-telegram-bot-api");
const responses = require("./responses");


class HostessBot extends TelegramBot {
  constructor(token, options, commander) {
    super(token, options);
    this.commander = commander;
  }


  receiveMessage(msg) {
    //handling incoming message
    const parsed_text = HostessBot.parseMessageText(msg.text);
    msg.command = parsed_text["command"] || "";
    msg.command = msg.command.toLowerCase();
    winston.loggers.get("message").info({
      timestamp: msg.date,
      user_id: msg.from.id,
      chat_id: msg.chat.id,
      command: msg.command,
      incoming: true
    });
  
    // no/invalid command supplied
    if (!msg.command || !this.commander.map.hasOwnProperty(msg.command)) {
      this.sendMessage(undefined, msg);
      return;
    }

    // handle command
    this.commander.mappedFunction(msg.command)(msg, (err, msg) => {
      this.sendMessage(err, msg);
    });
  }


  static parseMessageText(text) {
    const args = text.split(" ");
  
    // no command was provided
    if (args[0][0] !== "/") {
      return false;
    }
  
    const parsed = {};
    parsed["command"] = args[0].replace("/", "");
    parsed["argument"] = args.slice(1).join(" ");
    return parsed;
  }


  sendMessage(err, msg) {
    // TODO: error handling
    winston.loggers.get("message").info({
      timestamp: Math.round((new Date()).getTime() / 1000),
      user_id: msg.from.id,
      chat_id: msg.chat.id,
      action: msg.command,
      incoming: false
    });
  
    // TODO: deal with unsent messages (.catch())
    msg.response = responses[msg.command] || responses[""];
    super.sendMessage(
      msg.chat.id,
      msg.response,
      {parse_mode: "Markdown"});
  }
}


module.exports = HostessBot;