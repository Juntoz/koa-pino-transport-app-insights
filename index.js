'use strict';

const pump = require('pump');
const split = require('split2');
const appInsights = require("applicationinsights");

const pinoThroughAppInsights = require('./through-app-insights.js');

const argv = require('yargs')
    .usage('Usage: $0 --aikey [application insights instrumentation key]')
    .demandOption(['aikey'])
    .argv;

const parseJson = function(line) {
    try {
        var obj = JSON.parse(line);
        return obj;
    } catch (error) {
        // get unix timestamp
        // https://www.electrictoolbox.com/unix-timestamp-javascript/
        var ts = Math.round((new Date()).getTime() / 1000);

        // try to replicate as much the pino error format
        return {
            type: 'ParseJsonError',
            message: error.message,
            time: ts,
            original: line
        };
    }
}

function createRunner() {
    // disable a lot of options from AI because they are useless for this transport (it is not the real web app)
    appInsights.setup(argv.aikey)
        .setAutoDependencyCorrelation(false)
        .setAutoCollectRequests(false)
        .setAutoCollectPerformance(false)
        .setAutoCollectDependencies(false)
        .setAutoCollectConsole(false);

    appInsights.start();
    let appInsightsClient = appInsights.defaultClient;

    return pinoThroughAppInsights(appInsightsClient);
}

pump(
    process.stdin,
    split(parseJson),
    createRunner()
);
console.log('Started, listening on stdin ...');
