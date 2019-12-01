const STEAM_APP_URL_REGEX = /^https:\/\/store.steampowered.com\/app\/\d+/;
const STEAM_SEARCH_URL_REGEX = /^https:\/\/store.steampowered.com\/search\/\S*/;
const PRICE_NUMBER_REGEX = /\$(\d+\.\d{2})/;
const PERCENT_NUMBER_REGEX = /(\d+)%/;

const NEW_LINE = "&#10";
const MAX_PAGES = 100;
const MAX_RETRIES = 10;

const BUNDLE_PREFIX = "**Bundle** - ";

const HEADSET_ALIASES = {
    "Valve Index": {
        shortName: "Index",
        abbreviation: "I"
    },
    "HTC Vive": {
        shortName: "Vive",
        abbreviation: "V"
    },
    "Oculus Rift": {
        shortName: "Rift",
        abbreviation: "R"
    },
    "Oculus Rift DK2": {
        shortName: "Rift DK2",
        abbreviation: "DK2"
    },
    "Windows Mixed Reality": {
        shortName: "WMR",
        abbreviation: "W"
    }
};

let cache = {
    searchData: []
};

// Steam App Titler
let steamAppBtn = document.getElementById("steam-app-btn");
let steamAppUrlInput = document.getElementById("steam-app-url-input");
let steamAppInfoSpan = document.getElementById("steam-app-info-span");
let steamAppResultLink = document.getElementById("steam-app-result-link");

// Steam Search Tabler
let steamSearchBtn = document.getElementById("steam-search-btn");
let steamSearchUrlInput = document.getElementById("steam-search-url-input");
let steamSearchAllPagesInput = document.getElementById(
    "steam-search-all-pages-input"
);
let steamSearchInfoSpan = document.getElementById("steam-search-info-span");
let steamSearchResultTextArea = document.getElementById(
    "steam-search-result-textarea"
);
let steamSearchDownloadLink = document.getElementById(
    "steam-search-download-link"
);

async function retrieveSteamAppTitle() {
    steamAppBtn.disabled = true;

    steamAppInfoSpan.innerHTML = "Retrieving...";
    steamAppResultLink.classList.add("hidden");
    steamAppInfoSpan.classList.remove("hidden");

    let steamAppUrl = steamAppUrlInput.value.trim();
    if (!steamAppUrl || !STEAM_APP_URL_REGEX.test(steamAppUrl)) {
        steamAppBtn.disabled = false;
        steamAppInfoSpan.innerHTML =
            "No results. Please input a valid Steam App URL.";
        steamAppInfoSpan.classList.remove("hidden");
        return;
    }

    let content = {
        url: steamAppUrl
    };

    try {
        let appData = await post("./api/app-scrape", content);

        let text = "";
        if (appData.headsets.length > 0) {
            let platforms = getPlatformText(appData.headsets);
            text += `[${platforms}] `;
        }
        text += `${appData.title} `;
        let priceTag = appData.percentOff
            ? `(${appData.price} / ${appData.percentOff} off)`
            : `(${appData.price})`;
        text += `${priceTag}`;

        steamAppResultLink.href = steamAppUrl;
        steamAppResultLink.innerHTML = text;

        steamAppInfoSpan.classList.add("hidden");
        steamAppResultLink.classList.remove("hidden");
    } catch (error) {
        console.error(error);

        steamAppInfoSpan.innerHTML = "No results.";
        steamAppInfoSpan.classList.remove("hidden");
    }

    steamAppBtn.disabled = false;
}

async function retrieveSteamSearchTable() {
    steamSearchBtn.disabled = true;

    steamSearchInfoSpan.innerHTML = "Retrieving...";
    steamSearchResultTextArea.classList.add("hidden");
    steamSearchDownloadLink.classList.add("hidden");
    steamSearchInfoSpan.classList.remove("hidden");

    let steamSearchUrl = steamSearchUrlInput.value.trim();
    if (!steamSearchUrl || !STEAM_SEARCH_URL_REGEX.test(steamSearchUrl)) {
        steamSearchBtn.disabled = false;
        steamSearchInfoSpan.innerHTML =
            "No results. Please input a valid Steam Search URL.";
        steamSearchInfoSpan.classList.remove("hidden");
        return;
    }

    let searchAllPages = steamSearchAllPagesInput.checked;

    try {
        let searchData = [];
        if (searchAllPages) {
            for (let i = 1; i <= MAX_PAGES; i++) {
                steamSearchInfoSpan.innerHTML = `Retrieving page ${i}...`;
                steamSearchInfoSpan.classList.remove("hidden");
                let searchPageData = await retrieveSearchPageData(
                    steamSearchUrl,
                    i
                );
                if (searchPageData.length < 1) {
                    break;
                }
                searchData.push(...searchPageData);
            }
        } else {
            steamSearchInfoSpan.innerHTML = "Retrieving page...";
            steamSearchInfoSpan.classList.remove("hidden");
            let searchPageData = await retrieveSearchPageData(steamSearchUrl);
            searchData.push(...searchPageData);
        }

        if (!searchData || searchData.length < 1) {
            steamSearchBtn.disabled = false;
            steamSearchInfoSpan.innerHTML = "No results.";
            steamSearchInfoSpan.classList.remove("hidden");
            return;
        }

        for (let [index, app] of searchData.entries()) {
            let itemNumber = index + 1;
            steamSearchInfoSpan.innerHTML = `Retrieving result ${itemNumber} of ${searchData.length}...`;
            steamSearchInfoSpan.classList.remove("hidden");
            if (app.type == "APP") {
                let content = {
                    url: app.link
                };

                let appData = await post("./api/search-app-scrape", content);
                app.headsets = appData.headsets || [];
                app.countdown = appData.countdown || { text: "", time: 0 };
            } else {
                app.headsets = [];
                app.countdown = {
                    text: "",
                    time: 0
                };
            }
        }

        let text = createMarkdownTable(searchData);
        steamSearchResultTextArea.innerHTML = text;

        let csvString = "\ufeff" + json2csv.parse(cache.searchData);
        let csvData = new Blob([csvString], {
            encoding: "UTF-8",
            type: "text/csv;charset=UTF-8"
        });
        let csvUrl = URL.createObjectURL(csvData);

        steamSearchDownloadLink.href = csvUrl;
        steamSearchDownloadLink.download = `steam-data-${getFormattedTime()}.csv`;

        steamSearchInfoSpan.classList.add("hidden");
        steamSearchResultTextArea.classList.remove("hidden");
        steamSearchDownloadLink.classList.remove("hidden");
    } catch (error) {
        console.error(error);

        steamSearchInfoSpan.innerHTML = "No results.";
        steamSearchInfoSpan.classList.remove("hidden");
    }

    steamSearchBtn.disabled = false;
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
    };

    formattedData.type = app.type;
    formattedData.platform = app.headsets.join(", ");
    formattedData.platformAbbreviated = app.headsets
        .map(platform => getHeadsetAbbreviation(platform))
        .join("/");
    formattedData.title = app.title;

    let titlePrefix = app.type == "BUNDLE" ? BUNDLE_PREFIX : "";
    formattedData.titleLink = `${titlePrefix}[${escapePipes(app.title)}](${
        app.link
    })`;

    formattedData.link = app.link;
    formattedData.price = extractNumberFromPrice(app.price) || app.price;
    formattedData.originalPrice =
        extractNumberFromPrice(app.originalPrice) || app.price;
    formattedData.percentOff =
        extractNumberFromPercent(app.percentOff) || app.percentOff;
    formattedData.countdownText = app.countdown.text;
    formattedData.countdownTime = app.countdown.time;
    formattedData.reviews =
        extractNumberFromPercent(app.reviewsPercent) || app.reviewsPercent;
    formattedData.reviewsCount = app.reviewsCount;

    return formattedData;
}

async function retrieveSearchPageData(steamSearchUrl, pageNumber) {
    let content = {
        url: `${steamSearchUrl}`
    };
    if (pageNumber) {
        content.url += `&page=${pageNumber}`;
    }
    return await post("./api/search-scrape", content);
}

function createMarkdownTable(searchData) {
    let header =
        "| Platform | Title | Price (USD) | Discount (%) | Rating (%) | Review Count |";
    let divider = "| :- | :- | -: | -: | -: | -: |";
    let result = header + NEW_LINE + divider + NEW_LINE;

    let formattedData = [];

    for (let app of searchData) {
        let formatted = formatAppData(app);
        result +=
            `| ${formatted.platformAbbreviated} | ${formatted.titleLink} | ${formatted.price} | ${formatted.percentOff} | ${formatted.reviews} | ${formatted.reviewsCount} |` +
            NEW_LINE;
        formattedData.push(formatted);
    }

    cache.searchData = formattedData;

    return result;
}

async function post(url, content) {
    let response;
    for (let i = 0; i < MAX_RETRIES; i++) {
        response = await fetch(url, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
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
    return !(
        (statusCode >= 200 && statusCode <= 299) ||
        (statusCode >= 400 && statusCode <= 499)
    );
}

function escapePipes(input) {
    return input.replace(/\|/g, "‖");
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
    return platforms
        .map(platform => getHeadsetAbbreviation(platform))
        .join("/");
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
