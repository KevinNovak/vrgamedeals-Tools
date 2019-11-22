function stripQueryString(url) {
    return url.split(/[?#]/)[0];
}

module.exports = {
    stripQueryString
}