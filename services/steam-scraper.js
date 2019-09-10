const _cheerio = require('cheerio');
const _rp = require('request-promise');

const TITLE_REMOVE = [
    'Buy',
    'Play',
    'Download',
    'Install',
    'Pre-Purchase'
];
const STEAM_APP_URL = 'https://store.steampowered.com/app/{{APP_ID}}';
const STEAM_SEARCH_URL = 'https://store.steampowered.com/search/?{{QUERY}}'

const APP_ID_URL_REGEX = /\/app\/(\d+)\//i;
const PERCENT_REGEX = /(\d+%)/;

async function getAppPageData(appId) {
    let appUrl = STEAM_APP_URL.replace('{{APP_ID}}', appId);
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
    let gameData = getGameDataFromGameElement($, firstGame);
    let headsets = getHeadsets($);

    return {
        url: appUrl,
        ...gameData,
        headsets
    };
}

async function getSearchPageData(query) {
    let searchUrl = STEAM_SEARCH_URL.replace('{{QUERY}}', query);
    let searchPageHtml = await _rp({ url: searchUrl });
    let $ = _cheerio.load(searchPageHtml);

    let searchResults = Array.from($('#search_resultsRows > a[href*="\/app\/"].search_result_row'));

    let searchPageData = [];
    for (var searchResult of searchResults) {
        let gameData = getGameDataFromSearchResult(searchResult);
        searchPageData.push(gameData);
    }
    return searchPageData;
}

function extractAppIdFromUrl(input) {
    let match = APP_ID_URL_REGEX.exec(input);
    if (match) {
        return match[1];
    }
}

function extractPercent(input) {
    let match = PERCENT_REGEX.exec(input);
    if (match) {
        return match[1];
    }
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

function getGameDataFromSearchResult(searchResult) {
    let $ = _cheerio.load(searchResult);

    let title = "";
    let link = "";
    let originalPrice = "";
    let discounted = false;
    let price = "";
    let percentOff = "";

    title = $('div.search_name > span.title').text().trim();
    link = stripQueryString(searchResult.attribs.href);
    originalPrice = $('div.search_price > span > strike').text().trim();
    price = $('div.search_price').clone().children().remove().end().text().trim();
    percentOff = extractPercent($('div.search_discount > span').text().trim());

    if (percentOff) {
        discounted = true;
    }

    return {
        title,
        link,
        originalPrice,
        discounted,
        price,
        percentOff
    };
}

function getGameDataFromGameElement($, firstGame) {
    let title = $('.game_area_purchase_game > h1', firstGame).children().remove().end().text().trim();
    for (var removeKeyword of TITLE_REMOVE) {
        if (title.startsWith(removeKeyword)) {
            title = title.substr(removeKeyword.length).trim();
        }
    }

    let discounted = $('.discount_block', firstGame).length > 0;

    let originalPrice = "";
    let discountPrice = "";
    let percentOff = "";

    if (discounted) {
        originalPrice = $('.discount_original_price', firstGame).text().trim();
        discountPrice = $('.discount_final_price', firstGame).text().trim();
        percentOff = $('.discount_pct', firstGame).text().trim();
        let percentOffExtracted = extractPercent(percentOff);
        if (percentOffExtracted) {
            percentOff = percentOffExtracted;
        }
    }
    else {
        originalPrice = $('.game_purchase_price', firstGame).text().trim();
    }

    return {
        title,
        originalPrice,
        discounted,
        discountPrice,
        percentOff
    };
}

module.exports = {
    getAppPageData,
    getSearchPageData
};