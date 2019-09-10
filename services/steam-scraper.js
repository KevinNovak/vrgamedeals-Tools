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
    let gameData = getGameDataFromGameElement(firstGame);
    let headsets = getHeadsets($);

    return {
        link: appUrl,
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
        let gameData = await getGameDataFromSearchResult(searchResult);
        searchPageData.push(gameData);
    }
    return searchPageData;
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

async function getHeadsetsFromLink(link) {
    let pageHtml = await _rp({ url: link });
    let $ = _cheerio.load(pageHtml);
    return getHeadsets($);
}

async function getGameDataFromSearchResult(searchResult) {
    let $ = _cheerio.load(searchResult);

    let title = "";
    let link = "";
    let price = "";
    let discounted = false;
    let originalPrice = "";
    let percentOff = "";
    let headsets = [];

    title = $('div.search_name > span.title').text().trim();
    link = stripQueryString(searchResult.attribs.href);
    price = $('div.search_price').clone().children().remove().end().text().trim();
    originalPrice = $('div.search_price > span > strike').text().trim();
    percentOff = extractPercent($('div.search_discount > span').text().trim());

    if (originalPrice && percentOff) {
        discounted = true;
    }

    headsets = await getHeadsetsFromLink(link);

    return {
        title,
        link,
        originalPrice,
        discounted,
        price,
        percentOff,
        headsets
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
    percentOff = extractPercent($('.discount_pct').text().trim());

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
    getSearchPageData
};