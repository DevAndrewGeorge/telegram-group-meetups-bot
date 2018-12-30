const winston = require("winston");
const nunjucks = require("nunjucks");
const Alerter = require("error-alerts");
const Commander = require("./Commander");
const SaveError = require("./errors/SaveError");
const ActiveEditError = require("./errors/ActiveEditError");
const PropertyError = require("./errors/PropertyError");
const CommandError = require("./errors/CommandError");
const SelectionError = require("./errors/SelectionError");
const DeleteError = require("./errors/DeleteError");
const InviteError = require("./errors/InviteError");
const ActiveCalendarError = require("./errors/ActiveCalendarError");
const TelegramBot = require("node-telegram-bot-api");
const Transforms = require("./transforms");
const responses = require("./responses");


class HostessBot extends TelegramBot {
  constructor(token, options, commander) {
    super(token, options);
    this.commander = commander;
    this.on("message", this.receiveMessage);
    this.on("callback_query", this.receiveCallbackQuery);

    //error handling
    this.on("webhook_error", HostessBot.error_callback);
    this.on("polling_error", HostessBot.error_callback);
  }

  receiveCallbackQuery(query) {
    query.message.from = query.from;
    query.message.text = query.data;
    this.answerCallbackQuery(query.id);
    this.receiveMessage(query.message);
  }


  receiveMessage(msg) {
    //handling incoming message
    msg.hostess = {};

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
      this.sendMessage(new CommandError(), msg);
    }
  }

  /**
   * Transforms data stored in message.hostess.data.
   * @param {Error} err 
   * @param {Message} message 
   */
  _transform(err, message) {
    const callback = err => this.sendMessage(err, message);

    // nothing to do if existing error or no data to transform
    if (err || !message.hostess.data) {
      callback(err);
      return;
    }

    const transformers = {
      "calendar": this._transform_calendar,
      "event": this._transform_event,
      "events": this._transform_events
    };

    const data_type = Object.keys(message.hostess.data)[0];
    if (transformers[data_type]) {
      transformers[data_type].bind(this)(message, callback);
      return;
    } else {
      callback(undefined);
      return;
    }
  }


  /**
   * Transforms event.rsvps from array of UIDs to array of usernames
   * @param {Message} message 
   * @param {function} callback (err)
   */
  _transform_event(message, callback) {
    const event = message.hostess.data.event;
    if (!event) { // nothing to do if event does not exist in data
      callback(undefined);
      return;
    }

    // transform dates
    const temp = Transforms.transform_date_objects(
      event.from,
      event.to
    );
    event.from = temp.from;
    event.to = temp.to;

    const user_ids = event.rsvps;
    if (!user_ids || user_ids.length === 0) { // no RSVPs/UIDs
      callback(undefined);
      return;
    }

    const get_chat_member_callbacks = (function() {
      // tracks usernames recovered
      const usernames = [];
      let count = 0;
      
      // flag to let inform calls of existing concurrent error
      let error = false;
      
      function on_success(member) {
        if (error) { // do no more work if concurrent error encountered
          return;
        }

        usernames.push(`${member.user.first_name} ${member.user.last_name || ""}`);
        if (++count === user_ids.length) {
          message.hostess.data.event.rsvps = usernames;
          message.hostess.data.event.additional_guest_count = user_ids.length - usernames.length;
          callback(undefined);
        }
      }

      function on_reject(err) {
        if (error) { // do no work if error already encountered
          return;
        } else if (err.code !== "ETELEGRAM" || err.response.body.error_code !== 400) {
          // if [err] is not an exepcted error, invoke callback
          error = true;
          HostessBot.error_callback(err);
          callback(err);
          return;
        }

        if (++count === user_ids.length) {
          message.hostess.data.event.rsvps = usernames;
          message.hostess.data.event.additional_guest_count = user_ids.length - usernames.length;
          callback(undefined);
        }
      }

      return {
        on_success: on_success,
        on_reject: on_reject 
      };
    })();

    user_ids.forEach(user_id => {
      this.getChatMember(
        message.chat.id,
        user_id
      ).then(
        get_chat_member_callbacks.on_success,
        get_chat_member_callbacks.on_reject
      )
    });
  }

  _transform_events(message, callback) {
    message.hostess.data.events.forEach(event => {
      const temp = Transforms.transform_date_objects(event.from, event.to);
      event.from = temp.from;
      event.to = temp.to;
    });

    callback(undefined);
  }

  _transform_calendar(message, callback) {
    let calendar;
    try {
      calendar = message.hostess.data.calendar;
      if (!calendar) {
        callback(undefined);
        return;
      }
    } catch (err) {
      callback(undefined);
      return;
    }

    if (calendar.events) {
      calendar.events.sort(Transforms.sort_events);
      calendar.events.forEach(event => {
        // dates
        const temp = Transforms.transform_date_objects(event.from, event.to);
        event.from = temp.from;
        event.to = temp.to;
      });
    }

    callback(undefined);
  }


  sendMessage(err, msg) {
    if (err) {
      msg.hostess.response_command = "error";
    } else if ( !msg.hostess.response_command ) {
      msg.hostess.response_command = msg.hostess.request_command;
    }
    
    if (msg.hostess.response_mute) {
      return;
    }

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
    } else if (err instanceof InviteError) {
      msg.hostess.response = responses["error"]["invite"]; 
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
    ).then(
      () => {
        winston.loggers.get("message").info({
          timestamp: Math.floor(Date.now() / 1000),
          user_id: msg.from.id,
          chat_id: msg.chat.id,
          command: msg.hostess.response_command,
          incoming: false
        });
      }
    ).catch(
      HostessBot.error_callback
    );
  }

  static error_callback(err) {
    Alerter.tell(`HostessBot_${err.code}`);
  }
}


module.exports = HostessBot;
