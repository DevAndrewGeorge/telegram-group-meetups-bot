/* ==============================================
RESPONSE OBJECT AND INITIAL CATEGORIES
============================================== */
const responses = {
  "error": {},
  "calendar": {},
  "event": {},
  "all": {},
  "user": {}
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


responses["error"]["delete"] = `Can't delete something that does not exist.`;


responses["error"][""] = `This response has yet to be implemented.`;


responses["error"]["calendar"] = `You currently do not have an active calendar.

/createcalendar to create a new calendar
/switchcalendar to choose an active calendar`;


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
responses["calendar"]["publish"] = `https://telegram.me/GroupMeetupBot?startgroup={{admin_chat_id}}_{{ calendar_id }}`;


responses["calendar"]["title"] = responses["calendar"]["description"] = responses["calendar"]["createcalendar"];


// actions
responses["calendar"]["edit"] = responses["calendar"]["createcalendar"];


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
/cancel <em>Cancel switching calendars.</em>
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
/summary a shorter description about the event
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
{% for item in items %}\
/e{{ loop.index }} <strong>{{ item.title }}. </strong> \
{% if item.from %}\
{{ item.from }}\
{% if item.to %} - {{ item.to }}{% else %}. {% endif%}\
{% if item.summary %}{{ item.summary }}{% endif %}\
{% endif %}
{% endfor %}
/cancel <em>Cancel choosing an event to edit.</em>
{% else %}
<em>There are no events to edit.</em>
{% endif %}
`


responses["event"]["deleteevent"] = `
{% if items|length %}
{% for item in items %}\
/de{{ loop.index }} <strong>{{ item.title }}.</strong> \
{% if item.from %}\
{{ item.from }}\
{% if item.to %} - {{ item.to }}{% else %}.{% endif%}\
{% endif %}
{% endfor %}
/cancel <em>Cancel choosing an event to delete.</em>
{% else %}
<em>There are no events to delete.</em>
{% endif %}
`;


// properties
responses["event"]["title"] = responses["event"]["description"] = responses["event"]["summary"] = responses["event"]["from"] = responses["event"]["to"] = responses["event"]["location"] = responses["event"]["link"] = responses["event"]["createevent"];


// actions
responses["event"]["delete"] = `The event has been deleted.`;


responses["event"]["save"] = `Your event has been successfully saved.`;


responses["event"]["discard"] = `Any edits have been discarded.`


responses["event"]["preview"] = `
<strong>{{ title }}.</strong> \
{% if location %}{{ location }}. {% endif %}\
{% if from %}\
{{ from }}\
{% if to %} - {{ to }}{% endif%}.\
{% endif %}

{% if summary %}{{ summary }}{% endif %}

{% if description %}{{ description }}{% endif %}

{% if link %}<a href="{{ link }}">Click here for more info.</a>{% endif %}
`;


//
responses["event"]["de"] = responses["event"]["preview"];


/* ==============================================
END USER COMMANDS
============================================== */
responses["user"]["start"] = `
Hello, everyone! My name is @GroupMeetupBot, and I'm here to keep you up-to-date on events planned for this group.

If you need me, just yell /calendar, and I'll give you a summary of events. From there, you can get more details for particular events and even RSVP to them.
`;


responses["user"]["calendar"] = `
<strong>{{ title }}</strong>

{{ description }}

{% for event in events -%}
/e{{ loop.index }}. <strong>{{ event.title }}.</strong>
{%- if event.from %} {{ event.from }} {% if event.to %}- {{ event.to }}{% endif %}.
{%- if event.summary %}{{ summary }}{% endif %}

{% endfor %}
`


/* ==============================================
INDISCRIMINATE RESPONSES
============================================== */
responses["all"]["cancel"] = `<em>Nothing has been done.</em>`;


module.exports = responses;