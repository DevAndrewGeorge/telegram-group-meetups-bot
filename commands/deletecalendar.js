const dialog = require("../dialog");


//
function argsIsNumber(args) {
    if (args.length === 0 || isNaN(Number(args[0]))) {
        return false;
    } else {
        return true;
    }
}


//
function deleteCalendar(user, chat_id, args, database, callback) {
    if (!argsIsNumber(args)) {
        callback(
            null,
            dialog.render(
                'deletecalendar/0',
                ['createcalendar', 'editcalendar', 'showcalendar', 'listcalendars', 'deletecalendar'],
                {}
            )
        )
        return;
    }
}

module.exports = deleteCalendar;