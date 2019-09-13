const STEAM_APP_URL_REGEX = /https:\/\/store.steampowered.com\/app\/\d+/;
const STEAM_SEARCH_URL_REGEX = /https:\/\/store.steampowered.com\/search\/\S*/;
const PRICE_NUMBER_REGEX = /\$(\d+\.\d{2})/;
const PERCENT_NUMBER_REGEX = /(\d+)%/;

const NEW_LINE = '&#10';

const headsetAliases = {
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

async function retrieveGameData() {
    let retrievePageButton = document.getElementById('retrieve-page-button');
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
        let body = await post('./api/app-scrape', content);

        let discounted = body.discounted;
        let isVr = body.headsets.length > 0;

        let link = document.createElement('a');
        if (isVr) {
            let platforms = getPlatformText(body.headsets);
            if (discounted) {
                link.innerText = `[${platforms}] ${body.title} (${body.price} / ${body.percentOff} off)`;
            } else {
                link.innerText = `[${platforms}] ${body.title} (${body.price})`;
            }
        } else {
            if (discounted) {
                link.innerText = `${body.title} (${body.price} / ${body.percentOff} off)`;
            } else {
                link.innerText = `${body.title} (${body.price})`;
            }
        }
        link.href = body.link;
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

async function retrieveSearchData() {
    let searchResultsDiv = document.getElementById('search-results');
    let retrieveSearchButton = document.getElementById('retrieve-search-button');

    retrieveSearchButton.disabled = true;
    searchResultsDiv.innerHTML = "Retrieving...";

    let steamSearchUrlInput = document.getElementById('steam-search-url');
    let steamSearchUrl = steamSearchUrlInput.value.trim();
    if (!steamSearchUrl || !STEAM_SEARCH_URL_REGEX.test(steamSearchUrl)) {
        retrieveSearchButton.disabled = false;
        searchResultsDiv.innerHTML = "No results. Please input a valid Steam Search URL.";
        return;
    }

    let content = {
        url: steamSearchUrl
    };

    try {
        let body = await post('./api/search-scrape', content);

        if (!body || body.length < 1) {
            retrieveSearchButton.disabled = false;
            searchResultsDiv.innerHTML = "No results.";
            return;
        }

        let text = createMarkdownTable(body);

        let textArea = document.createElement('textarea');
        textArea.classList.add('form-control', 'search-result');
        textArea.readOnly = true;
        textArea.innerHTML = text;

        searchResultsDiv.innerHTML = "";
        searchResultsDiv.appendChild(textArea);
    } catch (error) {
        console.error(error);
        searchResultsDiv.innerHTML = "No results.";
    }

    retrieveSearchButton.disabled = false;
}

function createMarkdownTable(gamesData) {
    let header = '| Platform | Title | Price (USD) | Percent Off | Reviews | # Reviews |';
    let divider = '| - | - | - | - | - | - |';
    let result = header + NEW_LINE + divider + NEW_LINE;

    for (game of gamesData) {
        let platform = game.headsets.map(platform => getHeadsetAbbreviation(platform)).join('/');
        let title = escapePipes(game.title);
        let link = game.link;
        let price = extractNumberFromPrice(game.price) || game.price || "";
        let percentOff = extractNumberFromPercent(game.percentOff) || game.percentOff || "";
        let reviews = extractNumberFromPercent(game.reviewsPercent) || game.reviewsPercent || "";
        let reviewsCount = game.reviewsCount || "";

        result += `| ${platform} | [${title}](${link}) | ${price} | ${percentOff} | ${reviews} | ${reviewsCount} |` + NEW_LINE;
    }

    return result;
}

async function post(url, content) {
    let response = await fetch(
        url,
        {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(content)
        });
    return await response.json();
}

function escapePipes(input) {
    return input.replace('|', '‖');
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
    let headsetAlias = headsetAliases[headsetName];
    if (headsetAlias) {
        return headsetAlias.shortName;
    } else {
        return headsetName;
    }
}

function getHeadsetAbbreviation(headsetName) {
    let headsetAlias = headsetAliases[headsetName];
    if (headsetAlias) {
        return headsetAlias.abbreviation;
    } else {
        return headsetName;
    }
}