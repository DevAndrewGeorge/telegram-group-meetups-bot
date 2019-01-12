/* ==============================================
EXTERNAL MODULES
============================================== */
const mongojs = require("mongojs");
const winston = require("winston");
const Alerter = require("error-alerts");
const ActiveEdits = require("./collections/ActiveEdits");
const Calendars = require("./collections/Calendars");
const Events = require("./collections/Events");
const Shares = require("./collections/Shares");
const Rsvps = require("./collections/Rsvps");


/* ==============================================
GLOBAL VARIABLES
============================================== */
let db = undefined;
const output = {};


/* ==============================================
SETUP RELATED FUNCTIONS
============================================== */
function initalize(config) {
  // only initialize once
  if (db) {
    return;
  }

  //
  const conn_str = `${config.user}:${config.pass}@${config.host}/${config.database}?ssl=${config.ssl}${ config.replica_set ? `&replicaSet=${config.replica_set}` : ""}`;
  
  db = mongojs(conn_str, ["active_edits"]);
  output.active_edits = new ActiveEdits(db.collection("active_edits"));
  output.calendars = new Calendars(db.collection("calendars"));
  output.events = new Events(db.collection("calendars"));
  output.shares = new Shares(db.collection("shares"));
  output.rsvps = new Rsvps(db.collection("calendars"));

  //
  db.on("connect", function() {
    winston.loggers.get("database").info(
      "Successfully established database connection."
    );
  });

  // error handling
  db.on("error", function(err) {
    Alerter.tell(err);
  });
}


//
output["initalize"] = initalize;
module.exports = output;
