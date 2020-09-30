import pt from 'promise-timeout';
import { Browser, Page, Request, Response } from 'puppeteer';

import { Logger } from '.';

export class OculusScraper {
    public async scrapePage(browser: Browser, page: Page, url: string) {
        Logger.info(`[Oculus] Scraping '${url}'...`);
        return await pt.timeout(this.getAppData(browser, page, url), 60 * 1000);
    }

    private getAppData(browser: Browser, page: Page, url: string) {
        return new Promise(async (resolve, reject) => {
            Logger.info('[Oculus] Waiting for app data...');

            page.on('response', async response => {
                let request = response.request();
                // Check request type is XHR
                if (!this.isXhr(request)) {
                    return;
                }

                // Check URL starts with what we want
                let requestUrl = request.url();
                if (!requestUrl.startsWith('https://graph.oculus.com/graphql')) {
                    return;
                }

                // Check response is JSON
                let responseJson = await this.toJson(response);
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
                if (nodeType?.toLowerCase() !== 'application') {
                    return;
                }

                // Close the page and return result
                Logger.info('[Oculus] Found app data!');
                resolve(node);
            });

            try {
                await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 0 });
                Logger.info('[Oculus] Navigated to page.');

                let loggedIn = await this.isLoggedIn(page);
                if (!loggedIn) {
                    reject('User is not logged in!');
                    Logger.info('[Oculus] User is not logged in, logging in...');
                    await this.login(browser);
                } else {
                    Logger.info('[Oculus] User is logged in!');
                }
            } catch (error) {
                if (
                    error.message.includes('browser has disconnected') ||
                    error.message.includes('Session closed')
                ) {
                    Logger.info('[Oculus] Browser or page disconnected!');
                    return;
                }
                throw error;
            }
        });
    }

    private async isLoggedIn(page: Page): Promise<boolean> {
        return (await page.$('._8gvi')) !== null;
    }

    private async login(browser: Browser): Promise<void> {
        let page: Page;
        try {
            Logger.info('1');
            page = await browser.newPage();
            Logger.info('2');
        } catch (error) {
            Logger.error(error);
            return;
        }

        try {
            Logger.info('3');
            page.goto('https://auth.oculus.com/login-without-facebook/', {
                waitUntil: 'domcontentloaded',
                timeout: 0,
            });
            Logger.info('4');
            await page.waitFor(1000);
            await page.screenshot({ path: 'screenshot-1.png' });
            await page.waitFor(2000);
            await page.screenshot({ path: 'screenshot-2.png' });
            await page.waitFor(4000);
            await page.screenshot({ path: 'screenshot-3.png' });
            await page.waitFor(8000);
            await page.screenshot({ path: 'screenshot-4.png' });
            await page.waitFor(16000);
            await page.screenshot({ path: 'screenshot-5.png' });
            Logger.info('5');
            await page.type('input#email', process.env.OCULUS_USERNAME);
            Logger.info('6');
            await page.type('input#password', process.env.OCULUS_PASSWORD);
            Logger.info('7');
            await page.click('button#sign_in');
            Logger.info('8');
            await page.waitForNavigation();
            Logger.info('9');
            let loggedIn = await this.isLoggedIn(page);
            Logger.info('10');
            if (loggedIn) {
                Logger.info('[Oculus] Successfully logged in!');
            } else {
                Logger.error('[Oculus] Failed to login!');
            }
        } catch (error) {
            Logger.error(error);
        } finally {
            try {
                await page.close();
            } catch (error) {
                Logger.error('CRITICAL: Could not close page after encountering error.', error);
            }
        }
    }

    private isXhr(request: Request): boolean {
        return ['xhr', 'fetch'].includes(request.resourceType().toLowerCase());
    }

    private async toJson(response: Response): Promise<any> {
        try {
            return await response.json();
        } catch (error) {
            return;
        }
    }
}
