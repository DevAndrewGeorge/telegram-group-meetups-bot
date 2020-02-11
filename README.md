# Telegram Group Meetups Bot
**The bot is now defunct as of 31 Dec 2019 due to low utilization + hosting costs.**

A Telegram Bot capable of creating and maintaining calendars with RSVP capabilities.

If you'd like a short tour of the major code files checkout:
* [config.ini.example](config.init.example) is the app configuration. It allows secrets to not have to be committed to source (and therefore public). It's also nice avoiding hardcoding URLs/filepaths/etc.
* [app.js](app.js) deals with program initialization.
* [HostessBot.js](HostessBot.js) handles high level user actions, including routing user comands to internal commands. It also handles the bulk of error handling.
* [Commander.js](command.js) is the internal API that handles low level actions and sends queries to the mongo backend.
* [collections/](collections/) handles interfacing with the Mongo backend.

## Architecture
This 
* This app is written in javascript using the Node.js framework. There is no particular reason for that, I've just made a habit of programming personal projects that require webservers in JS.

* This app is capable of being highly available in webhook mode. Sit it behind a loadbalancer and poll the `/healthz` endpoint.

* Mongo was chosen as the backend. It's schema was better suited to handle the on-to-many-to-many relationship that users > calenders > events had. It also granted me dual-write capability which was desirable in an environment which needed to keep its costs low and consistency high.
