/* ==============================================
EXTERNAL MODULES
============================================== */
const mongojs = require("mongojs");
const winston = require("winston");


function log(funcName, err) {
  winston.loggers.get("database").error(funcName + " - " + err.toString());
}


class Rsvps {
  constructor(collection) {
    this.collection = collection;
  }

  /**
   * Returns list of RSVPs for given event
   * @param {ObjectId} calendar_id 
   * @param {ObjectId} event_id 
   * @param {function} callback (err, data)
   */
  get(event_id, callback) {
    this.collection.find(
      { "events._id": mongojs.ObjectId(event_id) },
      function (err, data) {
        if (err) {
          log("Rsvps:get", err);
        }
        callback(err, data);
      }
    );
  }

  patch(event_id, user_id, callback) {
    this.collection.update(
      { "events._id": mongojs.ObjectId(event_id) },
      { $addToSet: { "events.$.rsvps": user_id } },
      { upsert: true },
      function (err, results) {
        if (err) {
          log("Rsvps:patch", err);
        }
        callback(err, results);
      }
    );
  }

  delete(event_id, user_id, callback) {
    this.collection.update(
      { "events._id": mongojs.ObjectId(event_id) },
      { $pull: { "events.$.rsvps": user_id } },
      function (err) {
        if (err) {
          log("Rsvps:delete", err);
        }
        callback(err);
      }
    );
  }
}

module.exports = Rsvps;

