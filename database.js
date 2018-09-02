const mysql = require("mysql");
const nunjucks = require("nunjucks");
const config = require("./config");


const connection = mysql.createConnection({
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: config.database.database
});


function get_active_calendar(user_id, callback) {
    let sql = "SELECT c.name as calendar_name FROM active as a LEFT JOIN calendars as c ON a.calendar_id = c.calendar_id WHERE user_id = {{ user_id }};"
    sql = nunjucks.renderString(sql, { user_id: connection.escape(user_id) });
    connection.query(sql, callback)
}


function set_active_calendar(user_id, calendar_id, callback) {
    let sql = "INSERT INTO active(user_id, calendar_id) VALUES({{ user_id }}, {{ calendar_id }});"
    sql = nunjucks.renderString(sql, {user_id: connection.escape(user_id), calendar_id: connection.escape(calendar_id)});
    connection.query(sql, callback);
}


module.exports = {
    get_active_calendar: get_active_calendar,
    set_active_calendar: set_active_calendar
}