/* ==============================================
EXTERNAL MODULES
============================================== */
const chrono = require("chrono-node");
const moment = require("moment");


/* ==============================================
TRANSFORMATION FUNCTIONS
============================================== */
/**
 * Attempts to convert date string to Unix timestamp.
 * If this task fails, returns the original string.
 * @param {string} date 
 * @param {function} callback optional. (err, date)
 */
function transform_date_string(date, callback) {
  if (!date) {
    if (callback) {
      callback(undefined, date);
      return;
    } else {
      return date;
    }
  }

  const parsed_date = chrono.parse(
    date,
    Date.now(),
    { forwardDate: true}
  );

  if (parsed_date.length === 0) {
    if (callback) {
      callback(undefined, date);
      return;
    } else {
      return date;
    }
  }

  const zero = ["hour", "minute", "second", "millisecond"],
    one = ["month", "day"];
  date = parsed_date[0].start;
  for (let component in date.impliedValues) {
    if (zero.indexOf(component) !== -1) {
      date.imply(component, 0);
    } else if (one.indexOf(component) !== -1) {
      date.imply(component, 1);
    }
  }

  if (callback) {
    callback(undefined, date);
    return;
  } else {
    return Math.floor(date.date().getTime() / 1000);
  }
}


/**
 * 
 * @param {integer} unix1 in seconds
 * @param {integer} unix2 in seconds
 * @param {function} callback optional. (err, str)
 */
function transform_date_objects(from, to, callback) {
  const formatted = {
    from: undefined,
    to: undefined
  };

  if (!from && !to) {
    if (callback) {
      callback(undefined, formatted);
      return;
    } else {
      return formatted;
    }
  }

  const format_with_minutes = "h:mma, D MMM YYYY";
  const format_without_minutes = "ha, D MMM YYYY";

  let converted, format_choice;
  if (from) {
    converted = moment.unix(from);
    format_choice = converted.minute() ? format_with_minutes : format_without_minutes;
    formatted.from = converted.format(format_choice);
  }

  if (to) {
    converted = moment.unix(to);
    format_choice = converted.minute() ? format_with_minutes : format_without_minutes;
    formatted.to = converted.format(format_choice);
  }

  if (callback) {
    callback(undefined, formatted);
    return;
  } else {
    return formatted;
  }
}


/**
 * 
 */
function sort_events(a, b) {
  // events with 'from' dates come before events without 'from' dates
  if (a.from && !b.from) return -1;
  else if (!a.from && b.from) return 1;

  // both events are now known to have a 'from' date
  // events with an earlier 'from' dates have precedence
  if (a.from < b.from) return -1;
  else if (a.from > b.from) return 1;

  // both events are now known to have the same 'from' date
  // events without an 'to' date come before events without a 'to' date
  if (!a.to && b.to) return -1;
  else if (a.to && !b.to) return 1;

  // both eents are now known to both have a 'to' date
  // events with a earlier 'to' date come before events with a later 'to' date
  if (a.to < b.to) return -1;
  else if (a.to > b.to) return 1;

  // both events are now known to have the same 'from' and 'to' date
  // creation_timestamp is the deciding factor
  if (a.creation_timestamp < b.creation_timestamp) return -1;
  else if (a.creation_timestamp > b.creation_timestamp) return 1;
  else return 0;
}

/* ==============================================
EX
============================================== */
module.exports = {
  transform_date_string: transform_date_string,
  transform_date_objects: transform_date_objects,
  sort_events: sort_events
};
