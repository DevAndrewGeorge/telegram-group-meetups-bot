// constant, ordered focus orders
const CALENDAR_FOCUS_PATH = "calendars.# calendars.#.title calendars.#.description";
const EVENT_FOCUS_PATH = "calendars.#.events.? calendars.#.events.?.title calendars.#.events.?.summary calendars.#.events.?.description calendars.#.events.?.start_time calendars.#.events.?.end_time calendars.#.events.?.location";


//
function get_focus_item(focus_str) {
    const parsed = parse_focus(focus_str);
    return parsed.event_id ? 'event' : 'calendar';
}


//
function get_focus_field(focus_str) {
    if (!focus_requires_response(focus_str)) return null;
    else return focus_str.split(".").slice(-1)[0];
}


// extracts calendar_id and event_id from passed focus
// takes all focus_strs from 'calendars' to 'calendars.#.events.?.field'
function parse_focus(focus_str) {
    const parsed = { calendar_id: undefined, event_id: undefined };
    const split = focus_str ? focus_str.split(".") : [];
    if (split.length < 2) {
        return parsed;
    }

    parsed["calendar_id"] = parseInt(split[1]);
    if (split[2] === "events" && split.length > 3) parsed["event_id"] = parseInt(split[3]);
    return parsed;
}


// general function for determining next focus
function get_next_focus(prev, ids) {
    if (!ids) ids = parse_focus(prev);
    const template = ids.event_id !== undefined ? EVENT_FOCUS_PATH : CALENDAR_FOCUS_PATH;
    const templated = template.replace(/#/g, ids.calendar_id).replace(/\?/g, ids.event_id);
    const split = templated.split(" ");

    if (!prev) return split[0];

    const next_focus_index = split.indexOf(prev) + 1;
    const wrapped_index = next_focus_index % split.length;
    return split[wrapped_index];
}


// determines if the current focus requires a response
function focus_requires_response(focus_str) {
    // trivial case
    if (!focus_str) return false;

    // if last element of focus_str is a proerty instead of a numeric index, response desired
    const last = focus_str.split(".").slice(-1)[0];
    if (isNaN(parseInt(last))) return true;
    else return false;
}


module.exports = {
    get_next_focus: get_next_focus,
    get_focus_item: get_focus_item,
    parse_focus: parse_focus,
    focus_requires_response: focus_requires_response,
    get_focus_field: get_focus_field
};

