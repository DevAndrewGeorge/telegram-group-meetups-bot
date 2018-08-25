const path   = require("path");
const fs     = require("fs");
const ini    = require("ini");

module.exports = 
  ini.parse(
    fs.readFileSync(
      path.join(__dirname, "config.ini"),
      "utf-8"
  ));

