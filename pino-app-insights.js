const through = require('through2');

const pinoLevelToAI = require('./pino-level-to-ai.js');

function pinoThroughAppInsights(appInsightsClient) {
    return through.obj(function (message, enc, callback) {
        try {
            if (message) {
                _process(appInsightsClient, message);
            }
        } catch (error) {
            console.error('Error: ' + error.message);
        }

        // call the callback even if chunk is discarded
        // https://www.npmjs.com/package/through2
        callback();
    });
}

function _process(appInsightsClient, message) {
    var msgClass = _classify(message);

    if (msgClass == 'PARSE_ERROR') {
        _onParseJsonError(appInsightsClient, message);
    } else if (msgClass == 'REQUEST_COMPLETE') {
        _onRequestComplete(appInsightsClient, message);
    } else if (msgClass == 'EXCEPTION') {
        _onException(appInsightsClient, message);
    } else {
        _onTrace(appInsightsClient, message);
    }
}

function _classify(message) {
    // NOTE: sort conditions from most specific to less

    if (message.type == 'ParseJsonError') {
        return 'PARSE_ERROR';
    }

    if (message.level === pinoLevelToAI.PINO_INFO && message.msg == 'request completed') {
        return 'REQUEST_COMPLETE';
    }

    // only send exception if the Error object is there
    if (message.level == pinoLevelToAI.PINO_ERROR && message.err) {
        return 'EXCEPTION';
    }

    return 'TRACE';
}

function _onParseJsonError(appInsightsClient, message) {
    // follow ApplicationInsights.Contracts.TraceTelemetry
    var aiObj = {
        /**
         * Trace message
         */
        message: message.message,
        /**
         * Trace severity level
         */
        severity: pinoLevelToAI(pinoLevelToAI.PINO_ERROR)
    };

    aiObj.properties = [];
    aiObj.properties['time'] = message.time;
    aiObj.properties['original'] = message.original;

    appInsightsClient.trackTrace(aiObj);
    console.log(`on-parse-json: sent message ${message.time} to AI`);
    return aiObj;
}

function _onRequestComplete(appInsightsClient, message) {
    var isOk = (statusCode) => {
        return statusCode >= 200 && statusCode < 400;
    }

    // follow ApplicationInsights.Contracts.RequestTelemetry
    var aiObj = {
        /**
         * Request name
         */
        name: message.time,
        /**
         * Request url
         */
        url: message.req.url,
        /**
         * Request source. This encapsulates the information about the component that initiated the request
         */
        source: message.req,
        /**
         * Request duration in ms
         */
        duration: message.responseTime || 0,
        /**
         * Result code reported by the application
         */
        resultCode: message.res.statusCode,
        /**
         * Whether the request was successful
         */
        success: isOk(message.res.statusCode),
    };

    aiObj.properties = [];
    aiObj.properties['pid'] = message.pid;
    aiObj.properties['hostname'] = message.hostname;

    appInsightsClient.trackRequest(aiObj);
    console.log(`on-request: sent message ${message.time} to AI`);
    return aiObj;
}

function _onTrace(appInsightsClient, message) {
    // follow ApplicationInsights.Contracts.TraceTelemetry
    var aiObj = {
        /**
         * Trace message
         */
        message: message.msg,
        /**
         * Trace severity level
         */
        severity: pinoLevelToAI(message.level)
    };

    appInsightsClient.trackTrace(aiObj);
    console.log(`on-trace: sent message ${message.time} to AI`);
    return aiObj;
}

function _onException(appInsightsClient, message) {
    // convert the message to Error object so AI can show its details correctly, otherwise it tries to do a toString on the object and it may lose information
    var thisErr = new Error();
    thisErr.name = message.err.type;
    thisErr.message = message.err.message;
    thisErr.stack = message.err.stack;

    // follow ApplicationInsights.Contracts.ExceptionTelemetry
    var aiObj = {
        /**
         * Exception thrown
         */
        exception: thisErr
    };

    appInsightsClient.trackException(aiObj);
    console.log(`on-exception: sent message ${message.time} to AI`);
    return aiObj;
}

module.exports = pinoThroughAppInsights;
