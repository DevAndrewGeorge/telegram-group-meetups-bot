/* ==============================================
RESPONSE OBJECT AND INITIAL CATEGORIES
============================================== */
const responses = {
  "error": {},
  "calendar": {},
  "event": {}
};


/* ==============================================
ERROR RESPONSES
============================================== */
responses["error"]["command"] = `It seems you've either provided no command or provided an invalid command. Please use one of the commands below if you need help.

/help will list commands you can use right now
`;


responses["error"]["internal"] = `Apologies. It looks like something went wrong on my end. Please try again.

/help will list commands you can use right now
/report if you keep getting this message
`


responses["error"]["state"] = `You've provided a calendar or event property, but you are not currently editing a calendar or event. 

/help will list commands you can use right now`



responses["error"]["save"] = `I was unable to save your event or calendar. Did you provide a title?

/help will list commands you can use right now
`;


responses["error"]["property"] = `You can't set that property right now!

/help will list commands you can use right now, including any properties
`;


responses["error"][""] = `This response has yet to be implemented.`;


/* ==============================================
CALENDAR COMMANDS
============================================== */
responses["calendar"]["createcalendar"] = `Use the following commands to create or edit your calendar.

/title [TITLE, required]
/description [DESCRIPTION]

/preview to preview what the calendar looks like
/discard to cancel creating or editing this calendar
/save to save your changes
`;


// properties
responses["calendar"]["title"] = responses["calendar"]["description"] = responses["calendar"]["createcalendar"];


/* ==============================================
EVENT COMMANDS
============================================== */
responses["event"]["createevent"] = `Use the following commands to create or edit your event.

/title [TITLE, required]
/description [DESCRIPTION]
/location 
/link an additional link to that will be attached to the end of the event info.
/from the start date and time
/to the end date and time

/preview to preview what the calendar looks like
/discard to cancel creating or editing this calendar
/save to save your changes
`;


// properties
responses["event"]["title"] = responses["event"]["description"] = responses["event"]["from"] = responses["event"]["to"] = responses["event"]["location"] = responses["event"]["link"] = responses["event"]["createevent"];


module.exports = responses;