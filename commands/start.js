// imports
const dialog = require("../dialog");


function start(user, chat_id, arguments, database, callback) {
    function react_to_insert(err, docs) {
        // TODO: error handling
        callback(null, dialog.render('start/0', 'createcalendar', { username: user.username }));
    }


    function react_to_focus(err, docs) {
        // TODO: error handling
        let response, tooltips;
        if (docs.length === 0) { // new
            response = 'start/0';
            tooltips = [ 'createcalendar' ];
        } else { // returning user
            response = 'start/1';
            tooltips = [ 'createcalendar', 'listcalendars'];
        }

        database.update_focus(
            user.id,
            false,
            function (err, docs) {
                //TODO: error handling
                callback(
                    null,
                    dialog.render(response, tooltips, { username: user.username })
                );
            }
        )
    }


    database.find_focus(user.id, react_to_focus);
}

module.exports = start;