const fs = require("fs");

const responses = {}
const tooltips = {}


function walk(path) {
    /* returns full paths of files recursively nested under path */
    const stat = fs.statSync(path);

    // end recursion
    if (!stat.isDirectory()) return [ path ];

    // recurse through array
    const files = fs.readdirSync(path);
    let children = files.reduce(function(prev, curr) {
        return prev.concat( walk(path + "/" + curr) );
    }, []);

    return children;
}

const response_path = __dirname + "/dialog/responses";
const tooltip_path  = __dirname + "/dialog/tooltips";
module.exports = {
    responses: walk(response_path).reduce(function(prev, curr) {
        prev[curr.replace(response_path + "/", "")] = fs.readFileSync(curr, "utf8");
        return prev;
    }, {}),

    tooltips: walk(tooltip_path).reduce(function(prev, curr) {
        prev[curr.replace(tooltip_path + "/", "")] = fs.readFileSync(curr, "utf8");
        return prev;
    }, {})
}