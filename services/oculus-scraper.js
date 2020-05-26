const _pt = require('promise-timeout');

async function scrapePage(browser, url) {
    const page = await browser.newPage();
    await page.goto(url).catch(async error => {
        await page.close();
        throw error;
    });

    let loggedIn = await isLoggedIn(page);

    let getJson = new Promise(async (resolve, reject) => {
        page.on('response', async response => {
            let request = response.request();
            // Check request type is XHR
            if (!isXhr(request)) {
                return;
            }

            // Check URL starts with what we want
            let requestUrl = request.url();
            console.log(requestUrl);
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
            resolve(node);
        });
    });

    return await _pt
        .timeout(getJson, 5 * 1000)
        .catch(async error => {
            throw error;
        })
        .finally(async () => await page.close());
}

async function isLoggedIn(page) {
    return (await page.$('._1afi')) !== null;
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
