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


responses["error"]["state"] = `You cannot perform this action because you are currently not editing a calendar or event.

/help will list commands you can use right now`



responses["error"]["save"] = `You must set a title before you can save.

/help will list commands you can use right now
`;


responses["error"]["property"] = `You can't set that property right now!

/help will list commands you can use right now, including any properties
`;


responses["error"]["selection"] = `You've tried selecting a calendar or event that does not exist.`;


responses["error"][""] = `This response has yet to be implemented.`;


/* ==============================================
CALENDAR COMMANDS
============================================== */
responses["calendar"]["createcalendar"] = `Use the following commands to create or edit your calendar.

/title <code>[TITLE, required]</code>
/description <code>[DESCRIPTION]</code>

/preview to preview what the calendar looks like
/discard to cancel creating or editing this calendar
/save to save your changes
`;


// properties
responses["calendar"]["title"] = responses["calendar"]["description"] = responses["calendar"]["createcalendar"];


// actions
responses["calendar"]["save"] = `Your calendar has been successfully saved. It is now the active calendar.`;


responses["calendar"]["discard"] = `Any edits have been discarded.`;


responses["calendar"]["preview"] = `
{% if not title and not description %}
<em>There is nothing to preview because you haven't set any properties yet.</em>
{% else %}
<em>Calendar Preview:</em>
{% if title %}<strong>{{ title }}.</strong> {% endif %}{% if description %}{{ description }}{% endif %}
{% endif %}`;


responses["calendar"]["switchcalendar"] = `
{% if items|length %}
{% for item in items %}/c{{ loop.index }} <strong>{{ item.title }}.</strong> {{ item.description }}
{% endfor %}
/x <em>Do not switch from current calendar.</em>
{% else %}
<em>There's nothing to edit because nothing has been saved yet.</em>
{% endif %}
`


responses["calendar"]["c"] = `
<em>Now editing calendar</em> <strong>{{ calendar.title }}.</strong>

/edit to change its name and/or description
/createEvent
/editEvent
/deleteEvent
`;


/* ==============================================
EVENT COMMANDS
============================================== */
responses["event"]["createevent"] = `Use the following commands to create or edit your event.

/title <code>[TITLE, required]</code>
/description <code>[DESCRIPTION]</code>
/location 
/link an additional link to that will be attached to the end of the event info.
/from the start date and time
/to the end date and time

/preview to preview what the calendar looks like
/discard to cancel creating or editing this calendar
/save to save your changes
`;


responses["event"]["editevent"] = `
{% if items|length %}
{% for item in items %}/e{{ loop.index }} <strong>{{ item.title }}.</strong> {{ item.from }} - {{ item.to }}.
{% endfor %}
/x <em>Do not edit an event.</em>
{% else %}
<em>There's nothing to edit because nothing has been saved yet.</em>
{% endif %}
`


// properties
responses["event"]["title"] = responses["event"]["description"] = responses["event"]["from"] = responses["event"]["to"] = responses["event"]["location"] = responses["event"]["link"] = responses["event"]["createevent"];


// actions
responses["event"]["save"] = `Your event has been successfully saved.`;


responses["event"]["discard"] = `Any edits have been discarded.`


responses["event"]["preview"] = `
<strong>{{ title }}.</strong> {{ location }}. {{ from }} - {{ to }}.

{{ description }}

<a href="{{ link }}">Click here for more info.</a>
`;


module.exports = responses;