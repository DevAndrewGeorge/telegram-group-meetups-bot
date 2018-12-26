const mongojs = require("mongojs");
const SaveError = require("./errors/SaveError");
const ActiveEditError = require("./errors/ActiveEditError");
const PropertyError = require("./errors/PropertyError");
const SelectionError = require("./errors/SelectionError");
const DeleteError = require("./errors/DeleteError");
const ActiveCalendarError = require("./errors/ActiveCalendarError");


class Commander {
  constructor(backend) {
    this.backend = backend;
    this.map = {
      // calendars
      "createcalendar": this.create_calendar,
      "switchcalendar": this.list_calendars,
      "edit": this.retrieve_calendar,

      // events
      "createevent": this.create_event,
      "editevent": this.list_events,
      "deleteevent": this.list_events,

      // properties
      "title": this.set_property,
      "description": this.set_property,
      "summary": this.set_property,
      "location": this.set_property,
      "link": this.set_property,
      "from": this.set_property,
      "to": this.set_property,

      // actions
      "preview": this.preview,
      "discard": this.discard,
      "save": this.save,
      "delete": this.delete,
      "cancel": this.cancel,

      //list commands
      "c": this.change_active_calendar,
      "e": this.retrieve_event,
      "dc": undefined,
      "de": this.confirm_event_delete,

      // user commands
      "publish": this.publish,
      "start": this.associate,
      "calendar": this.get_info_calendar,
      "event": this.get_info_event,
      "rsvp": undefined,
      "unrsvpn": undefined
    };
  }


  cb(message, callback) {
    return function(err) {
      callback(err, message);
    }
  }

  /**
   * Enables user commands such as /calendar, /#, /rsvp, and /unrsvp
   * after verifying the desired calendar exists
   * @param {Message} message hostess.argument should have format: [admin_chat_id].[calendar_id]
   * @param {function} callback (err, message)
   */
  associate(message, callback) {
    function get_callback(err, data) {
      if (err) {
        callback(err, message);
        return;
      }

      const calendar = data.find(calendar => calendar._id.toString() === calendar_id.toString());
      if (!calendar) {
        callback(new SelectionError(), message);
        return;
      }

      this.backend.shares.put(
        {
          chat_id: message.chat.id,
          calendar_id: calendar_id
        },
        err => callback(err, message)
      );
    }

    // prettifying some data
    const temp = message.hostess.argument.split("_");
    if (temp.length !== 2) {
      // TODO: How to deal with this error?
      callback();
      return;
    }
    const admin_chat_id = parseInt(temp[0]), calendar_id = mongojs.ObjectId(temp[1]);

    if (isNaN(admin_chat_id)) {
      callback(new SelectionError(), message);
      return;
    }
    // begin confirming calendar exists
    message.hostess.edit_type = "user";
    this.backend.calendars.get(
      admin_chat_id,
      undefined,
      get_callback.bind(this)
    );
  }


  cancel(message, callback) {
    message.hostess.edit_type = "all";
    callback(undefined, message);
  }


  change_active_calendar(message, callback) {
    function patch_callback(err) {
      if (err) {
        callback(err, message);
        return;
      }

      this.backend.calendars.patch(
        message.chat.id,
        message.hostess.data.calendar._id,
        "active",
        true,
        err => callback(err, message)
      );
    }

    function get_callback(err, data) {
      if (err) {
        callback(err, message);
        return;
      } if (data.length === 0) {
        callback(new SelectionError(), message);
        return;
      }
      
      message.hostess.data = {
        calendar: data[0]
      };

      this.backend.calendars.patch(
        message.chat.id,
        undefined,
        "active",
        false,
        patch_callback.bind(this)
      )
    }

    function active_events_delete_callback(err) {
      if (err) {
        callback(err, message);
        return;
      }

      this.backend.calendars.get(
        message.chat.id,
        message.hostess.argument - 1,
        get_callback.bind(this)
      );
    }

    message.hostess.edit_type = "calendar";
    this.backend.active_edits.delete(
      message.chat.id,
      active_events_delete_callback.bind(this)
    );
  }


  confirm_event_delete(message, callback) {
    function get_callback(err, data) {
      if (err) {
        callback(err, message);
        return;
      } else if (data.length === 0) {
        callback(new SelectionError(), message);
        return;
      }

      message.hostess.data = data[0];
      message.hostess.keyboard = Commander.createConfirmationKeyboard(
        "event",
        message.hostess.argument
      );
      callback(undefined, message);
    }
    
    message.hostess.edit_type = "event";
    this.backend.events.get(
      message.chat.id,
      message.hostess.argument - 1,
      get_callback.bind(this)
    )
  }


  create_calendar(message, callback) {
    this._create("calendar", message, callback);
  }


  create_event(message, callback) {
    this._create("event", message, callback);
  }


  delete(message, callback) {
    function get_callback(err, data) {
      if (err) {
        callback(err, message);
        return;
      } else if (data.length === 0) {
        callback(new DeleteError(), message);
        return;
      }

      func.delete(
        message.chat.id,
        data[0]._id,
        err => callback(err, message)
      );
    }

    // parsing command
    // figuring out if we're deleting a calendar or an event
    const arg = message.hostess.argument;
    let type;
    if (arg.indexOf("calander") !== -1) {
      type = "calendar";
    } else if (arg.indexOf("event") !== -1) {
      type = "event";
    } else {
      callback(new DeleteError(), message);
      return;
    }

    // figuring out which calendar/event we're deleting
    const pretty_index = parseInt(arg.replace("calendar", "").replace("event", ""));
    if (isNaN(pretty_index)) {
      callback(new DeleteError(), message);
      return;
    }


    // see if calendar/event exists
    message.hostess.edit_type = type;
    const func = type === "calendar" ? this.backend.calendars : this.backend.events;

    func.get(
      message.chat.id,
      pretty_index - 1,
      get_callback.bind(this)
    );
  }


  discard(message, callback) {
    function get_callback(err1, data) {
      if (err1) {
        callback(err1, message);
        return;
      } else if (!data[0]) {
        callback(new ActiveEditError(), message);
        return;
      }
      
      message.hostess.edit_type = data[0]["type"];
      this.backend.active_edits.delete(
        message.chat.id,
        err2 => callback(err2, message)
      )
    }

    this.backend.active_edits.get(
      message.chat.id,
      get_callback.bind(this)
    );
  }


  get_info_calendar(message, callback) {
    
  }


  get_info_event(messge, callback) {

  }


  list_calendars(message, callback) {
    this._list("calendar", message, callback);
  }


  list_events(message, callback) {
    this._list("event", message, callback);
  }


  preview(message, callback) {
    function get_callback(err, data) {
      if (err) {
        callback(err, message);
        return;
      } else if (!data[0]) {
        callback(new ActiveEditError(), message);
        return;
      }

      message.hostess.edit_type = data[0]["type"];
      message.hostess.data = data[0];
      callback(undefined, message);
    }

    this.backend.active_edits.get(
      message.chat.id,
      get_callback.bind(this)
    );
  }

  publish(message, callback) {
    function get_callback(err, data) {
      if (err) {
        callback(err, message);
        return;
      } else if (data.length === 0) {
        callback(new ActiveCalendarError(), message);
        return;
      }

      const active_calendar = data.find( calendar => calendar.active );
      if (!active_calendar) {
        callback(new ActiveCalendarError(), message);
        return;
      }

      message.hostess.data = {
        "admin_chat_id": message.chat.id,
        "calendar_id": active_calendar._id
      };

      callback(undefined, message);
    }

    message.hostess.edit_type = "calendar";
    this.backend.calendars.get(
      message.chat.id,
      undefined,
      get_callback.bind(this)
    );
  }


  retrieve_calendar(message, callback) {
    function get_callback(err, data) {
      if (err) {
        callback(err, message);
        return;
      }

      const calendar = data.filter( calendar => calendar.active );
      if (calendar.length === 0) {
        callback(new ActiveCalendarError(), message);
        return;
      }

      this.backend.active_edits.put(
        calendar[0],
        err => callback(err, message)
      );
    }
    message.hostess.edit_type = "calendar";
    this.backend.calendars.get(
      message.chat.id,
      undefined,
      get_callback.bind(this)
    );
  }

  retrieve_event(message, callback) {
    function get_callback(err, data) {
      if (err) {
        callback(err, message);
        return;
      } else if (data.length === 0) {
        callback(new SelectionError(), message);
        return;
      }

      this.backend.active_edits.put(
        data[0],
        err => callback(err, message)
      );
    }

    message.hostess.edit_type = "event";
    this.backend.events.get(
      message.chat.id,
      message.hostess.argument - 1,
      get_callback.bind(this)
    );
  }

  save(message, callback) {
    function get_callback(err, data) {
      if (err) {
        callback(err, message);
        return;
      } else if (!data[0]) {
        callback(new ActiveEditError(), message);
        return;
      } else if (!data[0]["title"]) {
        callback(new SaveError(), message);
        return;
      }

      message.hostess.edit_type = data[0]["type"];
      if (message.hostess.edit_type === "calendar") {
        this._save_calendar(data[0], message, callback);
      } else {
        this._save_event(data[0], message, callback);
      }
    }

    this.backend.active_edits.get(
      message.chat.id,
      get_callback.bind(this)
    );
  }


  set_property(message, callback) {
    function get_callback(err, data) {
      if (err) { // database error
        callback(err, message);
        return;
      } else if (!data[0]) { // no active edit found
        callback(new ActiveEditError(), message);
        return;
      }
      
      //
      message.hostess.edit_type = data[0]["type"];
      const property = message.hostess.request_command;
      const property_validated = this._validate_property(data[0]["type"], property);
      if (!property_validated) { // contextually invalid property provided
        callback(new PropertyError(), message);
        return;
      }

      this.backend.active_edits.patch(
        message.chat.id,
        property,
        message.hostess.argument,
        this.cb(message, callback).bind(this)
      );
    }

    this.backend.active_edits.get(
      message.chat.id,
      get_callback.bind(this)
    )
    const property = message.hostess.request_command;
  }


  mappedFunction(command) {
      return this.map[command].bind(this);
  }


  _validate_property(type, property) {
    const properties = {
      "calendar": ["title", "description"],
      "event": ["title", "description", "summary", "location", "link", "from", "to"]
    };

    try { 
      return properties[type].indexOf(property) !== -1;
    } catch(err) {
      return false;
    }
  }


  _create(type, message, callback) {
    function delete_callback(err) {
      if (err) {
        callback(err);
        return;
      }

      this.backend.active_edits.post(
        message.chat.id,
        type,
        this.cb(message, callback)
      );
    }

    message.hostess.edit_type = type;
    this.backend.active_edits.delete(
      message.chat.id,
      delete_callback.bind(this)
    );
  }


  _list(type, message, callback) {
    function get_callback(err, data) {
      if (err) { //database error
        callback(err, message);
        return;
      }

      message.hostess.data = { "items" : data };
      callback(undefined, message);
    }

    message.hostess.edit_type = type;
    const func = type === "calendar" ? this.backend.calendars : this.backend.events;
    func.get(
      message.chat.id,
      undefined,
      get_callback.bind(this)
    );
  }


  _save_calendar(calendar, message, callback) {
    /* after desired calendar is saved, delete active edit */
    function calendar_put_callback(err) {
      if (err) {
        callback(err, message);
        return;
      }

      this.backend.active_edits.delete(
        message.chat.id,
        err2 => callback(err2, message)
      );
    }

    /* sets all calendars to not active
       then saves desired calendar */
    function calendar_patch_callback(err) {
      if (err) {
        callback(err, message);
        return;
      }

      this.backend.calendars.put(
        calendar,
        calendar_put_callback.bind(this)
      );
    }

    // set saved calendar to active calendar
    calendar.active = true;
    this.backend.calendars.patch(
      message.chat.id,
      undefined,
      "active",
      false,
      calendar_patch_callback.bind(this)
    );
  }

  _save_event(event, message, callback) {
    function put_callback(err) {
      if (err) {
        callback(err, message);
        return;
      }

      this.backend.active_edits.delete(
        message.chat.id,
        err => callback(err, message)
      );
    }

    this.backend.events.put(
      event,
      put_callback.bind(this)
    );
  }

  static parseListCommand(command) {
    const prefixes = ["c", "e", "dc", "de"];
    const prefix = command.replace(/[0-9]/g, "");
    const postfix = parseInt(command.replace(/[a-z]/g, ""));

    if (prefixes.indexOf(prefix) !== -1 && !isNaN(postfix)) {
      return {
        command: prefix,
        argument: postfix
      };
    } else {
      return false;
    }
  }


  static parseCommand(text) {
    const args = text.split(" ");
  
    // no command was provided
    if (args[0][0] !== "/") {
      return {
        command: undefined,
        argument: args.join(" ")
      };
    }

    // trivial split
    const parsed = {};
    parsed["command"] = args[0].toLowerCase().replace("/", "").replace("@groupmeetupbot", "");
    parsed["argument"] = args.slice(1).join(" ");

    // also checking for list command case
    return this.parseListCommand(parsed["command"]) || parsed;
  }

  static createConfirmationKeyboard(type, pretty_index) {
    const inline_keyboard = [
      [
        {
          text: `Yes, delete this ${type}.`,
          callback_data: `/delete ${type}${pretty_index}`
        }
      ],
      [
        {
          text: `No, don't delete this ${type}`,
          callback_data: "/cancel"
        }
      ]
    ];

    return {
      "inline_keyboard": inline_keyboard
    };
  }
}


module.exports = Commander;