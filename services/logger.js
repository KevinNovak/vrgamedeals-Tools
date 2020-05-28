function info(message) {
    console.log(`[${getTimestamp()}]`, message);
}

function error(error) {
    console.log(`[${getTimestamp()}]`, error);
}

function getTimestamp() {
    return new Date().toISOString();
}

module.exports = {
    info,
    error,
};
