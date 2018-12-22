/* ==============================================
EXTERNAL MODULES
============================================== */
const mongojs = require("mongojs");
const winston = require("winston");
const ActiveEdits = require("./collections/ActiveEdits");


/* ==============================================
GLOBAL VARIABLES
============================================== */
let db = undefined;
const output = {};


/* ==============================================
SETUP RELATED FUNCTIONS
============================================== */
function initalize(mongo_config) {
  // only initialize once
  if (db) {
    return;
  }

  //
  const conn_str = mongo_config.user + ":" + mongo_config.pass + "@" + mongo_config.host + "/" + mongo_config.database;
  db = mongojs(conn_str, ["active_edits"]);
  output.active_edits = new ActiveEdits(db.collection("active_edits"));

  //
  db.on("connect", function() {
    console.log(db);
    winston.loggers.get("database").info(
      "Successfully established database connection."
    );
  });
}


//
output["initalize"] = initalize;
module.exports = output;