import { Request, Response, Router } from 'express';
import router from 'express-promise-router';
import { Browser } from 'puppeteer';

import { HttpService, Logger, OculusScraper, SteamScraper } from '../services';
import { Controller } from './controller';

export class ScrapeController implements Controller {
    public path = '/';
    public router: Router = router();

    constructor(
        private browser: Browser,
        private steamScraper: SteamScraper,
        private oculusScraper: OculusScraper,
        private httpService: HttpService
    ) {
        this.router.post('/api/steam/app-scrape', (req, res) => this.steamAppScrape(req, res));
        this.router.post('/api/steam/search-scrape', (req, res) =>
            this.steamSearchScrape(req, res)
        );
        this.router.post('/api/steam/search-app-scrape', (req, res) =>
            this.steamSearchAppScrape(req, res)
        );
        this.router.post('/api/oculus/experience-scrape', (req, res) =>
            this.oculusExperienceScrape(req, res)
        );
    }

    private async steamAppScrape(req: Request, res: Response) {
        let html = await this.httpService.get(req.body.url);

        let data = this.steamScraper.getAppPageData(html);
        if (!data) {
            res.status(400).json({ message: 'No game elements.' });
            return;
        }

        data.link = req.body.url;
        res.status(200).json(data);
    }

    private async steamSearchScrape(req: Request, res: Response) {
        let html = await this.httpService.get(req.body.url);
        let data = this.steamScraper.getSearchPageData(html);
        res.status(200).json(data);
    }

    private async steamSearchAppScrape(req: Request, res: Response) {
        let html = await this.httpService.get(req.body.url);

        let data = this.steamScraper.getSearchAppPageData(html);
        if (!data) {
            res.status(400).json({ message: 'No game elements.' });
            return;
        }

        res.status(200).json(data);
    }

    private async oculusExperienceScrape(req: Request, res: Response) {
        let page = await this.browser.newPage();

        try {
            let data = await this.oculusScraper.scrapePage(this.browser, page, req.body.url);
            res.status(200).json(data);
        } finally {
            try {
                await page.close();
            } catch (error) {
                Logger.error('CRITICAL: Could not close page after encountering error.', error);
            }
        }
    }
}
