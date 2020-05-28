function info(message) {
    console.log({
        timestamp: new Date().toISOString(),
        message,
    });
}

function error(error) {
    console.log({
        timestamp: new Date().toISOString(),
        error: error.stack,
    });
}

module.exports = {
    info,
    error,
};
