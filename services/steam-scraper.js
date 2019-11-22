const _cheerio = require('cheerio');
const _rp = require('request-promise');
const _regexUtils = require('../utils/regex-utils');

const TITLE_REMOVE = [
    'Buy',
    'Play',
    'Download',
    'Install',
    'Pre-Purchase'
];

async function getAppPageData(appUrl) {
    let appPageHtml = await _rp({ url: appUrl });
    let $ = _cheerio.load(appPageHtml);

    let gameElements = Array.from($('#game_area_purchase .game_area_purchase_game'));
    if (gameElements.length < 1) {
        return {
            error: true,
            message: "Could not find any game elements."
        };
    }

    let firstGame = gameElements[0];
    let gameData = getGameDataFromGameElement(firstGame);
    let headsets = getHeadsets($);

    return {
        link: appUrl,
        ...gameData,
        headsets
    };
}

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



function stripQueryString(url) {
    return url.split(/[?#]/)[0];
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

async function getSearchAppPageData(appUrl) {
    let appPageHtml = await _rp({ url: appUrl });
    let $ = _cheerio.load(appPageHtml);

    let gameElements = Array.from($('#game_area_purchase .game_area_purchase_game'));
    if (gameElements.length < 1) {
        return {
            error: true,
            message: "Could not find any game elements."
        };
    }

    let firstGame = gameElements[0];
    let countdown = getCountdown(firstGame);
    let headsets = getHeadsets($);

    return {
        countdown,
        headsets
    };
}

function getCountdown(gameElement) {
    let $ = _cheerio.load(gameElement);

    let text = "";
    let time = 0;

    try {
        text = $('.game_purchase_discount_countdown').text().trim();
    } catch { };


    try {
        let countdownScript = $('.game_area_purchase_game > script')[0].children[0].data;
        let countdownTimeText = _regexUtils.extractDiscountCountdown(countdownScript);
        time = parseInt(countdownTimeText);
    } catch { };

    return {
        text,
        time
    }
}

async function getGameDataFromSearchResult(searchResult) {
    let $ = _cheerio.load(searchResult);

    let title = "";
    let link = "";
    let type = "UNKNOWN";
    let price = "";
    let discounted = false;
    let originalPrice = "";
    let percentOff = "";
    let reviewsPercent = "";
    let reviewsCount = "";

    title = $('div.search_name > span.title').text().trim();
    link = stripQueryString(searchResult.attribs.href);

    if (link.includes('/app/')) {
        type = "APP";
    } else if (link.includes('/bundle/')) {
        type = "BUNDLE";
    }

    price = $('div.search_price').clone().children().remove().end().text().trim();
    originalPrice = $('div.search_price > span > strike').text().trim();
    percentOff = _regexUtils.extractPercent($('div.search_discount > span').text().trim());

    if (originalPrice && percentOff) {
        discounted = true;
    }

    if (type == "APP") {
        let reviewsSummary = $('div.search_reviewscore > span.search_review_summary').attr('data-tooltip-html');

        if (reviewsSummary) {
            reviewsSummary = reviewsSummary.trim();
            reviewsPercent = _regexUtils.extractPercent(reviewsSummary);
            reviewsCount = _regexUtils.extractReviewsCount(reviewsSummary).replace(/,/g, '');
        }
    }

    return {
        title,
        link,
        type,
        originalPrice,
        discounted,
        price,
        percentOff,
        reviewsPercent,
        reviewsCount,
    };
}

function getGameDataFromGameElement(gameElement) {
    let $ = _cheerio.load(gameElement);

    let title = "";
    let price = "";
    let discounted = false;
    let originalPrice = "";
    let percentOff = "";

    title = $('.game_area_purchase_game > h1').children().remove().end().text().trim();
    for (var removeKeyword of TITLE_REMOVE) {
        if (title.startsWith(removeKeyword)) {
            title = title.substr(removeKeyword.length).trim();
        }
    }

    originalPrice = $('.discount_original_price').text().trim();
    percentOff = _regexUtils.extractPercent($('.discount_pct').text().trim());

    if (originalPrice && percentOff) {
        discounted = true;
    }

    price = discounted ? $('.discount_final_price').text().trim() : $('.game_purchase_price').text().trim();;

    return {
        title,
        originalPrice,
        discounted,
        price,
        percentOff
    };
}

module.exports = {
    getAppPageData,
    getSearchAppPageData,
    getSearchPageData
};