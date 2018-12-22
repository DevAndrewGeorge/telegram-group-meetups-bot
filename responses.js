const responses = {};


responses[""] = `It seems you've either provided no command or provided an invalid command. Please use one of the commands below if you need help.

/help will list commands you can use right now
`;


responses["createcalendar"] = `Use the following commands to create or edit your calendar.

/title [TITLE, required]
/description [DESCRIPTION]

/preview to preview what the calendar looks like
/discard to cancel creating or editing this calendar
/save to save your changes
`;


responses["editcalendar"] = responses["createcalendar"];


module.exports = responses;