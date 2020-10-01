import puppeteer from 'puppeteer';
import { Api } from './api';
import { RootController, ScrapeController } from './controllers';

import { HttpService, Logger, OculusScraper, SteamScraper } from './services';

let Debug = require('../config/debug.json');
require('dotenv').config();

async function start(): Promise<void> {
    // Services
    let httpService = new HttpService();
    let steamScraper = new SteamScraper();
    let oculusScraper = new OculusScraper();

    // Browser
    let browser = await puppeteer.launch({
        args: ['--no-sandbox'],
        headless: !Debug.enabled,
        userDataDir: './data',
    });

    // Controllers
    let rootController = new RootController();
    let scrapeController = new ScrapeController(browser, steamScraper, oculusScraper, httpService);

    let api = new Api([rootController, scrapeController]);

    await api.start();
}

process.on('unhandledRejection', (reason, promise) => {
    Logger.error('Unhandled promise rejection.', reason);
});

start();
