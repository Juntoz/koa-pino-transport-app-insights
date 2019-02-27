/**
AI SeverityLevel
    Verbose = 0,
    Information = 1,
    Warning = 2,
    Error = 3,
    Critical = 4,
*/
var AI_VERBOSE = 0, AI_INFORMATION = 1, AI_WARN = 2, AI_ERR = 3, AI_CRITICAL = 4;

/**
Pino Default Levels
    name	number
    off     100 ("silent")
    fatal	60
    error	50
    warn	40
    info	30
    debug	20
    trace	10
*/
var P_TRACE = 10, P_DEBUG = 20, P_INFO = 30, P_WARN = 40, P_ERR = 50, P_FATAL = 60;

var map = [];
map[P_TRACE] = AI_VERBOSE;
map[P_DEBUG] = AI_VERBOSE;
map[P_INFO] = AI_INFORMATION;
map[P_WARN] = AI_WARN;
map[P_ERR] = AI_ERR;
map[P_FATAL] = AI_CRITICAL;

module.exports = (pLevel) => {
    var aiLevel = map[pLevel];

    // just in case if no mapping was done, set as verbose
    if (!aiLevel) {
        aiLevel = AI_VERBOSE;
    }

    return aiLevel;
};

module.exports.PINO_ERROR = P_ERR;
module.exports.PINO_INFO = P_INFO;
