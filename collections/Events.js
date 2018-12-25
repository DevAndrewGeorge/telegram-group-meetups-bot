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


  get(admin_chat_id, event_index, callback) {
    const pipeline = [
      { $match: {admin_chat_id: admin_chat_id, active: true} },
      { $project: { events: 1 } },
      { $unwind: "$events" },
      { $replaceRoot: { newRoot: "$events" } },
      { $sort: { from: 1, to: 1, creation_timestamp: 1} }
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
    )
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


  delete(admin_chat_id, event_index, callback) {

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
    )
  }
}

module.exports = Events;