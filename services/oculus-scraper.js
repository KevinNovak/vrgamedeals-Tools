const _pt = require('promise-timeout');

const _logger = require('../services/logger');

async function scrapePage(page, url) {
    _logger.info(`[Oculus] Scraping '${url}'...`);
    return await _pt.timeout(getAppData(page, url), 30 * 1000);
}

function getAppData(page, url) {
    return new Promise(async (resolve, reject) => {
        _logger.info('[Oculus] Waiting for app data...');

        page.on('response', async response => {
            let request = response.request();
            // Check request type is XHR
            if (!isXhr(request)) {
                return;
            }

            // Check URL starts with what we want
            let requestUrl = request.url();
            if (!requestUrl.startsWith('https://graph.oculus.com/graphql')) {
                return;
            }

            // Check response is JSON
            let responseJson = await toJson(response);
            if (!responseJson) {
                return;
            }

            // Check property exists
            let node = responseJson.data?.node;
            if (!node) {
                return;
            }

            // Check property type is what we expect
            let nodeType = node.__typename;
            if (!nodeType?.toLowerCase() == 'application') {
                return;
            }

            // Close the page and return result
            _logger.info('[Oculus] Found app data!');
            resolve(node);
        });

        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 0 });
            _logger.info('[Oculus] Navigated to page.');

            let loggedIn = await isLoggedIn(page);
            if (!loggedIn) {
                _logger.info('[Oculus] User is not logged in, logging in...');
                await login(page);
                let loggedIn = await isLoggedIn(page);
                if (loggedIn) {
                    _logger.info('[Oculus] Successfully logged in!');
                } else {
                    _logger.error('[Oculus] Failed to login!');
                }

                await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 0 });
                _logger.info('[Oculus] Navigated to page.');
            } else {
                _logger.info('[Oculus] User is logged in!');
            }
        } catch (error) {
            if (error.message.toLowerCase().includes('browser has disconnected')) {
                _logger.info('[Oculus] Browser disconnected!');
                return;
            }
            throw error;
        }
    });
}

async function isLoggedIn(page) {
    return (await page.$('._8gvi')) !== null;
}

async function login(page) {
    await page.goto('https://auth.oculus.com/login-without-facebook/', {
        waitUntil: 'domcontentloaded',
        timeout: 0,
    });
    await page.waitFor('input#email', { timeout: 0 });
    await page.type('input#email', process.env.OCULUS_USERNAME);
    await page.waitFor('input#password', { timeout: 0 });
    await page.type('input#password', process.env.OCULUS_PASSWORD);
    await page.waitFor('button#sign_in', { timeout: 0 });
    await page.click('button#sign_in');
    await page.waitForNavigation();
    return;
}

function isXhr(request) {
    return ['xhr', 'fetch'].includes(request.resourceType().toLowerCase());
}

async function toJson(response) {
    try {
        return await response.json();
    } catch (error) {
        return;
    }
}

module.exports = {
    scrapePage,
};
