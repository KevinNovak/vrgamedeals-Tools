import { Request, Response, Router } from 'express';
import router from 'express-promise-router';
import { Browser, Page } from 'puppeteer';

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
        let appUrl = req.body.url;

        let appPageHtml: string;
        try {
            appPageHtml = await this.httpService.get(appUrl);
        } catch (error) {
            Logger.error(error);
            res.status(500).json({ message: 'Error retrieving page HTML.', error });
            return;
        }

        try {
            let appPageData = this.steamScraper.getAppPageData(appPageHtml);
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
    }

    private async steamSearchScrape(req: Request, res: Response) {
        let searchUrl = req.body.url;
        let searchPageHtml: string;
        try {
            searchPageHtml = await this.httpService.get(searchUrl);
        } catch (error) {
            Logger.error(error);
            res.status(500).json({ message: 'Error retrieving page HTML.', error });
            return;
        }

        try {
            let searchPageData = this.steamScraper.getSearchPageData(searchPageHtml);
            res.status(200).json(searchPageData);
            return;
        } catch (error) {
            Logger.error(error);
            res.status(500).json({ message: 'Error scraping page data.', error });
            return;
        }
    }

    private async steamSearchAppScrape(req: Request, res: Response) {
        let appUrl = req.body.url;
        let appPageHtml: string;
        try {
            appPageHtml = await this.httpService.get(appUrl);
        } catch (error) {
            Logger.error(error);
            res.status(500).json({ message: 'Error retrieving page HTML.', error });
            return;
        }

        try {
            let appPageData = this.steamScraper.getSearchAppPageData(appPageHtml);
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
    }

    private async oculusExperienceScrape(req: Request, res: Response) {
        let experienceUrl = req.body.url;
        let page: Page;
        try {
            page = await this.browser.newPage();
        } catch (error) {
            Logger.error(error);
            res.status(500).json({ message: 'Could not create a new page.', error });
            return;
        }

        try {
            let experiencePageData = await this.oculusScraper.scrapePage(
                this.browser,
                page,
                experienceUrl
            );
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
    }
}
