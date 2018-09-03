// requirements
const mongojs = require("mongojs");
const config = require("./config");


const conn_str = config.mongo.user + ":" + config.mongo.pass + "@" + config.mongo.host + "/" + config.mongo.database;
const db = mongojs("temp:temptemp@localhost/hostess");
const collection = db.collection("data");


function find_focus(user_id, callback) {
    collection.find({user_id: user_id}, {focus: 1}, callback);
}


function update_focus(user_id, focus, callback) {
    let update = {};
    update[focus ? "$set" : "$unset"] = { focus: focus };
    collection.update({user_id: user_id}, update, {upsert: true}, callback);
}


module.exports = {
    find_focus: find_focus,
    update_focus: update_focus
}