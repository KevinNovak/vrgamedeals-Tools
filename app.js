const _express = require('express');
const _app = _express();
const _bodyParser = require('body-parser');
const _steamScraper = require('./services/steam-scraper');

const PORT = process.env.PORT || 8080;

function main() {
    _app.use(_express.static('public'));
    _app.use(_bodyParser.urlencoded({ extended: false }))
    _app.use(_bodyParser.json());

    _app.get('/api/app/:id', async (req, res) => {
        let id = req.params.id;
        let gamePageData = await _steamScraper.getAppPageData(id);
        res.json(gamePageData);
    });

    _app.get('/api/search/', async (req, res) => {
        let query = "";
        let searchPageData = await _steamScraper.getSearchPageData(query);
        res.json(searchPageData);
    });

    _app.get('/api/search/:query', async (req, res) => {
        let query = req.params.query;
        let searchPageData = await _steamScraper.getSearchPageData(query);
        res.json(searchPageData);
    });

    _app.listen(PORT, () => {
        console.log(`App listening on port ${PORT}!`);
    });
}

main();
