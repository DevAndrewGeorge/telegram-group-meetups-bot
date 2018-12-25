const SaveError = require("./errors/SaveError");
const ActiveEditError = require("./errors/ActiveEditError");
const PropertyError = require("./errors/PropertyError");


class Commander {
  constructor(backend) {
    this.backend = backend;
    this.map = {
      "createcalendar": this.create_calendar,
      "createevent": this.create_event,
      "save": this.save,
      "title": this.set_property,
      "description": this.set_property,
      "location": this.set_property,
      "link": this.set_property,
      "from": this.set_property,
      "to": this.set_property,
      "discard": this.discard
    };
  }


  cb(message, callback) {
    return function(err) {
      callback(err, message);
    }
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


  save(message, callback) {
    function get_callback(err, data) {
      if (err) {
        callback(err, message);
        return;
      } else if (!data || data.length === 0) {
        callback(new ActiveEditError(), message);
        return;
      } else if (!data[0]["title"]) {
        callback(new SaveError(), message);
        return;
      }

      this.backend.calendars.put(
        data[0],
        this.cb(message, callback).bind(this)
      );
      // TODO: DELETE 
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
}


module.exports = Commander;