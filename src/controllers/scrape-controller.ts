import { Request, Response, Router } from 'express';
import router from 'express-promise-router';

import { HttpService, SteamScraper } from '../services';
import { Controller } from './controller';

export class ScrapeController implements Controller {
    public path = '/';
    public router: Router = router();

    constructor(private steamScraper: SteamScraper, private httpService: HttpService) {
        this.router.post('/api/steam/app-scrape', (req, res) => this.steamAppScrape(req, res));
        this.router.post('/api/steam/search-scrape', (req, res) =>
            this.steamSearchScrape(req, res)
        );
        this.router.post('/api/steam/search-app-scrape', (req, res) =>
            this.steamSearchAppScrape(req, res)
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
}
