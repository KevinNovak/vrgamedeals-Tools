const _pt = require('promise-timeout');

const _logger = require('../services/logger');

async function scrapePage(browser, page, url) {
    _logger.info(`[Oculus] Scraping '${url}'...`);
    return await _pt.timeout(getAppData(browser, page, url), 60 * 1000);
}

function getAppData(browser, page, url) {
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
                reject('User is not logged in!');
                _logger.info('[Oculus] User is not logged in, logging in...');
                await login(browser);
            } else {
                _logger.info('[Oculus] User is logged in!');
            }
        } catch (error) {
            if (
                error.message.includes('browser has disconnected') ||
                error.message.includes('Session closed')
            ) {
                _logger.info('[Oculus] Browser or page disconnected!');
                return;
            }
            throw error;
        }
    });
}

async function isLoggedIn(page) {
    return (await page.$('._8gvi')) !== null;
}

async function login(browser) {
    let page;
    try {
        _logger.info('1');
        page = await browser.newPage();
        _logger.info('2');
    } catch (error) {
        _logger.error(error);
        return;
    }

    try {
        _logger.info('3');
        await page.goto('https://auth.oculus.com/login-without-facebook/', {
            waitUntil: 'domcontentloaded',
            timeout: 0,
        });
        _logger.info('4');
        await page.waitFor('input#email', { timeout: 0 });
        _logger.info('5');
        await page.type('input#email', process.env.OCULUS_USERNAME);
        _logger.info('6');
        await page.waitFor('input#password', { timeout: 0 });
        _logger.info('7');
        await page.type('input#password', process.env.OCULUS_PASSWORD);
        _logger.info('8');
        await page.waitFor('button#sign_in', { timeout: 0 });
        _logger.info('9');
        await page.click('button#sign_in');
        _logger.info('10');
        await page.waitForNavigation();
        _logger.info('11');
        let loggedIn = await isLoggedIn(page);
        _logger.info('12');
        if (loggedIn) {
            _logger.info('[Oculus] Successfully logged in!');
        } else {
            _logger.error('[Oculus] Failed to login!');
        }
    } catch (error) {
        _logger.error(error);
    } finally {
        try {
            await page.close();
        } catch (error) {
            _logger.error('CRITICAL: Could not close page after encountering error.', error);
        }
    }
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
