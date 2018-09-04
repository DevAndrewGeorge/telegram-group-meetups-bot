// requirements
const mongojs = require("mongojs");
const config = require("./config");
const focus = require("./focus");


// connection setup
const conn_str = config.mongo.user + ":" + config.mongo.pass + "@" + config.mongo.host + "/" + config.mongo.database;
const db = mongojs(conn_str);
const collection = db.collection("data");


//
function find_focus(user_id, callback) {
    collection.find({user_id: user_id}, {focus: 1}, callback);
}


//
function update_focus(user_id, focus_str, callback) {
    let update = {};
    update[focus_str ? "$set" : "$unset"] = { focus: focus_str };
    collection.update({user_id: user_id}, update, {upsert: true}, callback);
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
                console.log(err);
                const prev_focus_str = focus.get_next_focus(null, {calendar_id: 0});
                const next_focus_str = focus.get_next_focus(prev_focus_str, {calendar_id: 0});
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
        // TODO: handle error

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
                // TODO: error handling
                const next_focus_str = focus.get_next_focus(focus_str, focus.parse_focus(focus_str));
                update_focus(user_id, next_focus_str, callback);

            }
        );
    });
}


//
module.exports = {
    find_focus: find_focus,
    update_focus: update_focus,
    create: create,
    edit: edit
}