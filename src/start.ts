import { Api } from './api';
import { RootController, ScrapeController } from './controllers';

import { HttpService, Logger, SteamScraper } from './services';

async function start(): Promise<void> {
    // Services
    let httpService = new HttpService();
    let steamScraper = new SteamScraper();

    // Controllers
    let rootController = new RootController();
    let scrapeController = new ScrapeController(steamScraper, httpService);

    let api = new Api([rootController, scrapeController]);

    await api.start();
}

process.on('unhandledRejection', (reason, promise) => {
    Logger.error('Unhandled promise rejection.', reason);
});

start().catch(error => {
    Logger.error('An unspecified error occurred.', error);
});
