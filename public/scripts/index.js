const NEW_LINE = '&#10';
const PRICE_NUMBER_REGEX = /\$(\d+\.\d{2})/;
const PERCENT_NUMBER_REGEX = /(\d+)%/;

async function retrieveGameData() {
    let retrievePageButton = document.getElementById('retrieve-page-button');
    let pageResultsDiv = document.getElementById('page-results');

    retrievePageButton.disabled = true;
    pageResultsDiv.innerHTML = "Retrieving...";

    let steamAppIdInput = document.getElementById('steam-app-id');
    let steamAppIdString = steamAppIdInput.value;
    if (!steamAppIdString) {
        retrievePageButton.disabled = false;
        pageResultsDiv.innerHTML = "No results.";
        return;
    }

    try {
        let response = await fetch(`./api/app/${steamAppIdString}`);
        let body = await response.json();

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
        link.href = body.url;
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

async function retrieveSearchData() {
    let searchResultsDiv = document.getElementById('search-results');
    let retrieveSearchButton = document.getElementById('retrieve-search-button');

    retrieveSearchButton.disabled = true;
    searchResultsDiv.innerHTML = "Retrieving...";

    let steamQueryInput = document.getElementById('steam-query');
    let steamQueryInputString = steamQueryInput.value.trim();

    let response = await fetch(`./api/search/${steamQueryInputString}`);
    let body = await response.json();

    let text = createMarkdownTable(body);

    let textArea = document.createElement('textarea');
    textArea.classList.add('form-control', 'search-result');
    textArea.innerHTML = text;

    searchResultsDiv.innerHTML = "";
    searchResultsDiv.appendChild(textArea);
    retrieveSearchButton.disabled = false;
}

function createMarkdownTable(gamesData) {
    let header = '| Platform | Title | Price (USD) | Percent Off |';
    let divider = '| - | - | - | - |';
    let result = header + NEW_LINE + divider + NEW_LINE;

    for (game of gamesData) {
        //let platform = game.headsets.map(platform => getHeadsetAbbreviation(platform)).join('/');
        let title = escapePipes(game.title);
        let link = game.link;
        let price = extractNumberFromPrice(game.price) || game.price || "";
        let percentOff = extractNumberFromPercent(game.percentOff) || game.percentOff || "";

        result += `| | [${title}](${link}) | ${price} | ${percentOff} |` + NEW_LINE;
    }

    return result;
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