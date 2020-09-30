import express from 'express';
import puppeteer from 'puppeteer';

import { HttpService, Logger, OculusScraper, SteamScraper } from './services';

let Debug = require('../config/debug.json');
let Logs = require('../lang/logs.json');
require('dotenv').config();

const PORT = process.env.PORT || 8080;

async function start(): Promise<void> {
    Logger.info(Logs.info.started);

    let httpService = new HttpService();
    let steamScraper = new SteamScraper();
    let oculusScraper = new OculusScraper();

    let app = express();
    app.use(express.json());
    app.use(express.static('public'));

    app.post('/api/steam/app-scrape', async (req, res) => {
        let appUrl = req.body.url;

        let appPageHtml;
        try {
            appPageHtml = await httpService.get(appUrl);
        } catch (error) {
            Logger.error(error);
            res.status(500).json({ message: 'Error retrieving page HTML.', error });
            return;
        }

        try {
            let appPageData = steamScraper.getAppPageData(appPageHtml);
            appPageData.link = appUrl;
            res.status(200).json(appPageData);
            return;
        } catch (error) {
            if (error.type === 'NO_GAME_ELEMENTS') {
                res.status(400).json({ message: 'No game elements.', error });
                return;
            }

            Logger.error(error);
            res.status(500).json({ message: 'Error scraping page data.', error });
            return;
        }
    });

    app.post('/api/steam/search-scrape', async (req, res) => {
        let searchUrl = req.body.url;
        let searchPageHtml;
        try {
            searchPageHtml = await httpService.get(searchUrl);
        } catch (error) {
            Logger.error(error);
            res.status(500).json({ message: 'Error retrieving page HTML.', error });
            return;
        }

        try {
            let searchPageData = steamScraper.getSearchPageData(searchPageHtml);
            res.status(200).json(searchPageData);
            return;
        } catch (error) {
            Logger.error(error);
            res.status(500).json({ message: 'Error scraping page data.', error });
            return;
        }
    });

    app.post('/api/steam/search-app-scrape', async (req, res) => {
        let appUrl = req.body.url;
        let appPageHtml;
        try {
            appPageHtml = await httpService.get(appUrl);
        } catch (error) {
            Logger.error(error);
            res.status(500).json({ message: 'Error retrieving page HTML.', error });
            return;
        }

        try {
            let appPageData = steamScraper.getSearchAppPageData(appPageHtml);
            res.status(200).json(appPageData);
            return;
        } catch (error) {
            if (error.type === 'NO_GAME_ELEMENTS') {
                res.status(400).json({ message: 'No game elements.', error });
                return;
            }

            Logger.error(error);
            res.status(500).json({ message: 'Error scraping page data.', error });
            return;
        }
    });

    app.post('/api/oculus/experience-scrape', async (req, res) => {
        let experienceUrl = req.body.url;
        let page;
        try {
            page = await browser.newPage();
        } catch (error) {
            Logger.error(error);
            res.status(500).json({ message: 'Could not create a new page.', error });
            return;
        }

        try {
            let experiencePageData = await oculusScraper.scrapePage(browser, page, experienceUrl);
            res.status(200).json(experiencePageData);
            return;
        } catch (error) {
            Logger.error(error);
            res.status(500).json({ message: 'Error scraping page data.', error });
            return;
        } finally {
            try {
                await page.close();
            } catch (error) {
                Logger.error('CRITICAL: Could not close page after encountering error.', error);
            }
        }
    });

    let browser = await puppeteer.launch({
        args: ['--no-sandbox'],
        headless: !Debug.enabled,
        userDataDir: './data',
    });

    app.listen(PORT, () => {
        Logger.info(`App listening on port ${PORT}!`);
    });
}

start();
