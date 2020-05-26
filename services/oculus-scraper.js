const _pt = require('promise-timeout');

async function scrapePage(page, url) {
    // let loggedIn = await isLoggedIn(page);
    // if (!loggedIn) {
    //     await login(page);
    // }

    // await page.goto(url);

    page.goto(url);
    return await _pt.timeout(getAppData(page), 10 * 1000);
}

function getAppData(page) {
    return new Promise(async (resolve, reject) => {
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
}

async function isLoggedIn(page) {
    return (await page.$('._1afi')) !== null;
}

async function login(page) {
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
