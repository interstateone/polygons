load('env.rhino.1.2.js');
load('qunit.js');

var starttime = new Date().getTime();

// Envjs/QUnit Bridge.
Envjs({
    // Straight from the Envjs guide.
    scriptTypes: {
        "": true,
        "text/javascript": true
    },
    // Straight from the Envjs guide.
    beforeScriptLoad: {
        'sharethis': function (script) {
            script.src = '';
            return false;
        }
    },

    // Hook QUnit logging to console.
    afterScriptLoad: {
        'qunit': function () {
            var count = 0, testName;

            console.log("* QUnit test runner loaded.");

            // Grab current test name.
            QUnit.testStart = function(name, testEnvironment) {
                testName = name;
            };
            // Override log to display to stdout.
            QUnit.log = function (result, message) {
                // Strip out HTML in results messages.
                message = message.replace(/<\/?.*?>/g, '');
                console.log("  * {%s}(%s)[%s] %s",
                    testName, count++,
                    result ? 'PASS' : 'FAIL', message);
            };
            QUnit.done = function (fail, total){
                var endtime = new Date().getTime();
                var pass = total - fail;
                console.log("\n" +
                    "*****************\n" +
                    "* QUnit Results *\n" +
                    "*****************\n" +
                    "* PASSED: %s\n" +
                    "* FAILED: %s\n" +
                    "* Completed %s tests total in %s seconds.\n",
                    pass, fail, total,
                    parseFloat(endtime-starttime) / 1000.0);
           };
        },

        // Straight from the Envjs guide.
        '.': function (script) {
            script.type = 'text/envjs';
        }
    }
});