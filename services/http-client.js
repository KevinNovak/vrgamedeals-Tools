const _rp = require('request-promise');
const _logger = require('./logger');

async function get(url) {
    try {
        return await _rp({ url });
    } catch (error) {
        _logger.error(error);
        return;
    }
}

module.exports = {
    get
};