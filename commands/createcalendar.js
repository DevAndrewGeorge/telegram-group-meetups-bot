// imports
const dialog = require("../dialog");


function createCalendar(user, chat_id, arguments, database, callback) {
    // checking if name was passed as an argument
    title = arguments.length > 0 ? arguments.join(" ") : null;

    if (!title) {
        callback(null, dialog.render('createcalendar/0', 'createcalendar', {}));
        return;
    }
}

module.exports = createCalendar;