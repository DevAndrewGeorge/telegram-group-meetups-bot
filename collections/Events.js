/* ==============================================
EXTERNAL MODULES
============================================== */
const mongojs = require("mongojs");
const winston = require("winston");


function log(funcName, err) {
  winston.loggers.get("database").error(funcName + " - " + err.toString());
}


class Events {
  constructor(collection) {
    this.collection = collection;
  }


  get(admin_chat_id, event_id, callback) {

  }


  put(admin_chat_id, event_id, callback) {

  }


  delete(admin_chat_id, event_id, callback) {

  }


  _get_active_calendar(admin_chat_id, callback) {
    const query = {
      "admin_chat_id": admin_chat_id,
      "active": true
    };

    this.collection.find(
      query,
      (err, docs) => {
        if (err) {
          log("Events:_get_active_calendar", err);
        }
        // TODO: return docs or just events?
        callback(err, docs);
      }
    )
  }
}

module.exports = Events;