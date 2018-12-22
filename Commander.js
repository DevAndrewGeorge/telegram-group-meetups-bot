class Commander {
  constructor(backend) {
    this.backend = backend;
    this.map = {
      "createcalendar": this.create_calendar
    };
  }

  cb(message, callback) {
    return function(err) {
      callback(err, message);
    }
  }

  create_calendar(message, callback) {
    function delete_callback(err) {
      if (err) {
        callback(err);
        return;
      }

      this.backend.active_edits.post(
        message.chat.id,
        "calendar",
        this.cb(message, callback)
      );
    }
    
    this.backend.active_edits.del(
      message.chat.id,
      delete_callback.bind(this)
    );
  }

  mappedFunction(command) {
    return this.map[command].bind(this);
  }
}

module.exports = Commander;