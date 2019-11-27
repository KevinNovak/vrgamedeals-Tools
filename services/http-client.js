const _rp = require('request-promise');

async function get(url) {
    return await _rp({ url });
}

module.exports = {
    get
};