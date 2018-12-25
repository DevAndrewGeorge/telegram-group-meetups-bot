/* ==============================================
EXTERNAL MODULES
============================================== */
const mongojs = require("mongojs");
const winston = require("winston");


function log(funcName, err) {
  winston.logger.get("database").error(funcName + " - " + err.toString());
}


class Calendars {
  constructor(collection) {
    this.collection = collection;
  }

  put(data, callback) {
    this.collection.update(
      {_id: data._id},
      data,
      {upsert: true},
      callback
    );
  }
}

module.exports = Calendars;