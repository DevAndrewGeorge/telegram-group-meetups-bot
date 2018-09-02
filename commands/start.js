// imports
const dialog = require("../dialog");


function start(user, chat_id, arguments, database, callback) {
    function insert_react(err, res, fields) {
        // TODO: error handling
        callback(null, dialog.render('start/0', 'createcalendar', { username: user.username }));
    }


    function lookup_react(err, res, fields) {
        // TODO: error handling
        if (res.length === 0) {
            database.set_active_calendar(user.id, null, insert_react);
            return;
        }
    
        if (res[0]['calender_title']) {
            callback(
                null, 
                dialog.render('start/2', null, {
                    username: user.username,
                    calendar_title: res[0]['calendar_title']
                })
            );
        } else {
            callback(null, dialog.render('start/1', 'createcalendar', { username: user.username }));
        }
    }


    database.get_active_calendar(user.id, lookup_react);
}

module.exports = start;