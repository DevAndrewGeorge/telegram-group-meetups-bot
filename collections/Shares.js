/* ==============================================
EXTERNAL MODULES
============================================== */
const mongojs = require("mongojs");
const winston = require("winston");


function log(funcName, err) {
  winston.loggers.get("database").error(funcName + " Events- " + err.toString());
}


class Shares {
  constructor(collection) {
    this.collection = collection;
  }


  get(chat_id, callback) {
    this.collection.find(
      { chat_id: chat_id },
      function (err, data) {
        if (err) {
          log("Shares:get", err);
        }
        callback(err, data);
      }
    );
  }


  put(share, callback) {
    this.collection.update(
      { chat_id: share.chat_id },
      share,
      { upsert: true },
      function (err) {
        if (err) {
          log("Shares:put", err);
        }
        callback(err);
      }
    );
  }

  
  delete(chat_id, callback) {
    this.collection.remove(
      { chat_id: chat_id },
      function (err) {
        if (err) {
          log("Shares:delete", err);
        }
        callback(err);
      }
    );
  }
}


module.exports = Shares;
