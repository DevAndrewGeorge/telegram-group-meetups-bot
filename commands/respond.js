// imports
const dialog = require("../dialog");
const focus = require("../focus");


function respond(user, chat_id, args, database, callback) {
    database.find_focus(user.id, function(err, docs) {
        // TODO: error handling
        const focus_str = docs[0]["focus"];
        if (!focus.focus_requires_response(focus_str)) {
            callback(
                null,
                dialog.render('respond/0', ['help'], {})
            );
            return;
        }

        database.edit(user.id, args.join(" "), function(err, result) {
            // TODO: error handling
            const next_focus_str = focus.get_next_focus(focus_str);

            // dialog context
            const context = {
                prev_field: focus.get_focus_field(focus_str),
                next_field: focus.get_focus_field(next_focus_str)
            };

            if (focus.focus_requires_response(next_focus_str)) { // more information is needed
                callback(
                    null,
                    dialog.render('respond/1', [], context)
                );
            } else { // no more information is needed
                context["item"] = focus.get_focus_item(focus_str);
                callback(
                    null,
                    dialog.render('respond/2', [], context)
                );
            }
        });
    });
}

module.exports = respond;