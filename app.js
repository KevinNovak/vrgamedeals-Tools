const _express = require('express');
const _app = _express();
const _bodyParser = require('body-parser');
const _steamScraper = require('./services/steam-scraper');

const PORT = process.env.PORT || 8080;
const SEARCH_TIMEOUT = 180000;

function main() {
    _app.use(_express.static('public'));
    _app.use(_bodyParser.urlencoded({ extended: false }))
    _app.use(_bodyParser.json());

    _app.post('/api/app-scrape', async (req, res) => {
        let appUrl = req.body.url;
        let gamePageData = await _steamScraper.getAppPageData(appUrl);
        res.json(gamePageData);
    });

    _app.post('/api/search-scrape', async (req, res) => {
        req.setTimeout(SEARCH_TIMEOUT);

        let searchUrl = req.body.url;
        let pages = req.body.pages || 1;

        let searchPageData = await _steamScraper.getSearchPageData(searchUrl, pages);
        res.json(searchPageData);
    });

    _app.listen(PORT, () => {
        console.log(`App listening on port ${PORT}!`);
    });
}

main();
