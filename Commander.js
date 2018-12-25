const SaveError = require("./errors/SaveError");
const ActiveEditError = require("./errors/ActiveEditError");
const PropertyError = require("./errors/PropertyError");
const SelectionError = require("./errors/SelectionError");


class Commander {
  constructor(backend) {
    this.backend = backend;
    this.map = {
      // calendars
      "createcalendar": this.create_calendar,
      "switchcalendar": this.list_calendars,

      // events
      "createevent": this.create_event,
      "editevent": this.list_events,

      // properties
      "title": this.set_property,
      "description": this.set_property,
      "location": this.set_property,
      "link": this.set_property,
      "from": this.set_property,
      "to": this.set_property,

      // create actions
      "preview": this.preview,
      "discard": this.discard,
      "save": this.save,

      //list commands
      "c": this.change_active_calendar,
      "e": undefined,
      "dc": undefined,
      "de": undefined
    };
  }


  cb(message, callback) {
    return function(err) {
      callback(err, message);
    }
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

    message.hostess.edit_type = "calendar";
    this.backend.calendars.get(
      message.chat.id,
      message.hostess.argument - 1,
      get_callback.bind(this)
    );
  }


  create_calendar(message, callback) {
    this._create("calendar", message, callback);
  }


  create_event(message, callback) {
    this._create("event", message, callback);
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
      if (true || message.hostess.edit_type === "calendar") {
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
      "event": ["title", "description", "location", "link", "from", "to"]
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
    // TODO: delete active edit
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
      return false;
    }

    // trivial split
    const parsed = {};
    parsed["command"] = args[0].replace("/", "");
    parsed["argument"] = args.slice(1).join(" ");

    // also checking for list command case
    return this.parseListCommand(parsed["command"]) || parsed;
  }
}


module.exports = Commander;