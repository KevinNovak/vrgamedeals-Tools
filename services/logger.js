function info(message) {
    console.log({
        timestamp: Date.now(),
        message
    });
}

function error(error) {
    console.log({
        timestamp: Date.now(),
        error: error.stack,
    });
}

module.exports = {
    info,
    error
}