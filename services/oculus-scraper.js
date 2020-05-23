async function scrapePage(browser, url, res) {
    const page = await browser.newPage();

    listener = page.on('response', async response => {
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

        res.status(200).json(node);
        await page.close();
    });

    await page.goto(url);
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
