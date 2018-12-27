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
        this._transform(err, msg);
      });
    } catch(err) {
      console.log(err);
      this.sendMessage(new CommandError(), msg);
    }
  }

  /**
   * Orchestrates transformation of message.hostess.data.
   * @param {Error} err 
   * @param {Message} message 
   */
  _transform(err, message) {
    function transformer_callback(err) {
      this.sendMessage(err, message);
    }

    // data is in unknown state if error has already occurred
    // do nothing as a result
    if (err) {
      transformer_callback(err, message.hostess.data);
      return;
    }

    const transformations = {
      "event": this._user_ids_to_full_names
    };

    const transformer = transformations[message.hostess.request_command] || this._fallthrough;
    transformer.bind(this)(
      message,
      transformer_callback.bind(this)
    );
  }

  /**
   * 
   * @param {*} data 
   * @param {function} callback (err)
   */
  _fallthrough(data, callback) {
    callback(undefined);
  }

  /**
   * Transforms event.going from array of UIDs to array of usernames
   * @param {Message} message 
   * @param {function} callback (err)
   */
  _user_ids_to_full_names(message, callback) {
    const user_ids = message.hostess.data.going;
    if (!user_ids || user_ids.length === 0) { // no RSVPs/UIDs
      callback(undefined);
      return;
    }

    const get_chat_member_callback = (function() {
      //
      const usernames = [];
      
      // flag to let inform calls of existing concurrent error
      let error = false;
      
      return function(member, err) { // this is a Promise callback, hence the ordering
        if (!error && err) { // invoke callback and set flag as first error
          error = true;
          callback(err);
          return;
        } else if (err) { // do no more work if concurrent error encountered
          return;
        }

        usernames.push(`${member.user.first_name} ${member.user.last_name || ""}`);
        if (usernames.length === user_ids.length) {
          message.hostess.data.going = usernames;
          callback(undefined);
        }
      }
    })();

    user_ids.forEach(user_id => {
      this.getChatMember(
        message.chat.id,
        user_id
      ).then(get_chat_member_callback);
    });
  }


  sendMessage(err, msg) {
    if (err) {
      msg.hostess.response_command = "error";
    } else if ( !msg.hostess.response_command ) {
      msg.hostess.response_command = msg.hostess.request_command;
    }
    
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
    } else {
      msg.hostess.response = responses[msg.hostess.edit_type][msg.hostess.response_command] || responses["error"][""];
    }
    
    if (msg.hostess.request_command === "contact") {
      super.sendMessage(
        745599548,
        msg.hostess.argument
      );
    }


    super.sendMessage(
      msg.chat.id,
      nunjucks.renderString(msg.hostess.response, msg.hostess.data || {}),
      {
        parse_mode: "HTML",
        reply_markup: msg.hostess.keyboard
      }
    ).then(function sendMessageSuccess(_) {
    }).catch(function sendMessageReject(err) {
    });
  }
}


module.exports = HostessBot;