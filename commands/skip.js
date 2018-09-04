// requirements
const focus = require("../focus");
const dialog = require("../dialog");


//
function respond(user, chat_id, args, database, callback) {
    database.find_focus(user.id, function(err, docs) {
        // TODO: error handling
        const focus_str = docs[0]["focus"];
        if (!focus.focus_requires_response(focus_str)) {
            callback(null, "");
            return;
        }

        const next_focus_str = focus.get_next_focus(focus_str);
        database.update_focus(user.id, next_focus_str, function (err, result) {
            // TODO: error handling
            const context = {
                item: focus.get_focus_item(focus_str),
                prev_field: focus.get_focus_field(focus_str),
                next_field: focus.get_focus_field(next_focus_str)
            };

            if (focus.focus_requires_response(next_focus_str)) {
                callback(
                    null,
                    dialog.render('skip/0', ['skip'], context)
                );
            } else {
                callback(
                    null,
                    dialog.render('skip/1', null, context)
                );
            }
        });
    });
}

module.exports = respond;