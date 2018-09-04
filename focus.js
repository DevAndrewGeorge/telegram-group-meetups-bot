// constant, ordered focus orders
const CALENDAR_FOCUS_PATH = "calendars.# calendars.#.description";
const EVENT_FOCUS_PATH = "calendars.#.events.? calendars.#.events.?.summary calendars.#.events.?.description calendars.#.events.?.start_time calendars.#.events.?.end_time calendars.#.events.?.location";


//
function get_focus_item(focus_str) {
    const parsed = parse_focus(focus_str);
    return parsed.event_id ? 'event' : 'calendar';
}


// extracts calendar_id and event_id from passed focus
function parse_focus(focus_str) {
    const parsed = { calendar_id: undefined, event_id: undefined };
    if (!focus_str) {
        return parsed;
    }

    const split = focus_str.split(".");
    parsed["calendar_id"] = parseInt(split[1]);
    if (split[2] === "events") parsed["event_id"] = parseInt(split[3]);
    return parsed;
}


// general function for determining next focus
function get_next_focus(prev, ids) {
    const template = ids.event_id !== undefined ? EVENT_FOCUS_PATH : CALENDAR_FOCUS_PATH;
    const templated = template.replace(/#/g, ids.calendar_id).replace(/\?/g, ids.event_id);
    const split = templated.split(" ");

    if (!prev) return split[0];

    const next_focus_index = split.indexOf(prev) + 1;
    const wrapped_index = next_focus_index % split.length;
    return split[wrapped_index];
}


module.exports = {
    get_next_focus: get_next_focus,
    get_focus_item: get_focus_item,
    parse_focus: parse_focus
};

