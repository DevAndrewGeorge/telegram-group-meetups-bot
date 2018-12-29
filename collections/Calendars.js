/* ==============================================
EXTERNAL MODULES
============================================== */
const mongojs = require("mongojs");
const winston = require("winston");


function log(funcName, err) {
  winston.loggers.get("database").error(funcName + " - " + err.toString());
}


class Calendars {
  constructor(collection) {
    this.collection = collection;
  }

  delete(calendar_id, callback) {
    this.collection.remove(
      { _id: calendar_id },
      function (err, results) {
        if (err) {
          log("Calendars:delete", err);
        }
        callback(err, results);
      }
    );
  }


  /**
   * Retrieves all calenders that have been created, sorted by creation_timestamp, in [admin_chat_id].
   * @param {integer} admin_chat_id 
   * @param {function} callback (err, data). Data is an array.
   */
  get_all(admin_chat_id, callback) {
    this.get_by_idx(admin_chat_id, undefined, callback);
  }

  /**
   * Retrieves a calendar at [idx] created in [admin_chat_id]. If [idx] is omitted, returns all calendars created in [admin_chat_id] sorted by creation_timestamp.
   * @param {integer} admin_chat_id 
   * @param {integer} idx zero-based index
   * @param {function} callback (err, data). Data is an array.
   */
  get_by_idx(admin_chat_id, idx, callback) {
    const pipeline = [
      { $match: { admin_chat_id: admin_chat_id } },
      { $sort: { creation_timestamp: 1} }
    ];

    if (Number.isInteger(idx)) {
      pipeline.push({ $skip: idx });
      pipeline.push({ $limit: 1 });
    }

    this.collection.aggregate(
      pipeline,
      function(err, docs) {
        if (err) {
          log("Calendars:get_by_idx", err);
        }
        callback(err, docs);
      }
    );
  }


  get(admin_chat_id, calendar_index, callback) {
    const pipeline = [
      { $match: { admin_chat_id: admin_chat_id } },
      { $sort: { creation_timestamp: 1} }
    ];

    if (calendar_index !== undefined && calendar_index !== null) {
      pipeline.push(
        { $skip: calendar_index }
      );
      
      pipeline.push(
        { $limit: 1 }
      );
    }

    this.collection.aggregate(
      pipeline,
      function(err, data) {
        if (err) {
          log("Calendars:get", err);
        }
        callback(err, data);
      }
    );
  }

  /**
   * 
   * @param {mongojs.ObjectId} _id 
   * @param {function} callback (err, data)
   */
  get_by_id(_id, callback) {
    this.collection.find(
      { _id: mongojs.ObjectId(_id) },
      function (err, data) {
        if (err) {
          log("Calendars:get_by_id");
        }
        callback(err, data);
      }
    );
  }


  put(calendar, callback) {
    this.collection.update(
      {_id: calendar._id},
      calendar,
      {upsert: true},
      err => {
        if (err) {
          log("Calendars:put", err);
        }
        callback(err);
      }
    );
  }

  patch(admin_chat_id, calendar_id, property, value, callback) {
    const query = {
      "admin_chat_id": admin_chat_id
    };

    if (calendar_id) {
      query["_id"] = mongojs.ObjectId(calendar_id);
    }

    const update = { "$set": {} };
    update["$set"][property] = value;

    this.collection.update(
      query,
      update,
      { upsert: false, multi: true },
      err => {
        if (err) {
          log("Calendars:patch", err);
        }
        callback(err);
      }
    );
  }
}

module.exports = Calendars;
