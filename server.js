// importing modules
const fs      = require("fs");
const https   = require("https");
const express = require("express");
const ini     = require("ini");


// writing PID for service reasons
fs.writeFile("/var/run/hostess.pid", process.pid);

// reading config
const  config = ini.parse(fs.readFileSync(process.env.SERVER_ROOT + "/config.ini", "utf-8"));


// setting up webserver
app = express();
express.static(config.express.public);

app.get("/test", function (req, res) {
  res.send("Test successful");
});


// setting up https
credentials = {
  key:  fs.readFileSync(config.https.key_path),
  cert: fs.readFileSync(config.https.cert_path)
};

const httpsServer = https.createServer(credentials, app);
httpsServer.listen(config.https.port);
