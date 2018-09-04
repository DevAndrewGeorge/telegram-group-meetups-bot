// imports
const dialog = require("../dialog");
const focus = require("../focus");


// determines if the current focus requires a response
function is_valid_response_path(focus_str) {
    // trivial case
    if (!focus_str) return false;

    // if last element of focus_str is a proerty instead of a numeric index, response desired
    const last = focus_str.split(".").slice(-1)[0];
    if (isNaN(parseInt(last))) return true;
    else return false;
}


function respond(user, chat_id, args, database, callback) {
    database.find_focus(user.id, function(err, docs) {
        // TODO: error handling
        const focus_str = docs[0]["focus"];
        if (!is_valid_response_path(focus_str)) {
            callback(
                null,
                dialog.render('respond/0', ['help'], {})
            );
            return;
        }

        database.edit(user.id, args.join(" "), function(err, result) {
            // TODO: error handling
            const next_focus_str = focus.get_next_focus(focus_str, focus.parse_focus(focus_str));

            // dialog context
            const context = {
                prev_field: focus_str.split(".").slice(-1)[0],
                next_field: next_focus_str.split(".").slice(-1)[0]
            };

            if (is_valid_response_path(next_focus_str)) { // more information is needed
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