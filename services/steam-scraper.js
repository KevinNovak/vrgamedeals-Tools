const _cheerio = require('cheerio');
const _rp = require('request-promise');
const _regexUtils = require('../utils/regex-utils');
const _stringUtils = require('../utils/string-utils');

const TITLE_REMOVE = [
    'Buy',
    'Play',
    'Download',
    'Install',
    'Pre-Purchase'
];

async function getSearchPageData(searchUrl) {
    let searchPageHtml = await _rp({ url: searchUrl });
    let $ = _cheerio.load(searchPageHtml);

    let searchResults = Array.from($('#search_resultsRows > a.search_result_row'));

    let searchPageData = [];
    for (var searchResult of searchResults) {
        let gameData = await getGameDataFromSearchResult(searchResult);
        searchPageData.push(gameData);
    }
    return searchPageData;
}


async function getSearchAppPageData(appUrl) {
    let appPageHtml = await _rp({ url: appUrl });
    let $ = _cheerio.load(appPageHtml);

    let firstGame = getMainGameElement($);
    if (!firstGame) {
        return {
            error: true,
            message: "Could not find any game elements."
        };
    }

    let countdown = getCountdownFromGameElement(firstGame);
    let headsets = getHeadsets($);

    return {
        countdown,
        headsets
    };
}

async function getAppPageData(appUrl) {
    let appPageHtml = await _rp({ url: appUrl });
    let $ = _cheerio.load(appPageHtml);

    let firstGame = getMainGameElement($);
    if (!firstGame) {
        return {
            error: true,
            message: "Could not find any game elements."
        };
    }

    let gameData = getGameDataFromGameElement(firstGame);
    let countdown = getCountdownFromGameElement(firstGame);
    let headsets = getHeadsets($);

    return {
        link: appUrl,
        ...gameData,
        countdown,
        headsets
    };
}

function getMainGameElement($) {
    let gameElements = Array.from($('#game_area_purchase .game_area_purchase_game:not(.demo_above_purchase)'));
    if (gameElements.length < 1) {
        return;
    }
    return gameElements[0];
}

function getHeadsets($) {
    let headsetTitleElement = $('.details_block.vrsupport > div:contains("Headsets")').parent();
    let headsetElements = Array.from(headsetTitleElement.nextUntil('.details_block'));

    let headsets = [];

    for (var headsetElement of headsetElements) {
        let headsetName = $('.name', headsetElement).text().trim();
        if (headsetName) {
            headsets.push(headsetName);
        }
    }

    return headsets;
}

async function getGameDataFromSearchResult(searchResult) {
    let $ = _cheerio.load(searchResult);

    let gameData = {
        title: "",
        link: "",
        type: "UNKNOWN",
        originalPrice: "",
        price: "",
        percentOff: "",
        reviewsPercent: "",
        reviewsCount: ""
    }

    let title = $('div.search_name > span.title').text().trim();
    if (title) {
        gameData.title = title;
    }

    let link = _stringUtils.stripQueryString(searchResult.attribs.href);
    if (link) {
        gameData.link = link;
    }

    if (gameData.link.includes('/app/')) {
        gameData.type = "APP";
    } else if (gameData.link.includes('/bundle/')) {
        gameData.type = "BUNDLE";
    }

    let price = $('div.search_price').clone().children().remove().end().text().trim();
    if (price) {
        gameData.price = price;
    }

    let originalPrice = $('div.search_price > span > strike').text().trim();
    if (originalPrice) {
        gameData.originalPrice = originalPrice;
    }

    let percentOff = _regexUtils.extractPercent($('div.search_discount > span').text().trim());
    if (percentOff) {
        gameData.percentOff = percentOff;
    }

    if (gameData.type == "APP") {
        let reviewsSummary = $('div.search_reviewscore > span.search_review_summary').attr('data-tooltip-html');

        if (reviewsSummary) {
            reviewsSummary = reviewsSummary.trim();
            let reviewsPercent = _regexUtils.extractPercent(reviewsSummary);
            if (reviewsPercent) {
                gameData.reviewsPercent = reviewsPercent;
            }

            let reviewsCount = _regexUtils.extractReviewsCount(reviewsSummary);
            if (reviewsCount) {
                gameData.reviewsCount = reviewsCount;
            }
        }
    }

    return gameData;
}

function getGameDataFromGameElement(gameElement) {
    let $ = _cheerio.load(gameElement);

    let gameData = {
        title: "",
        originalPrice: "",
        price: "",
        percentOff: ""
    }

    let title = $('.game_area_purchase_game > h1').children().remove().end().text().trim();
    for (var removeKeyword of TITLE_REMOVE) {
        if (title.startsWith(removeKeyword)) {
            title = title.substr(removeKeyword.length).trim();
        }
    }

    if (title) {
        gameData.title = title;
    }

    let originalPrice = $('.discount_original_price').text().trim();
    if (originalPrice) {
        gameData.originalPrice = originalPrice;
    }

    let percentOff = _regexUtils.extractPercent($('.discount_pct').text().trim());
    if (percentOff) {
        gameData.percentOff = percentOff;
    }

    let price = gameData.originalPrice ? $('.discount_final_price').text().trim() : $('.game_purchase_price').text().trim();
    if (price) {
        gameData.price = price;
    }

    return gameData;
}

function getCountdownFromGameElement(gameElement) {
    let $ = _cheerio.load(gameElement);

    let countdownData = {
        text: "",
        time: 0
    }

    try {
        let text = $('.game_purchase_discount_countdown').text().trim();
        if (text) {
            countdownData.text = text;
        }
    } catch { };


    try {
        let countdownScript = $('.game_area_purchase_game > script')[0].children[0].data;
        let countdownTimeText = _regexUtils.extractDiscountCountdown(countdownScript);
        let time = parseInt(countdownTimeText);
        if (time) {
            countdownData.time = time;
        }
    } catch { };

    return countdownData;
}

module.exports = {
    getAppPageData,
    getSearchAppPageData,
    getSearchPageData
};