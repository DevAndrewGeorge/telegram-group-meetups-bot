/* ==============================================
RESPONSE OBJECT AND INITIAL CATEGORIES
============================================== */
const tooltips = {
  "admin": "/admin - list all high-level commands you can use",
  "cancel": "/cancel - do nothing",
  "calendar": "/calendar - get the list of planned events",
  "contact": "/contact <code>text</code> - yell at my creator to fix this problem",
  "create_calendar": "/createcalendar - create a new calendar",
  "create_event": "/createEvent - create a new event",
  "delete_calendar": "/deleteCalendar - chose a calendar to delete",
  "delete_event": "/deleteEvent - choose an event to delete",
  "description": "/description <code>text</code> - set the description.",  
  "discard": "/discard - cancel creating or editing",
  "edit": "/edit - edit the calendar's information",
  "edit_event": "/editEvent - edit an event's information",
  "from": "/from <code>[text]</code> - set an event start time",
  "help": "/help - list commands that you can use right now",
  "location": "/location <code>[text]</code> - set an event location",
  "link": "/link <code>[text]</code> - set a link to a website about the event",
  "preview": "/preview - preview what the calendar or event will look like if saved",
  "publish": "/publish - share the calendar with a group chat",
  "save": "/save - save the calendar or event",
  "select_calendar": "/selectcalendar - choose a new active calendar",
  "summary": "/summary <code>[text]</code> - set a shorter description. this appears when events are being listed.",
  "title": "/title <code>text</code> - required. set the title.",
  "to": "/to <code>[text]</code> - set an event end time"
};

const responses = {
  "error": {},
  "calendar": {},
  "event": {},
  "all": {},
  "user": {},
  "help": {},
  "start": {}
};



/* ==============================================
INDISCRIMINATE RESPONSES
============================================== */
responses["all"]["contact"] = `Thank you for the feedback! I've already my Creator receives your message.`;


responses["all"]["cancel"] = `<em>No changes have been made.</em>`;


responses["all"]["display_calendar"] = `
<strong>{{ calendar.title }}</strong>
{%- if calendar.description %}

{{ calendar.description }}
{%- endif -%}

{%- if calendar.events and calendar.events|length -%}
{%- for event in calendar.events %}

/{{ loop.index }} <strong>{{ event.title }}{{ "" if event.title|last === "." else "." }}</strong>
{%- if event.from %} {{ event.from }}{%- if event.to %} - {{ event.to }}{%- endif -%}.{%- endif %}
{%- if event.summary %} {{ event.summary }}{% endif %}

{%- endfor -%}
{%- else %}

<em>There are no events scheduled.</em>
{%- endif -%}
`


responses["all"]["display_event"] = `
<strong>{{ event.title }}{{ "" if event.title|last === "." else "." }}</strong>
{%- if event.location %} {{ event.location }}.{%- endif -%}
{%- if event.from %} {{ event.from }}
  {%- if event.to %} - {{ event.to }}{%- endif -%}
.{%- endif -%}

{%- if event.summary %}

{{ event.summary }}
{%- endif -%}

{%- if event.description %}

{{ event.description }}
{%- endif -%}

{%- if event.link %}

<a href="{{ event.link }}">Click here for more info.</a>
{%- endif %}

<strong>RSVPs:</strong>
{%- if event.rsvps and event.rsvps|length -%}
{%- for person in event.rsvps %}
- {{ person }}
{%- endfor -%}
{%- if event.additional_guest_count %}
<em>+{{ event.additional_guest_count }} more</em>
{%- endif -%}
{%- elif event.additional_guest_count %}
<em>{{ event.additional_guest_count }} {{ "people" if event.additional_guest_count > 1 else "person" }}</em>
{%- else %}
<em>none</em>
{%- endif -%}`;
/* ==============================================
ERROR RESPONSES
============================================== */
responses["error"]["command"] = `It seems you've either provided no command or provided an invalid command.

${tooltips.help}
${tooltips.admin}
`;


responses["error"]["internal"] = `Apologies. It looks like something went wrong on my end. \u{1F641} Please try again.

${tooltips.contact}
`;


responses["error"]["state"] = `You cannot perform this action because you are currently not editing a calendar or event.

${tooltips.help}`;



responses["error"]["save"] = `You must set a title before you can save.

${tooltips.title}`;


responses["error"]["property"] = `You can't set that property right now!

${tooltips.help}`;


responses["error"]["selection"] = `The calendar or event you are trying to select does not exist.`;


responses["error"]["delete"] = `The calendar or event you are trying to delete does not exist.`;


responses["error"][""] = `This response has yet to be implemented.`;


responses["error"]["calendar"] = `You currently do not have an active calendar.

${tooltips.create_calendar}
${tooltips.select_calendar}`;


responses["error"]["invite"] = `Well this is awkward... It seems I can't find the calendar you're trying to share. Try generating the link again and click on the new link.

${tooltips.contact}`
/* ==============================================
CALENDAR COMMANDS
============================================== */
// high level
responses["calendar"]["createcalendar"] = `Use the following commands to create or edit your calendar. Omit <code>text</code> to remove a property.

${tooltips.title}
${tooltips.description}

${tooltips.preview}
${tooltips.discard}
${tooltips.save}
`;

responses["calendar"]["selectcalendar"] = `
{%- if calendars|length -%}
{%- for calendar in calendars %}

/c{{ loop.index }} <strong>{{ calendar.title }}{{ "" if calendar.title|last === "." else "." }}</strong> {{ calendar.description }}
{%- endfor %}

${tooltips.cancel}
{%- else -%}
<em>There are no saved calendars.</em>

${tooltips.create_calendar}
{% endif %}`;

responses["calendar"]["c"] = `
<strong>{{ calendar.title }}</strong> is your current active calendar.

${tooltips.calendar}
${tooltips.edit}
${tooltips.publish}
${tooltips.create_event}
${tooltips.edit_event}
${tooltips.delete_event}

${tooltips.create_calendar}
${tooltips.select_calendar}
${tooltips.delete_calendar}
`;

responses["calendar"]["deletecalendar"] = responses["calendar"]["selectcalendar"].replace("/c", "/dc");

responses["calendar"]["edit"] = responses["calendar"]["createcalendar"];

responses["calendar"]["publish"] = `
Hot off the press! Click the link below to share the calendar with a group. You only need to share one time, so feel free to create, edit, or delete events at any time! But be careful! Sharing a calendar will override a calendar already shared with the group.

https://telegram.me/GroupMeetupsBot?startgroup={{ publish.calendar_id }}`;


// properties
responses["calendar"]["title"] = responses["calendar"]["description"] = responses["calendar"]["createcalendar"];


responses["calendar"]["dc"] = responses["all"]["display_calendar"];


responses["calendar"]["delete"] = `The calendar has been deleted.`;




// actions
responses["calendar"]["preview"] = `
{%- if not calendar.title and not calendar.description -%}
<em>There is nothing to preview because you haven't set any properties yet.</em>
{%- else -%}
{%- if calendar.title -%}
<strong>{{ calendar.title }}{{ "" if calendar.title|last === "." else "." }}</strong>
{%- endif -%}
{%- if calendar.description %} {{ calendar.description }}{%- endif -%}
{%- endif -%}`;

responses["calendar"]["discard"] = responses["all"]["cancel"];

responses["calendar"]["save"] = responses["calendar"]["c"];


/* ==============================================
EVENT COMMANDS
============================================== */
responses["event"]["createevent"] = `Use the following commands to create or edit your event. Omit <code>text</code> to remove a property.

${tooltips.title}
${tooltips.description}
${tooltips.summary}
${tooltips.location}
${tooltips.link}
${tooltips.from}
${tooltips.to}

${tooltips.preview}
${tooltips.discard}
${tooltips.save}`;


responses["event"]["e"] = responses["event"]["createevent"];


responses["event"]["editevent"] = `
{%- if events|length -%}
{%- for event in events %}

/e{{ loop.index }} <strong>{{ event.title }}{{ "" if event.title|last === "." else "." }}</strong>
{%- if event.from %} {{ event.from }}
  {%- if event.to %} - {{ event.to }}{%- endif -%}
.{%- endif -%}

{%- if event.summary %} {{ event.summary }}{%- endif -%}
{%- endfor %}

/cancel <em>Cancel choosing an event to edit.</em>
{%- else %}
<em>There are no saved events.</em>
{%- endif -%}`;


responses["event"]["deleteevent"] = responses["event"]["editevent"].replace("/e", "/de");


// properties
responses["event"]["title"] = responses["event"]["description"] = responses["event"]["summary"] = responses["event"]["from"] = responses["event"]["to"] = responses["event"]["location"] = responses["event"]["link"] = responses["event"]["createevent"];


// actions
responses["event"]["delete"] = `The event has been deleted.`;


responses["event"]["save"] = `Your event has been saved.`;


responses["event"]["discard"] = responses["all"]["cancel"];


responses["event"]["preview"] = responses["all"]["display_event"];


//
responses["event"]["de"] = responses["event"]["preview"];


/* ==============================================
END USER COMMANDS
============================================== */
responses["user"]["start"] = `
Hello, everyone! My name is @GroupMeetupsBot, and I'm here to keep you up-to-date on events planned for this group.

If you need me, just yell /calendar, and I'll give you a summary of events. From there, you can get more details about each event and RSVP if you are going.`;


responses["user"]["calendar"] = responses["all"]["display_calendar"];


responses["user"]["event"] = responses["all"]["display_event"];


//responses["user"]["rsvp"] = `Glad you can make it to <strong>{{ rsvp.title }}</strong>, @{{ rsvp.username }}! \u{1F389}`;
responses["user"]["rsvp"] = responses["all"]["display_event"];

//responses["user"]["unrsvp"] = `I'm sad I won't be seeing you at <strong>{{ unrsvp.title }}</strong>, @{{ unrsvp.username }}. \u{1F61F}`;
responses["user"]["unrsvp"] = responses["all"]["display_event"];

/* ==============================================
HELP RESPONSES
============================================== */
responses["help"]["start"] = `
Hello! It doesn't look like you're actively working on anything. Let's fix that.

<strong>If you're looking to view this group's calendar:</strong>
${tooltips.calendar}

<strong>If you're looking to create a calendar of your own:</strong>
${tooltips.create_calendar}
${tooltips.select_calendar}`;


responses["help"]["createcalendar"] = responses["calendar"]["createcalendar"];


responses["help"]["createevent"] = responses["event"]["createevent"];


responses["help"]["calendar"] = `/calendar - get the list of planned events`;


responses["help"]["c"] = responses["calendar"]["c"];


responses["help"]["admin"] = `
Below is a list of all high-level admin commands. Each command will give more information on its use once received. 

<strong>Calendar commands:</strong>
${tooltips.create_calendar}
${tooltips.select_calendar}
${tooltips.delete_calendar}

<strong>With an active calendar, you can:</strong>
${tooltips.edit}
${tooltips.publish}
${tooltips.calendar}
${tooltips.create_event}
${tooltips.edit_event}
${tooltips.delete_event}

<strong>Other commands:</strong>
${tooltips.help}
${tooltips.contact}`;

module.exports = responses;
