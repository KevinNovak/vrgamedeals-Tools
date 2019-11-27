function info(message) {
    console.log(message);
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