function info(message) {
    console.log(message);
}

function error(error) {
    console.log(`Error: ${error.message}}`);
}

module.exports = {
    info,
    error
}