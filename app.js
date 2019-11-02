const _express = require('express');
const _app = _express();
const _bodyParser = require('body-parser');
const _steamScraper = require('./services/steam-scraper');

const PORT = process.env.PORT || 8080;

function main() {
    _app.use(_express.static('public'));
    _app.use(_bodyParser.urlencoded({ extended: false }))
    _app.use(_bodyParser.json());

    _app.post('/api/app-scrape', async (req, res) => {
        let appUrl = req.body.url;
        let gamePageData = await _steamScraper.getAppPageData(appUrl);
        res.json(gamePageData);
    });

    _app.post('/api/headset-scrape', async (req, res) => {
        let searchUrl = req.body.url;
        let searchPageData = await _steamScraper.getHeadsetsFromAppPage(searchUrl);
        res.json(searchPageData);
    });

    _app.post('/api/search-scrape', async (req, res) => {
        let searchUrl = req.body.url;
        let searchPageData = await _steamScraper.getSearchPageData(searchUrl);
        res.json(searchPageData);
    });

    _app.listen(PORT, () => {
        console.log(`App listening on port ${PORT}!`);
    });
}

main();
