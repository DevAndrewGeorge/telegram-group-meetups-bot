// requirements
const mongojs = require("mongojs");
const config = require("./config");
const focus = require("./focus");
const MongoError = require("./MongoError");


// connection setup
const conn_str = config.mongo.user + ":" + config.mongo.pass + "@" + config.mongo.host + "/" + config.mongo.database;
const db = mongojs(conn_str);
const collection = db.collection("data");


//
function find_focus(user_id, callback) {
    collection.find({user_id: user_id}, {focus: 1}, function(err, result) {
        callback(
            err ? new MongoError("find_focus", user_id, err) : null,
            result
        );
    });
}


//
function update_focus(user_id, focus_str, callback) {
    let update = {};
    update[focus_str ? "$set" : "$unset"] = { focus: focus_str };
    collection.update({user_id: user_id}, update, {upsert: true}, function(err, result) {
        callback(
            err ? new MongoError("update_focus", user_id, err) : null,
            result
        );
    });
}


//
function create(user_id, type, title, callback) {
    if (type === 'calendar') {
        collection.update(
            {user_id: user_id},
            {
                $push: {
                    calendars: {
                        $each: [{title: title}],
                        $position: 0
                    }
                }
            },
            { upsert: true },
            function(err, result) {
                if (err) {
                    callback(new MongoError("create", user_id, err));
                    return;
                }
                
                // getting the event after the title field
                const prev_focus_str = focus.get_next_focus(null, {calendar_id: 0});
                let next_focus_str = focus.get_next_focus(prev_focus_str, {calendar_id: 0});
                next_focus_str = focus.get_next_focus(next_focus_str, {calendar_id: 0});
                update_focus(user_id, next_focus_str, callback);
            }
        );
    } else if (type === 'event') {
        // TODO: handle event case
    } else {
        // TODO: handle exceptional case
    }
}


function edit(user_id, value, callback) {
    function final(err, result) {
        // TODO: error handling

    }

    find_focus(user_id, function(err, docs) {
        if (err) {
            callback(err);
            return;
        }
        
        // creating update object
        const set = {};
        focus_str = docs[0]["focus"];
        set[ focus_str ] = value;

        // updating the focused property
        collection.update(
            {user_id: user_id},
            {$set: set},
            // transition to the next focused property
            function(err, result) {
                if (err) {
                    callback(new MongoError("edit", user_id, err));
                    return;
                }

                const next_focus_str = focus.get_next_focus(focus_str);
                update_focus(user_id, next_focus_str, callback);

            }
        );
    });
}


//
function show(user_id, focus_str, callback) {
    collection.find({user_id: user_id}, {}, function(err, docs) {
        if (err) {
            callback(new MongoError("show", user_id, err));
            return;
        }

        const targets = focus.parse_focus(focus_str);
        const calendars = docs[0]["calendars"] || [];

        if (!targets["calendar_id"]) {
            callback(null, calendars);
        } else {
            if (targets["calendar_id"] >= calendars.length) {
                callback(RangeError());
                return;
            }

            const calendar = calendars[targets["calendar_id"]];
            
            if (!targets["event_id"]) {
                callback(null, calendar);
            } else {
                const events = calendar["events"];
                if (targets["event_id"] >= events.length) {
                    callback(RangeError());
                    return;
                }
                callback(null, events[targets["event_id"]]);
            }
        }

    });
}


//
module.exports = {
    find_focus: find_focus,
    update_focus: update_focus,
    create: create,
    edit: edit,
    show: show
}