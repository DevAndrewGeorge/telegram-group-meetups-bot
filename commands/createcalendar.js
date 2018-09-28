// imports
const dialog = require("../dialog");


function createCalendar(user, chat_id, args, database, callback) {
    // checking if name was passed as an argument
    title = args.length > 0 ? args.join(" ") : null;

    if (!title) {
        callback(null, dialog.render('createcalendar/0', 'createcalendar', {}));
        return;
    } else {
        database.create(user.id, 'calendar', title, function(err, result) {
            // TODO: error checking
            callback(
                null,
                dialog.render('createcalendar/1', [ 'skip' ], { calendar_title: title })
            );
        });
    }
}

module.exports = createCalendar;