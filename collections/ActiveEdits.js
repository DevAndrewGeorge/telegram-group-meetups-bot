/* ==============================================
EXTERNAL MODULES
============================================== */
const mongojs = require("mongojs");
const winston = require("winston");


function log(error_message) {
  winston.logger.get("application").error({
    label: "DB",
    message: error_message
  });
}


class ActiveEdits {
  constructor(collection) {
    this.collection = collection;
  }

  post(chat_id, type, callback) {
    this.collection.insert(
      {chat_id: chat_id, type: type},
      function(err) {
        if (err) {
          log("ActiveEdits:post");
        }
        callback(err);
      }
    );
  }

  del(chat_id, callback) {
    this.collection.remove(
      { chat_id: chat_id },
      function(err) {
        if (err) {
          log("ActiveEdits:delete");
        }
        callback(err);
      }
    );
  }
}

module.exports = ActiveEdits;