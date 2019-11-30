const STEAM_APP_URL_REGEX = /^https:\/\/store.steampowered.com\/app\/\d+/;
const STEAM_SEARCH_URL_REGEX = /^https:\/\/store.steampowered.com\/search\/\S*/;
const PRICE_NUMBER_REGEX = /\$(\d+\.\d{2})/;
const PERCENT_NUMBER_REGEX = /(\d+)%/;

const NEW_LINE = '&#10';
const MAX_PAGES = 100;
const MAX_RETRIES = 10;

const BUNDLE_PREFIX = "**Bundle** - ";

const HEADSET_ALIASES = {
    'Valve Index': {
        shortName: 'Index',
        abbreviation: 'I'
    },
    'HTC Vive': {
        shortName: 'Vive',
        abbreviation: 'V'
    },
    'Oculus Rift': {
        shortName: 'Rift',
        abbreviation: 'R'
    },
    'Oculus Rift DK2': {
        shortName: 'Rift DK2',
        abbreviation: 'DK2'
    },
    'Windows Mixed Reality': {
        shortName: 'WMR',
        abbreviation: 'W'
    }
}

let cache = {
    searchData: []
}

async function retrieveSteamAppTitle() {
    let retrievePageButton = document.getElementById('retrieve-steam-app-title');
    let pageResultsDiv = document.getElementById('page-results');

    retrievePageButton.disabled = true;
    pageResultsDiv.innerHTML = "Retrieving...";

    let steamAppUrlInput = document.getElementById('steam-app-url');
    let steamAppUrl = steamAppUrlInput.value.trim();
    if (!steamAppUrl || !STEAM_APP_URL_REGEX.test(steamAppUrl)) {
        retrievePageButton.disabled = false;
        pageResultsDiv.innerHTML = "No results. Please input a valid Steam App URL.";
        return;
    }

    let content = {
        url: steamAppUrl
    }

    try {
        let appData = await post('./api/app-scrape', content);

        let text = "";
        if (appData.headsets.length > 0) {
            let platforms = getPlatformText(appData.headsets);
            text += `[${platforms}] `
        }
        text += `${appData.title} `
        let priceTag = appData.percentOff ? `(${appData.price} / ${appData.percentOff} off)` : `(${appData.price})`;
        text += `${priceTag}`

        let link = document.createElement('a');
        link.innerText = text;
        link.href = steamAppUrl;
        link.target = '_blank';
        link.style.display = 'inline';

        pageResultsDiv.innerHTML = "";
        pageResultsDiv.appendChild(link);
    } catch (error) {
        console.error(error);
        pageResultsDiv.innerHTML = "No results.";
    }

    retrievePageButton.disabled = false;
}

async function retrieveOculusExperienceTitle() {
    console.log("Retrieving...");
}

async function retrieveSteamSearchTable() {
    let searchResultsDiv = document.getElementById('search-results');
    let retrieveSearchButton = document.getElementById('retrieve-steam-search-table');

    retrieveSearchButton.disabled = true;

    let steamSearchUrlInput = document.getElementById('steam-search-url');
    let steamSearchUrl = steamSearchUrlInput.value.trim();
    if (!steamSearchUrl || !STEAM_SEARCH_URL_REGEX.test(steamSearchUrl)) {
        retrieveSearchButton.disabled = false;
        searchResultsDiv.innerHTML = "No results. Please input a valid Steam Search URL.";
        return;
    }

    let searchAllPagesInput = document.getElementById('search-all-pages');
    let searchAllPages = searchAllPagesInput.checked;

    try {
        let searchData = [];
        if (searchAllPages) {
            for (let i = 1; i <= MAX_PAGES; i++) {
                searchResultsDiv.innerHTML = `Retrieving page ${i}...`;
                let searchPageData = await retrieveSearchPageData(steamSearchUrl, i);
                if (searchPageData.length < 1) {
                    break;
                }
                searchData.push(...searchPageData);
            }
        } else {
            searchResultsDiv.innerHTML = "Retrieving page...";
            let searchPageData = await retrieveSearchPageData(steamSearchUrl);
            searchData.push(...searchPageData);
        }

        if (!searchData || searchData.length < 1) {
            retrieveSearchButton.disabled = false;
            searchResultsDiv.innerHTML = "No results.";
            return;
        }

        for (let [index, app] of searchData.entries()) {
            let itemNumber = index + 1;
            searchResultsDiv.innerHTML = `Retrieving result ${itemNumber} of ${searchData.length}...`;
            if (app.type == "APP") {
                let content = {
                    url: app.link
                };

                let appData = await post('./api/search-app-scrape', content);
                app.headsets = appData.headsets || [];
                app.countdown = appData.countdown || { text: "", time: 0 };
            } else {
                app.headsets = [];
                app.countdown = {
                    text: "",
                    time: 0
                }
            }
        }

        let text = createMarkdownTable(searchData);

        let textArea = document.createElement('textarea');
        textArea.classList.add('form-control', 'search-result');
        textArea.wrap = "off";
        textArea.readOnly = true;
        textArea.innerHTML = text;

        let csvString = "\ufeff" + json2csv.parse(cache.searchData);
        let csvData = new Blob([csvString], { encoding: 'UTF-8', type: 'text/csv;charset=UTF-8' });
        let csvUrl = URL.createObjectURL(csvData);

        let downloadLink = document.createElement('a');
        downloadLink.href = csvUrl;
        downloadLink.target = '_blank';
        downloadLink.innerHTML = 'Download Raw Data as CSV';
        downloadLink.download = `steam-data-${getFormattedTime()}.csv`;

        searchResultsDiv.innerHTML = "";
        searchResultsDiv.appendChild(textArea);
        searchResultsDiv.appendChild(downloadLink);
    } catch (error) {
        console.error(error);
        searchResultsDiv.innerHTML = "No results.";
    }

    retrieveSearchButton.disabled = false;
}

function getFormattedTime() {
    let today = new Date();
    let y = today.getFullYear();
    // JavaScript months are 0-based.
    let m = today.getMonth() + 1;
    let d = today.getDate();
    let h = today.getHours();
    let mi = today.getMinutes();
    let s = today.getSeconds();
    return y + "-" + m + "-" + d + "-" + h + "-" + mi + "-" + s;
}

function formatAppData(app) {
    let formattedData = {
        type: "",
        platform: "",
        platformAbbreviated: "",
        title: "",
        titleLink: "",
        link: "",
        price: "",
        originalPrice: "",
        percentOff: "",
        countdownText: "",
        countdownTime: 0,
        reviews: "",
        reviewsCount: ""
    }

    formattedData.type = app.type;
    formattedData.platform = app.headsets.join(', ');
    formattedData.platformAbbreviated = app.headsets.map(platform => getHeadsetAbbreviation(platform)).join('/');
    formattedData.title = app.title;

    let titlePrefix = app.type == "BUNDLE" ? BUNDLE_PREFIX : "";
    formattedData.titleLink = `${titlePrefix}[${escapePipes(app.title)}](${app.link})`;

    formattedData.link = app.link;
    formattedData.price = extractNumberFromPrice(app.price) || app.price;
    formattedData.originalPrice = extractNumberFromPrice(app.originalPrice) || app.price;
    formattedData.percentOff = extractNumberFromPercent(app.percentOff) || app.percentOff;
    formattedData.countdownText = app.countdown.text;
    formattedData.countdownTime = app.countdown.time;
    formattedData.reviews = extractNumberFromPercent(app.reviewsPercent) || app.reviewsPercent;
    formattedData.reviewsCount = app.reviewsCount;

    return formattedData;
}

async function retrieveSearchPageData(steamSearchUrl, pageNumber) {
    let content = {
        url: `${steamSearchUrl}`
    };
    if (pageNumber) {
        content.url += `&page=${pageNumber}`
    };
    return await post('./api/search-scrape', content);
}

function createMarkdownTable(searchData) {
    let header = '| Platform | Title | Price (USD) | Discount (%) | Rating (%) | Review Count |';
    let divider = '| :- | :- | -: | -: | -: | -: |';
    let result = header + NEW_LINE + divider + NEW_LINE;

    let formattedData = [];

    for (let app of searchData) {
        let formatted = formatAppData(app);
        result += `| ${formatted.platformAbbreviated} | ${formatted.titleLink} | ${formatted.price} | ${formatted.percentOff} | ${formatted.reviews} | ${formatted.reviewsCount} |` + NEW_LINE;
        formattedData.push(formatted);
    }

    cache.searchData = formattedData;

    return result;
}

async function post(url, content) {
    let response;
    for (i = 0; i < MAX_RETRIES; i++) {
        response = await fetch(
            url,
            {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(content)
            });
        if (!shouldRetry(response.status)) {
            break;
        }
    }

    return await response.json();
}

function shouldRetry(statusCode) {
    return !((statusCode >= 200 && statusCode <= 299) || (statusCode >= 400 && statusCode <= 499));
}

function escapePipes(input) {
    return input.replace(/\|/g, '‖');
}

function extractNumberFromPrice(input) {
    let match = PRICE_NUMBER_REGEX.exec(input);
    if (match) {
        return match[1];
    }
}

function extractNumberFromPercent(input) {
    let match = PERCENT_NUMBER_REGEX.exec(input);
    if (match) {
        return match[1];
    }
}

function getPlatformText(platforms) {
    if (platforms.length == 1) {
        return getHeadsetshortName(platforms[0]);
    }
    return platforms.map(platform => getHeadsetAbbreviation(platform)).join('/');
}

function getHeadsetshortName(headsetName) {
    let headsetAlias = HEADSET_ALIASES[headsetName];
    if (headsetAlias) {
        return headsetAlias.shortName;
    } else {
        return headsetName;
    }
}

function getHeadsetAbbreviation(headsetName) {
    let headsetAlias = HEADSET_ALIASES[headsetName];
    if (headsetAlias) {
        return headsetAlias.abbreviation;
    } else {
        return headsetName;
    }
}