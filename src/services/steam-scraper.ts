import cheerio from 'cheerio';

import {
    AppPageData,
    CountdownData,
    GameData,
    GameElementData,
    ReviewData,
    SearchAppPageData,
} from '../models/internal-models';
import { RegexUtils, StringUtils } from '../utils';

export class SteamScraper {
    public getAppPageData(appPageHtml: string): AppPageData {
        let firstGame = this.getMainGameElement(appPageHtml);
        if (!firstGame) {
            return;
        }

        let title = this.getTitle(appPageHtml);
        let gameData = this.getGameDataFromGameElement(firstGame);
        let countdown = this.getCountdownFromGameElement(firstGame);
        let vrSupport = this.getVrSupportFromGameElement(firstGame);
        let headsets = this.getHeadsets(appPageHtml);
        let reviews = this.getReviews(appPageHtml);

        return {
            title,
            ...gameData,
            ...reviews,
            countdown,
            vrSupport,
            headsets,
            link: undefined,
        };
    }

    public getSearchPageData(searchPageHtml: string): GameData[] {
        let $ = cheerio.load(searchPageHtml);

        let searchResults = Array.from($('#search_resultsRows > a.search_result_row'));

        let searchPageData: GameData[] = [];

        for (let searchResult of searchResults) {
            let gameData = this.getGameDataFromSearchResult(searchResult);
            searchPageData.push(gameData);
        }

        return searchPageData;
    }

    public getSearchAppPageData(appPageHtml: string): SearchAppPageData {
        let firstGame = this.getMainGameElement(appPageHtml);
        if (!firstGame) {
            return;
        }

        let countdown = this.getCountdownFromGameElement(firstGame);
        let vrSupport = this.getVrSupportFromGameElement(firstGame);
        let headsets = this.getHeadsets(appPageHtml);

        return {
            countdown,
            vrSupport,
            headsets,
        };
    }

    private getMainGameElement(appPageHtml: string): cheerio.Element {
        let $ = cheerio.load(appPageHtml);

        let gameElements = Array.from(
            $('#game_area_purchase .game_area_purchase_game:not(.demo_above_purchase)')
        );
        if (gameElements.length < 1) {
            return;
        }

        return gameElements[0];
    }

    private getTitle(appPageHtml: string): string {
        let $ = cheerio.load(appPageHtml);

        let title = '';

        let gameDetailsElement = $('.game_details .details_block:contains("Title:")').first();

        if (gameDetailsElement) {
            let gameDetailsContent = gameDetailsElement.html().trim();
            title = RegexUtils.extractTitle(gameDetailsContent);
        }

        return title;
    }

    private getHeadsets(appPageHtml: string): string[] {
        let $ = cheerio.load(appPageHtml);

        let headsetTitleElement = $('.details_block.vrsupport > div:contains("Headsets")').parent();
        let headsetElements = Array.from(headsetTitleElement.nextUntil('.details_block'));

        let headsets: string[] = [];

        for (let headsetElement of headsetElements) {
            let headsetName = $('.name', headsetElement).text().trim();
            if (headsetName) {
                headsets.push(headsetName);
            }
        }

        return headsets;
    }

    private getReviews(appPageHtml: string): ReviewData {
        let $ = cheerio.load(appPageHtml);

        let reviewData: ReviewData = {
            reviewsPercent: '',
            reviewsCount: '',
        };

        let reviewsTooltip = $('div.user_reviews_summary_bar span.game_review_summary')
            .first()
            .data('tooltip-html');

        if (reviewsTooltip) {
            reviewsTooltip = reviewsTooltip.trim();
            reviewData = this.extractReviewDataFromTooltip(reviewsTooltip);
        }

        return reviewData;
    }

    private getGameDataFromSearchResult(searchResult: cheerio.Element): GameData {
        let $ = cheerio.load(searchResult);

        let gameData: GameData = {
            link: '',
            title: '',
            type: 'UNKNOWN',
            price: '',
            originalPrice: '',
            percentOff: '',
            reviewsPercent: '',
            reviewsCount: '',
        };

        let title = $('div.search_name > span.title').text().trim();
        if (title) {
            gameData.title = title;
        }

        let link = StringUtils.stripQueryString(searchResult.attribs.href);
        if (link) {
            gameData.link = link;
        }

        if (gameData.link.includes('/app/')) {
            gameData.type = 'APP';
        } else if (gameData.link.includes('/bundle/')) {
            gameData.type = 'BUNDLE';
        }

        let price = $('div.search_price').clone().children().remove().end().text().trim();
        if (price) {
            gameData.price = price;
        }

        let originalPrice = $('div.search_price > span > strike').text().trim();
        if (originalPrice) {
            gameData.originalPrice = originalPrice;
        }

        let percentOff = RegexUtils.extractPercent($('div.search_discount > span').text().trim());
        if (percentOff) {
            gameData.percentOff = percentOff;
        }

        if (gameData.type === 'APP') {
            let reviewsTooltip: string = $(
                'div.search_reviewscore > span.search_review_summary'
            ).data('tooltip-html');

            if (reviewsTooltip) {
                reviewsTooltip = reviewsTooltip.trim();
                let reviewData = this.extractReviewDataFromTooltip(reviewsTooltip);
                gameData.reviewsPercent = reviewData.reviewsPercent;
                gameData.reviewsCount = reviewData.reviewsCount;
            }
        }

        return gameData;
    }

    private extractReviewDataFromTooltip(reviewsTooltip: string): ReviewData {
        let reviewData: ReviewData = {
            reviewsPercent: '',
            reviewsCount: '',
        };

        let reviewsPercent = RegexUtils.extractPercent(reviewsTooltip);
        if (reviewsPercent) {
            reviewData.reviewsPercent = reviewsPercent;
        }
        let reviewsCount = RegexUtils.extractReviewsCount(reviewsTooltip);
        if (reviewsCount) {
            reviewData.reviewsCount = reviewsCount;
        }

        return reviewData;
    }

    private getGameDataFromGameElement(gameElement: cheerio.Element): GameElementData {
        let $ = cheerio.load(gameElement);

        let gameData: GameElementData = {
            price: '',
            originalPrice: '',
            percentOff: '',
        };

        let originalPrice = $('.discount_original_price').text().trim();
        if (originalPrice) {
            gameData.originalPrice = originalPrice;
        }

        let percentOff = RegexUtils.extractPercent($('.discount_pct').text().trim());
        if (percentOff) {
            gameData.percentOff = percentOff;
        }

        let price = gameData.originalPrice
            ? $('.discount_final_price').text().trim()
            : $('.game_purchase_price').text().trim();
        if (price) {
            gameData.price = price;
        }

        return gameData;
    }

    private getCountdownFromGameElement(gameElement: cheerio.Element): CountdownData {
        let $ = cheerio.load(gameElement);

        let countdownData: CountdownData = {
            text: '',
            time: 0,
        };

        try {
            let text = $('.game_purchase_discount_countdown').text().trim();
            if (text) {
                countdownData.text = text;
            }
        } catch {
            // Ignore
        }

        try {
            let countdownScript = $('.game_area_purchase_game > script')[0].children[0].data;
            let countdownTimeText = RegexUtils.extractDiscountCountdown(countdownScript);
            let time = parseInt(countdownTimeText);
            if (time) {
                countdownData.time = time;
            }
        } catch {
            // Ignore
        }

        return countdownData;
    }

    private getVrSupportFromGameElement(gameElement: cheerio.Element): string {
        let $ = cheerio.load(gameElement);

        let vrSupport = 'NONE';

        if ($('.vr_required').length > 0) {
            vrSupport = 'REQUIRED';
        } else if ($('.vr_supported').length > 0) {
            vrSupport = 'SUPPORTED';
        }

        return vrSupport;
    }
}
