const mongojs = require("mongojs");
const SaveError = require("./errors/SaveError");
const ActiveEditError = require("./errors/ActiveEditError");
const PropertyError = require("./errors/PropertyError");
const SelectionError = require("./errors/SelectionError");
const DeleteError = require("./errors/DeleteError");
const InviteError = require("./errors/InviteError");
const ActiveCalendarError = require("./errors/ActiveCalendarError");
const Transforms = require("./transforms");


class Commander {
  constructor(backend) {
    this.backend = backend;
    this.map = {
      // actions for all
      "contact": this.contact,

      // calendars
      "createcalendar": this.create_calendar,
      "selectcalendar": this.list_calendars,
      "deletecalendar": this.list_calendars,
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

      // edit actions
      "preview": this.preview,
      "discard": this.discard,
      "save": this.save,
      "delete": this.delete,
      "cancel": this.cancel,
      "help": this.help,
      "admin": this.admin,

      //list commands
      "c": this.change_active_calendar,
      "e": this.retrieve_event,
      "dc": this.confirm_calendar_delete,
      "de": this.confirm_event_delete,

      // user commands
      "publish": this.publish,
      "start": this.start,
      "calendar": this.get_info_calendar,
      "event": this.get_info_event,
      "rsvp": this.rsvp,
      "unrsvp": this.unrsvp
    };
  }


  cb(message, callback) {
    return function(err) {
      callback(err, message);
    };
  }

  admin(message, callback) {
    message.hostess.edit_type = "help";
    callback(undefined, message);
  }


  cancel(message, callback) {
    message.hostess.edit_type = "all";
    if (!message.hostess.argument) {
      message.hostess.response_mute = true;
    }
    callback(undefined, message);
  }


  change_active_calendar(message, callback) {
    function second_patch_callback(err) {
      if (err) {
        callback(err, message);
        return;
      }

      this.backend.shares.put(
        {
          chat_id: message.chat.id,
          calendar_id: message.hostess.data.calendar._id
        },
        err => callback(err, message)
      );
    }

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
        second_patch_callback.bind(this)
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
      
      message.hostess.data = { calendar: data[0] };

      this.backend.calendars.patch(
        message.chat.id,
        undefined,
        "active",
        false,
        patch_callback.bind(this)
      );
    }

    function active_events_delete_callback(err) {
      if (err) {
        callback(err, message);
        return;
      }

      this.backend.calendars.get(
        message.chat.id,
        calendar_index,
        get_callback.bind(this)
      );
    }

    // validate argument this command relies on
    const calendar_index = parseInt(message.hostess.argument) - 1;
    if (isNaN(calendar_index)) {
      callback(new SelectionError(), message);
      return;
    }

    message.hostess.edit_type = "calendar";
    this.backend.active_edits.delete(
      message.chat.id,
      active_events_delete_callback.bind(this)
    );
  }


  confirm_calendar_delete(message, callback) {
    this._confirm_delete("calendar", message, callback);
  }


  confirm_event_delete(message, callback) {
    this._confirm_delete("event", message, callback);
  }


  contact(message, callback) {
    message.hostess.edit_type = "all";
    callback(undefined, message);
  }


  create_calendar(message, callback) {
    this._create("calendar", message, callback);
  }


  create_event(message, callback) {
    this._create("event", message, callback);
  }


  delete(message, callback) {
    function delete_callback(err, results) {
      if (err) {
        callback(err, message);
        return;
      } else if (results.nRemoved === 0) {
        callback(new DeleteError(), message);
        return;
      }
      callback(undefined, message);
    }

    // parsing command
    // figuring out if we're deleting a calendar or an event
    const words = message.hostess.argument.split("_");
    const type = words[0];
    if (type !== "calendar" && type !== "event") {
      callback(new DeleteError(), message);
      return;
    }

    let _id;
    try {
      _id = mongojs.ObjectId(words[1]);
    } catch(err) {
      callback(new DeleteError(), message);
      return;
    }

    // see if calendar/event exists
    message.hostess.edit_type = type;
    const func = type === "calendar" ? this.backend.calendars : this.backend.events;

    func.delete(
      _id,
      delete_callback.bind(this)
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
      );
    }

    this.backend.active_edits.get(
      message.chat.id,
      get_callback.bind(this)
    );
  }


  /**
   * Gets published calendar.
   * @param {Telegram Message} message 
   * @param {function} callback (err, message)
   */
  get_info_calendar(message, callback) {
    function get_by_id_callback(err, data) {
      if (err) {
        callback(err, message);
        return;
      } else if (data.length === 0) {
        callback(new SelectionError(), message);
        return;
      }

      message.hostess.data = { calendar: data[0] };
      callback(undefined, message);
    }

    function get_callback(err, data) {
      if (err) {
        callback(err, message);
        return;
      } else if (data.length === 0) {
        callback(new SelectionError(), message);
      }

      this.backend.calendars.get_by_id(
        data[0].calendar_id,
        get_by_id_callback.bind(this)
      );
    }

    message.hostess.edit_type = "user";
    this.backend.shares.get(
      message.chat.id,
      get_callback.bind(this)
    );
  }

  /**
   * Retrieves event associated with the published calendar.
   * @param {Telegram Message} message hostess.argument must evaluate to an int.
   * @param {function} callback (err, message)
   */
  get_info_event(message, callback) {
    function events_get_by_idx_callback(err, data) {
      if (err) {
        callback(err, message);
        return;
      } if ( data.length === 0) {
        callback(new SelectionError(), message);
        return;
      }

      message.hostess.data = { event: data[0] };
      message.hostess.keyboard = Commander.createRsvpKeyboard(
        message.from.id,
        data[0]._id.toString()
      ); 

      callback(undefined, message);
    }

    function shares_get_callback(err, data) {
      if (err) {
        callback(err, message);
        return;
      } else if (data.length === 0) {
        callback(new SelectionError(), message);
        return;
      }

      const event_index = parseInt(message.hostess.argument) - 1;
      if (isNaN(event_index)) {
        callback(new SelectionError(), message);
        return;
      }

      this.backend.events.get_by_idx(
        data[0].calendar_id,
        message.hostess.argument - 1,
        events_get_by_idx_callback
      );
    }

    message.hostess.edit_type = "user";
    this.backend.shares.get(
      message.chat.id,
      shares_get_callback.bind(this)
    );
  }


  help(message, callback) {
    let active_calendar_exists;
    let active_edit_type;

    function shares_get_callback(err, data) {
      if (err) {
        callback(err, message);
        return;
      }

      let response_command;
      if (data.length) {
        response_command = "calendar";
        message.hostess.data = { "calendar": data[0] };
      } else {
        response_command = "start";
      }

      message.hostess.response_command = response_command;
      callback(undefined, message);
    }


    function calendars_get_callback(err, data) {
      if (err) {
        callback(err, message);
        return;
      }

      let active_calendar = active_calendar_exists = data.find( calendar => calendar.active );

      // determining response if possible
      let response_command;
      if (active_calendar_exists) {
        switch (active_edit_type) {
        case "calendar":
          response_command = "createcalendar";
          break;
        case "event":
          response_command = "createevent";
          break;
        default:
          response_command = "c";
          message.hostess.data = { "calendar": active_calendar };
          break;
        }
      } else if (active_edit_type === "calendar") {
        response_command = "createcalendar";
      }

      // packing data and leaving if response already determined
      if (response_command) {
        message.hostess.response_command = response_command;
        callback(undefined, message);
        return;
      }
      
      // one final check
      this.backend.shares.get(
        message.chat.id,
        shares_get_callback
      );
      
    }


    function active_edits_get_callback(err, data) {
      if (err) {
        callback(err, message);
        return;
      }

      if (data.length) {
        active_edit_type = data[0].type;
        message.hostess.data = { [active_edit_type]: data[0] };
      }

      this.backend.calendars.get(
        message.chat.id,
        undefined,
        calendars_get_callback.bind(this)
      );
    }

    message.hostess.edit_type = "help";
    this.backend.active_edits.get(
      message.chat.id,
      active_edits_get_callback.bind(this)
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
      message.hostess.data = { [message.hostess.edit_type]: data[0] };
      callback(undefined, message);
    }

    this.backend.active_edits.get(
      message.chat.id,
      get_callback.bind(this)
    );
  }

  /**
   * Generates a link to invite bot to a group chat.
   * @param {Message} message 
   * @param {function} callback (err, messgae)
   */
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
        publish: {
          calendar_id: active_calendar._id
        }
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

  /**
   * Places a calendar in active_edits.
   * @param {Message} message 
   * @param {function} callback (err, message)
   */
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

  /**
   * Places an event in active_edits.
   * @param {Message} message hostess.argument must validate to an int.
   * @param {function} callback (err, message)
   */
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

    // validate argument this command relies on
    const event_index = parseInt(message.hostess.argument) - 1;
    if (isNaN(event_index)) {
      callback(new SelectionError(), message);
      return;
    }

    message.hostess.edit_type = "event";
    this.backend.events.get(
      message.chat.id,
      message.hostess.argument - 1,
      get_callback.bind(this)
    );
  }

  /**
   * 
   * @param {Telegram Message} message 
   * @param {function} callback (err, messge)
   */
  rsvp(message, callback) {
    function patch_callback(err, results) {
      if (err) {
        callback(err, message);
        return;
      } else if (results.nMatched === 0) {
        callback(new SelectionError(), message);
        return;
      }

      message.hostess.data.rsvp.username = message.from.username;

      callback(undefined, message);
    }
      

    function event_get_callback(err, data) {
      if (err) {
        callback(err, message);
        return;
      } else if (data.length === 0) {
        callback(new SelectionError(), message);
        return;
      }

      message.hostess.data.rsvp.title = data[0].title;

      this.backend.rsvps.patch(
        event_id,
        message.from.id,
        patch_callback.bind(this)
      );
    }

    message.hostess.edit_type = "user";
    message.hostess.data = {
      rsvp: {}
    };

    let event_id;
    try {
      event_id = mongojs.ObjectId(message.hostess.argument);
    } catch (err) {
      callback(new SelectionError(), message);
      return;
    }
    
    this.backend.events.get_by_id(
      event_id,
      event_get_callback.bind(this)
    );
  }

  unrsvp(message, callback) {
    function event_get_callback(err, data) {
      if (err) {
        callback(err, message);
        return;
      } else if (data.length === 0) {
        callback(new SelectionError(), message);
        return;
      }

      message.hostess.data.unrsvp.title = data[0].title;

      this.backend.rsvps.delete(
        event_id,
        message.from.id,
        err => callback(err, message)
      );
    }

    message.hostess.edit_type = "user";
    message.hostess.data = {
      unrsvp: { username: message.from.username }
    };

    let event_id;
    try {
      event_id = mongojs.ObjectId(message.hostess.argument);
    } catch (err) {
      callback(new SelectionError(), message);
      return;
    }
    this.backend.events.get_by_id(
      event_id,
      event_get_callback.bind(this)
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
        Commander.transform_property(property, message.hostess.argument),
        this.cb(message, callback).bind(this)
      );
    }

    this.backend.active_edits.get(
      message.chat.id,
      get_callback.bind(this)
    );
  }


  start(message, callback) {
    if (message.hostess.argument) {
      this._associate(message, callback);
    } else {
      message.hostess.edit_type = "help";
      callback(undefined, message);
    }
  }


  mappedFunction(command) {
    return this.map[command].bind(this);
  }

  /**
   * Checks if [property] is configurable for [type].
   * @param {string} type "calendar" or "event"
   * @param {string} property 
   * @returns {boolean}
   */
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


  /**
   * Enables user commands such as /calendar, /#, /rsvp, and /unrsvp
   * after verifying the desired calendar exists
   * @param {Message} message hostess.argument should have format: [admin_chat_id].[calendar_id]
   * @param {function} callback (err, message)
   */
  _associate(message, callback) {
    function get_callback(err, data) {
      if (err) {
        callback(err, message);
        return;
      } else if (data.length === 0) {
        callback(new InviteError(), message);
      }

      this.backend.shares.put(
        {
          chat_id: message.chat.id,
          calendar_id: calendar_id
        },
        err => callback(err, message)
      );
    }

    let calendar_id; 
    try {
      calendar_id = mongojs.ObjectId(message.hostess.argument);
    } catch(err) {
      callback(new InviteError(), message);
      return;
    }

    message.hostess.edit_type = "user";
    this.backend.calendars.get_by_id(
      calendar_id,
      get_callback.bind(this)
    );
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

  /**
   * 
   * @param {string} type "calendar" or "event"
   * @param {Message} message hostess.argument must evaulate to an int.
   * @param {function} callback (err, message)
   */
  _confirm_delete(type, message, callback) {
    function get_callback(err, data) {
      if (err) {
        callback(err, message);
        return;
      } else if (data.length === 0) {
        callback(new SelectionError(), message);
        return;
      }

      message.hostess.data = {
        [type]: data[0]
      };

      message.hostess.keyboard = Commander.createConfirmationKeyboard(
        type,
        data[0]._id
      );

      callback(undefined, message);
    }
    
    const index = parseInt(message.hostess.argument) - 1;
    if (isNaN(index)) {
      callback(new SelectionError(), message);
      return;
    }

    message.hostess.edit_type = type;
    const func = type === "calendar" ? this.backend.calendars : this.backend.events;
    func.get(
      message.chat.id,
      index,
      get_callback.bind(this)
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
    /* after sharing the calendar to the chat, delete the active edit */
    function shares_put_callback(err) {
      if (err) {
        callback(err, message);
        return;
      }

      this.backend.active_edits.delete(
        message.chat.id,
        err2 => callback(err2, message)
      );
    }

    /* after desired calendar is saved, share the calendar to the chat */
    function calendar_put_callback(err) {
      if (err) {
        callback(err, message);
        return;
      }

      this.backend.shares.put(
        {
          chat_id: message.chat.id,
          calendar_id: calendar._id
        },
        shares_put_callback.bind(this)
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

  /**
   * Validates if passed text is a recognized command.
   * @param {string} text 
   */
  static parseCommand(text) {
    //
    const words = text.split(" ");

    // no command was provided
    if (words[0][0] !== "/") {
      return {
        command: undefined,
        argument: text
      };
    }

    // determining command type
    let command, argument;
    const raw_command = words[0].slice(1).toLowerCase().replace("@groupmeetupsbot", "");
    if (/^[a-z]+$/g.test(raw_command)) { // all alpha commands
      command = raw_command;
      argument = words.slice(1).join(" ");
    } else if (/^[1-9][0-9]*$/g.test(raw_command)) { // user list commands
      command = "event";
      argument = parseInt(raw_command);
    } else if (/^((c)|(e)|(dc)|(de))[1-9][0-9]*$/g.test(raw_command)) { // admin list commands
      command = raw_command.match(/^((c)|(e)|(dc)|(de))/g)[0];
      argument = parseInt(raw_command.match(/[1-9][0-9]*$/g));
    }

    return {
      command: command,
      argument: argument
    };
  }


  /**
   * Transforms a property's value if desired.
   * @param {string} property 
   * @param {string} value 
   * @returns {*} the transfromed value
   */
  static transform_property(property, value) {
    const transformations = {
      "from": Transforms.transform_date_string,
      "to": Transforms.transform_date_string
    };

    if (property in transformations) {
      value = transformations[property](value);
    }

    return value;
  }


  static createRsvpKeyboard(guest_id, event_id) {
    const inline_keyboard = [
      [
        {
          text: "I'm going!",
          callback_data: `/rsvp ${event_id}`
        },
        {
          text: "I'm not going.",
          callback_data: `/unrsvp ${event_id}`
        }
      ]
    ];

    return {
      "inline_keyboard": inline_keyboard
    };
  }


  static createConfirmationKeyboard(type, _id) {
    const inline_keyboard = [
      [
        {
          text: `Yes, delete this ${type}.`,
          callback_data: `/delete ${type}_${_id.toString()}`
        }
      ],
      [
        {
          text: `No, don't delete this ${type}`,
          callback_data: "/cancel 1"
        }
      ]
    ];

    return {
      "inline_keyboard": inline_keyboard
    };
  }
}


module.exports = Commander;
