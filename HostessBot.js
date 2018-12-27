const winston = require("winston");
const nunjucks = require("nunjucks");
const Commander = require("./Commander");
const SaveError = require("./errors/SaveError");
const ActiveEditError = require("./errors/ActiveEditError");
const PropertyError = require("./errors/PropertyError");
const CommandError = require("./errors/CommandError");
const SelectionError = require("./errors/SelectionError");
const DeleteError = require("./errors/DeleteError");
const ActiveCalendarError = require("./errors/ActiveCalendarError");
const TelegramBot = require("node-telegram-bot-api");
const responses = require("./responses");


class HostessBot extends TelegramBot {
  constructor(token, options, commander) {
    super(token, options);
    this.commander = commander;
    this.on("message", this.receiveMessage);
    this.on("callback_query", this.receiveCallbackQuery);
  }


  receiveCallbackQuery(query) {
    query.message.from = query.from;
    query.message.text = query.data;
    this.answerCallbackQuery(query.id);
    this.receiveMessage(query.message);
  }


  receiveMessage(msg) {
    //handling incoming message
    msg.hostess = {}

    // parsing
    const parsed_text = Commander.parseCommand(msg.text);
    msg.hostess.request_command = parsed_text.command;
    msg.hostess.argument = parsed_text["argument"];

    // logging
    winston.loggers.get("message").info({
      timestamp: msg.date,
      user_id: msg.from.id,
      chat_id: msg.chat.id,
      command: msg.hostess.request_command || "",
      incoming: true
    });

    // attempting to execute request_command
    try {
      this.commander.mappedFunction(msg.hostess.request_command)(msg, (err, msg) => {
        this.sendMessage(err, msg);
      });
    } catch(err) {
      console.log(err);
      this.sendMessage(new CommandError(), msg);
    }
  }


  sendMessage(err, msg) {
    msg.hostess.response_command = err ? "error" : msg.hostess.request_command;
    winston.loggers.get("message").info({
      timestamp: Date.now() / 1000,
      user_id: msg.from.id,
      chat_id: msg.chat.id,
      command: msg.hostess.response_command,
      incoming: false
    });
  
    // TODO: deal with unsent messages (.catch())
    if (err instanceof SaveError) {
      msg.hostess.response = responses["error"]["save"];
    } else if (err instanceof ActiveEditError) {
      msg.hostess.response = responses["error"]["state"];
    } else if (err instanceof PropertyError) {
      msg.hostess.response = responses["error"]["property"];
    } else if (err instanceof CommandError) {
      msg.hostess.response = responses["error"]["command"];
    } else if (err instanceof SelectionError) {
      msg.hostess.response = responses["error"]["selection"];
    } else if (err instanceof DeleteError) {
      msg.hostess.response = responses["error"]["delete"];
    } else if (err instanceof ActiveCalendarError) {
      msg.hostess.response = responses["error"]["calendar"];
    } else if (err) {
      msg.hostess.response = responses["error"]["internal"];
    } else if (message.hostess.request_command === "help") {
      
    } else {
      msg.hostess.response = responses[msg.hostess.edit_type][msg.hostess.response_command] || responses["error"][""];
    }
    
    super.sendMessage(
      msg.chat.id,
      nunjucks.renderString(msg.hostess.response, msg.hostess.data || {}),
      {
        parse_mode: "HTML",
        reply_markup: msg.hostess.keyboard
      }
    );
  }
}


module.exports = HostessBot;