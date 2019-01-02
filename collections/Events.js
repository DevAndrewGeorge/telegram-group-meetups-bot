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

  /**
   * Retrieves all events, sorted by from/to, associated with the given [calendar_id].
   * @param {ObjectId} calendar_id 
   * @param {*} callback (err, data). Data is an array.
   */
  get_all(calendar_id, callback) {
    this.get_by_idx(calendar_id, undefined, callback);
  }


  /**
   * Retrieves event with event_id
   * @param {ObjectId} event_id 
   * @param {function} callback (err, data). Data is an array.
   */
  get_by_id(event_id, callback) {
    const pipeline = [
      { $match: {"events._id": event_id} },
      { $unwind: "$events" },
      { $match: {"events._id": event_id} },
      { $replaceRoot: {newRoot: "$events"} }
    ];

    this.collection.aggregate(
      pipeline,
      function(err, docs) {
        if (err) {
          log("Events:get_by_id", err);
        }
        callback(err, docs);
      }
    );
  }


  /**
   * If index is provied, returns event at position [idx]. Otherwise, returns all events, sorted by from/to, for given [calendar_id].
   * @param {ObjectId} calendar_id 
   * @param {integer} idx zero-based index
   * @param {function} callback (err, documents). Data is an array.
   */
  get_by_idx(calendar_id, idx, callback) {
    const pipeline = [
      { $match: {_id: calendar_id } },
      { $unwind: "$events" },
      {
        $project: {
          events: 1,

          // caculated fields needed to force null from/to fields to sort correctly
          // if they are null, they become a boolean. numbers < boolean in mongo
          // thefore null values will appear last
          ordered_from: { $ifNull: ["$events.from", false] }
        }
      },
      {
        $sort: {
          "ordered_from": 1,
          "events.to": 1,
          "events.creation_timestamp": 1
        }
      },
      { $replaceRoot: { newRoot: "$events"} }
    ];

    if (Number.isInteger(idx)) {
      pipeline.push({ $skip: idx });
      pipeline.push({ $limit: 1 });
    }

    this.collection.aggregate(
      pipeline,
      function(err, docs) {
        if (err) {
          log("Events:get_by_idx", err);
        }
        callback(err, docs);
      }
    );
  }


  get(admin_chat_id, event_index, callback) {
    const pipeline = [
      { $match: {admin_chat_id: admin_chat_id, active: true} },
      { $unwind: "$events" },
      {
        $project: { 
          events: 1,

          // caculated fields needed to force null from/to fields to sort correctly
          // if they are null, they become a boolean. numbers < boolean in mongo
          // thefore null values will appear last
          ordered_from: { $ifNull: ["$events.from", false] }
        }
      },
      {
        $sort: {
          "ordered_from": 1,
          "events.to": 1,
          "events.creation_timestamp": 1
        }
      },
      { $replaceRoot: { newRoot: "$events" } },
    ];

    if (event_index !== undefined && event_index !== null) {
      pipeline.push(
        { $skip: event_index }
      );

      pipeline.push(
        { $limit: 1 }
      );
    }

    this.collection.aggregate(
      pipeline,
      function (err, data) {
        if (err) {
          log("Events:get", err);
        }
        callback(err, data);
      }
    );
  }


  put(event, callback) {
    function create_update_parameters(exists) {
      const update = {};
      const query = {
        admin_chat_id: event.admin_chat_id,
        active: true
      };

      
      if (exists) {
        update["$set"] = { "events.$": event };
        query["events._id"] = mongojs.ObjectId(event._id);
      } else {
        update["$push"] = { "events": event };
      }

      return {
        query: query,
        update: update
      };
    }

    this._event_exists(
      event.admin_chat_id,
      event._id,
      (err, exists) => {
        if (err) {
          log("Events:put", err);
          callback(err);
          return;
        }

        const parameters = create_update_parameters(exists);
        this.collection.update(
          parameters.query,
          parameters.update,
          function(err) {
            if (err) {
              log("Events:put", err);
            }
            callback(err);
          }
        );
      }
    );    
  }


  delete(event_id, callback) {
    const query = {
      active: true,
      "events._id": mongojs.ObjectId(event_id)
    };

    const update = {
      $pull: {
        events: {
          _id: mongojs.ObjectId(event_id)
        }
      }
    };
    
    this.collection.update(
      query,
      update,
      (err, results) => {
        if (err) {
          log("Events:delete", err);
        }
        callback(err, results);
      }
    );
  }

  _event_exists(admin_chat_id, event_id, callback) {
    const query = {
      admin_chat_id: admin_chat_id,
      active: true,
      "events._id": mongojs.ObjectId(event_id)
    };

    this.collection.find(
      query,
      function (err, data) {
        if (err) {
          log("Events:_event_exists", err);
          callback(err);
          return;
        }
        callback(undefined, data.length !== 0);
      }
    );
  }
}

module.exports = Events;
