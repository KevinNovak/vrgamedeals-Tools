const STEAM_APP_URL_REGEX = /^https:\/\/store.steampowered.com\/app\/\d+/;
const STEAM_SEARCH_URL_REGEX = /^https:\/\/store.steampowered.com\/search\/\S*/;
const OCULUS_EXPERIENCE_RIFT_URL_REGEX = /^https:\/\/www.oculus.com\/experiences\/rift\/\d+/;
const OCULUS_EXPERIENCE_QUEST_URL_REGEX = /^https:\/\/www.oculus.com\/experiences\/quest\/\d+/;

const PRICE_NUMBER_REGEX = /\$(\d+\.\d{2})/;
const PERCENT_NUMBER_REGEX = /(\d+)%/;

const NEW_LINE = '&#10';
const MAX_PAGES = 100;
const MAX_RETRIES = 10;

const BUNDLE_PREFIX = '**Bundle** - ';

const HEADSET_ALIASES = {
    'Valve Index': {
        shortName: 'Index',
        abbreviation: 'I',
    },
    'HTC Vive': {
        shortName: 'Vive',
        abbreviation: 'V',
    },
    'Oculus Rift': {
        shortName: 'Rift',
        abbreviation: 'R',
    },
    'Oculus Rift DK2': {
        shortName: 'Rift DK2',
        abbreviation: 'DK2',
    },
    'Windows Mixed Reality': {
        shortName: 'WMR',
        abbreviation: 'W',
    },
    RIFT: {
        shortName: 'Rift',
        abbreviation: 'R',
    },
    LAGUNA: {
        shortName: 'Rift',
        abbreviation: 'R',
    },
    MONTEREY: {
        shortName: 'Quest',
        abbreviation: 'Q',
    },
};

// Steam App Titler
let steamAppBtn = document.getElementById('steam-app-btn');
let steamAppUrlInput = document.getElementById('steam-app-url-input');
let steamAppInfoSpan = document.getElementById('steam-app-info-span');
let steamAppResultsDiv = document.getElementById('steam-app-results');
let steamAppResultLink = document.getElementById('steam-app-result-link');
let steamAppRowTextArea = document.getElementById('steam-app-row-textarea');

// Steam Search Tabler
let steamSearchBtn = document.getElementById('steam-search-btn');
let steamSearchUrlInput = document.getElementById('steam-search-url-input');
let steamSearchAllPagesInput = document.getElementById('steam-search-all-pages-input');
let steamSearchInfoSpan = document.getElementById('steam-search-info-span');
let steamSearchResultsDiv = document.getElementById('steam-search-results');
let steamSearchResultTextArea = document.getElementById('steam-search-result-textarea');
let steamSearchDownloadLink = document.getElementById('steam-search-download-link');

// Oculus Experience Titler
let oculusExperienceBtn = document.getElementById('oculus-experience-btn');
let oculusExperienceUrlInput = document.getElementById('oculus-experience-url-input');
let oculusExperienceInfoSpan = document.getElementById('oculus-experience-info-span');
let oculusExperienceResultsDiv = document.getElementById('oculus-experience-results');
let oculusExperienceResultLink = document.getElementById('oculus-experience-result-link');

// Register events
steamAppUrlInput.addEventListener('keyup', event => {
    if (event.keyCode === 13) {
        event.preventDefault();
        steamAppBtn.click();
    }
});

steamSearchUrlInput.addEventListener('keyup', event => {
    if (event.keyCode === 13) {
        event.preventDefault();
        steamSearchBtn.click();
    }
});

oculusExperienceUrlInput.addEventListener('keyup', event => {
    if (event.keyCode === 13) {
        event.preventDefault();
        oculusExperienceBtn.click();
    }
});

async function retrieveSteamAppTitle() {
    steamAppBtn.disabled = true;
    hideElement(steamAppResultsDiv);
    setUnhideElement(steamAppInfoSpan, 'Retrieving...');

    let steamAppUrl = steamAppUrlInput.value.trim();
    if (!steamAppUrl || !STEAM_APP_URL_REGEX.test(steamAppUrl)) {
        steamAppBtn.disabled = false;
        setUnhideElement(steamAppInfoSpan, 'No results. Please input a valid Steam App URL.');
        return;
    }

    let content = {
        url: steamAppUrl,
    };

    try {
        let appData = await post('./api/steam/app-scrape', content);

        let text = '';
        if (appData.headsets.length > 0) {
            let platforms = getPlatformText(appData.headsets);
            text += `[${platforms}] `;
        }
        text += `${appData.title} `;
        let priceTag = appData.percentOff
            ? `(${appData.price} / -${appData.percentOff})`
            : `(${appData.price})`;
        text += `${priceTag}`;

        hideElement(steamAppInfoSpan);

        steamAppResultLink.href = steamAppUrl;
        steamAppResultLink.innerHTML = text;

        let app = formatAppData(appData);
        let appRow = convertToRow(app);
        steamAppRowTextArea.innerHTML = appRow;
        unhideElement(steamAppResultsDiv);
    } catch (error) {
        console.error(error);
        hideElement(steamAppResultsDiv);
        setUnhideElement(steamAppInfoSpan, 'No results.');
    }

    steamAppBtn.disabled = false;
}

async function retrieveSteamSearchTable() {
    steamSearchBtn.disabled = true;
    hideElement(steamSearchResultsDiv);
    setUnhideElement(steamSearchInfoSpan, 'Retrieving...');

    let steamSearchUrl = steamSearchUrlInput.value.trim();
    if (!steamSearchUrl || !STEAM_SEARCH_URL_REGEX.test(steamSearchUrl)) {
        steamSearchBtn.disabled = false;
        setUnhideElement(steamSearchInfoSpan, 'No results. Please input a valid Steam Search URL.');
        return;
    }

    let searchAllPages = steamSearchAllPagesInput.checked;

    try {
        let searchData = [];
        if (searchAllPages) {
            for (let i = 1; i <= MAX_PAGES; i++) {
                setUnhideElement(steamSearchInfoSpan, `Retrieving page ${i}...`);
                let searchPageData = await retrieveSearchPageData(steamSearchUrl, i);
                if (searchPageData.length < 1) {
                    break;
                }
                searchData.push(...searchPageData);
            }
        } else {
            setUnhideElement(steamSearchInfoSpan, 'Retrieving page...');
            let searchPageData = await retrieveSearchPageData(steamSearchUrl);
            searchData.push(...searchPageData);
        }

        if (!searchData || searchData.length < 1) {
            steamSearchBtn.disabled = false;
            setUnhideElement(steamSearchInfoSpan, 'No results.');
            return;
        }

        for (let [index, app] of searchData.entries()) {
            let itemNumber = index + 1;
            setUnhideElement(
                steamSearchInfoSpan,
                `Retrieving result ${itemNumber} of ${searchData.length}...`
            );
            if (app.type == 'APP') {
                let content = {
                    url: app.link,
                };

                let appData = await post('./api/steam/search-app-scrape', content);
                app.headsets = appData.headsets || [];
                app.countdown = appData.countdown || { text: '', time: 0 };
                app.vrSupport = appData.vrSupport || '';
            } else {
                app.headsets = [];
                app.countdown = {
                    text: '',
                    time: 0,
                };
                app.vrSupport = '';
            }
        }

        hideElement(steamSearchInfoSpan);

        let formattedSearchData = searchData.map(formatAppData);

        let text = createMarkdownTable(formattedSearchData);
        steamSearchResultTextArea.innerHTML = text;

        let csvString = '\ufeff' + json2csv.parse(formattedSearchData);
        let csvData = new Blob([csvString], {
            encoding: 'UTF-8',
            type: 'text/csv;charset=UTF-8',
        });
        let csvUrl = URL.createObjectURL(csvData);

        steamSearchDownloadLink.href = csvUrl;
        steamSearchDownloadLink.download = `steam-data-${getFormattedTime()}.csv`;

        unhideElement(steamSearchResultsDiv);
    } catch (error) {
        console.error(error);
        hideElement(steamSearchResultsDiv);
        setUnhideElement(steamSearchInfoSpan, 'No results.');
    }

    steamSearchBtn.disabled = false;
}

async function retrieveOculusExperienceTitle() {
    oculusExperienceBtn.disabled = true;
    hideElement(oculusExperienceResultsDiv);
    setUnhideElement(oculusExperienceInfoSpan, 'Retrieving...');

    let oculusExperienceUrl = oculusExperienceUrlInput.value.trim();
    let isRift = OCULUS_EXPERIENCE_RIFT_URL_REGEX.test(oculusExperienceUrl);
    let isQuest = OCULUS_EXPERIENCE_QUEST_URL_REGEX.test(oculusExperienceUrl);

    if (!oculusExperienceUrl || !(isRift || isQuest)) {
        oculusExperienceBtn.disabled = false;
        setUnhideElement(
            oculusExperienceInfoSpan,
            'No results. Please input a valid Oculus Experience URL.'
        );
        return;
    }

    let content = {
        url: oculusExperienceUrl,
    };

    try {
        let appData = await post('./api/oculus/experience-scrape', content);

        let text = '';
        let supportedHeadsets = appData.supported_hmd_platforms;
        if (supportedHeadsets.includes('RIFT') && supportedHeadsets.includes('LAGUNA')) {
            supportedHeadsets = supportedHeadsets.filter(headset => headset != 'RIFT');
        }

        let platforms = getPlatformText(supportedHeadsets);
        text += `[${platforms}] `;
        text += `${appData.display_name} `;
        let priceTag = appData.current_offer.promo_benefit
            ? `(${appData.current_offer.price.formatted} / ${appData.current_offer.promo_benefit})`
            : `(${appData.current_offer.price.formatted})`;
        text += `${priceTag}`;

        hideElement(oculusExperienceInfoSpan);

        oculusExperienceResultLink.href = oculusExperienceUrl;
        oculusExperienceResultLink.innerHTML = text;
        unhideElement(oculusExperienceResultsDiv);
    } catch (error) {
        console.error(error);
        hideElement(oculusExperienceResultsDiv);
        setUnhideElement(oculusExperienceInfoSpan, 'No results.');
    }

    oculusExperienceBtn.disabled = false;
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
    return y + '-' + m + '-' + d + '-' + h + '-' + mi + '-' + s;
}

function formatAppData(app) {
    let formattedData = {
        type: '',
        vrSupport: '',
        platform: '',
        platformAbbreviated: '',
        title: '',
        titleLink: '',
        link: '',
        price: '',
        originalPrice: '',
        percentOff: '',
        countdownText: '',
        countdownTime: 0,
        reviews: '',
        reviewsCount: '',
    };

    formattedData.type = app.type;
    formattedData.vrSupport = app.vrSupport;
    formattedData.platform = app.headsets.join(', ');
    formattedData.platformAbbreviated = app.headsets
        .map(platform => getHeadsetAbbreviation(platform))
        .join('/');
    formattedData.title = app.title;

    let titlePrefix = app.type == 'BUNDLE' ? BUNDLE_PREFIX : '';
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
        url: `${steamSearchUrl}`,
    };
    if (pageNumber) {
        content.url += `&page=${pageNumber}`;
    }
    return await post('./api/steam/search-scrape', content);
}

function createMarkdownTable(formattedSearchData) {
    let header = '| Platform | Title | Price (USD) | Discount (%) | Rating (%) | Review Count |';
    let divider = '| :- | :- | -: | -: | -: | -: |';
    let result = header + NEW_LINE + divider + NEW_LINE;

    for (let app of formattedSearchData) {
        result += convertToRow(app) + NEW_LINE;
    }

    return result;
}

function convertToRow(app) {
    return `| ${app.platformAbbreviated} | ${app.titleLink} | ${app.price} | ${app.percentOff} | ${app.reviews} | ${app.reviewsCount} |`;
}

async function post(url, content) {
    let response;
    for (let i = 0; i < MAX_RETRIES; i++) {
        response = await fetch(url, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(content),
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
        return getHeadsetShortName(platforms[0]);
    }
    return platforms.map(platform => getHeadsetAbbreviation(platform)).join('/');
}

function getHeadsetShortName(headsetName) {
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

function hideElement(element) {
    element.classList.add('hidden');
}

function unhideElement(element) {
    element.classList.remove('hidden');
}

function setUnhideElement(element, innerHtml) {
    element.innerHTML = innerHtml;
    element.classList.remove('hidden');
}
