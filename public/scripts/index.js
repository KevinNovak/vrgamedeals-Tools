const NEW_LINE = '&#10';

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
                link.innerText = `[${platforms}] ${body.title} (${body.discountPrice} / ${body.percentOff} off)`;
            } else {
                link.innerText = `[${platforms}] ${body.title} (${body.originalPrice})`;
            }
        } else {
            if (discounted) {
                link.innerText = `${body.title} (${body.discountPrice} / ${body.percentOff} off)`;
            } else {
                link.innerText = `${body.title} (${body.originalPrice})`;
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
    let steamQueryInputString = steamQueryInput.value;
    if (!steamQueryInputString) {
        retrieveSearchButton.disabled = false;
        searchResultsDiv.innerHTML = "No results.";
        return;
    }

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
    let header = '| Platform | Title | Price | Percent Off |';
    let divider = '| - | - | - | - |';
    let result = header + NEW_LINE + divider + NEW_LINE;
    for (game of gamesData) {
        let platform = game.headsets.map(platform => getHeadsetAbbreviation(platform)).join('/');
        result += `| ${platform} | [${game.title}](${game.url}) | ${game.discountPrice} | ${game.percentOff} |` + NEW_LINE;
    }
    return result;
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