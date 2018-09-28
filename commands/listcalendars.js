// imports
const dialog = require("../dialog");


function listCalendars(user, chat_id, arguments, database, callback) {
    database.show(user.id, 'calendars', function(err, docs) {
        if (err) {
            callback(err);
            return;
        }

        callback(
            null,
            dialog.render(
                'listcalendars/0',
                ['createcalendar', 'editcalendar', 'showcalendar', 'listcalendars', 'deletecalendar'],
                {calendars: docs}
            )
        );
    });
}

module.exports = listCalendars;