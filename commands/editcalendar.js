const dialog = require("../dialog");
const focus = require("../focus");


function editCalendar(user, chat_id, args, database, callback) {
    // checking to see if numerical argument was passed
    const calendar_id = args.length > 0 ? Number(args[0]) : null;
    if (!calendar_id) {
        callback(
            null,
            dialog.render(
                'editcalendar/0',
                ['createcalendar', 'editcalendar', 'showcalendar', 'listcalendars', 'deletecalendar'],
                {}
            )
        );
        return;
    }
    
    // create focus string
    const prev_focus = focus.get_next_focus(null, {calendar_id: calendar_id});
    // retrieving calendar
    database.show(user.id, prev_focus, function(err, calendar) {
        if (err instanceof RangeError) {
            // TODO: error handling
        }

        const next_focus = focus.get_next_focus(prev_focus, {calendar_id: calendar_id});
        database.update_focus(user.id, next_focus, function(err, result) {
            // TODO: error handling
            callback(
                null,
                dialog.render(
                    'editcalendar/1',
                    ['skip'],
                    {}
                )
            )
        });
    });
}

module.exports = editCalendar;