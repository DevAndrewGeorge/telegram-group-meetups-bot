// requirements
const fs = require("fs");
const nunjucks = require("nunjucks");


// helper functions
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


function render(response_key, tooltip_keys, context) {
    let template = responses[response_key].trim();
    if (tooltip_keys) template += "\n\n";

    if (typeof tooltip_keys === "string") {
        template += tooltips[tooltip_keys];
    } else if (tooltip_keys) {
        template += tooltip_keys.reduce(function(str, key) {
            return str + tooltips[key] + "\n";
        }, "").replace(/\n$/, "");
    }

    return nunjucks.renderString(template, context);
}


// variable declarations
const response_path = __dirname + "/dialog/responses";
const responses =  walk(response_path).reduce(function(prev, curr) {
    prev[curr.replace(response_path + "/", "")] = fs.readFileSync(curr, "utf8");
    return prev;
}, {});

const tooltip_path  = __dirname + "/dialog/tooltips";
const tooltips = walk(tooltip_path).reduce(function(prev, curr) {
    prev[curr.replace(tooltip_path + "/", "")] = fs.readFileSync(curr, "utf8");
    return prev;
}, {});



module.exports = {
    responses: responses,
    tooltips: tooltips,
    render: render
}