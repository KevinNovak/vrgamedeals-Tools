const _cheerio = require("cheerio");
const _regexUtils = require("../utils/regex-utils");
const _stringUtils = require("../utils/string-utils");
const { CustomException } = require("../models/exceptions");

const TITLE_REMOVE = ["Buy", "Play", "Download", "Install", "Pre-Purchase"];

function getAppPageData(appPageHtml) {
    let firstGame = getMainGameElement(appPageHtml);
    if (!firstGame) {
        throw new CustomException(
            "NO_GAME_ELEMENTS",
            "Could not find any game elements."
        );
    }

    let gameData = getGameDataFromGameElement(firstGame);
    let countdown = getCountdownFromGameElement(firstGame);
    let headsets = getHeadsets(appPageHtml);
    let reviews = getReviews(appPageHtml);

    return {
        ...gameData,
        ...reviews,
        countdown,
        headsets
    };
}

function getSearchPageData(searchPageHtml) {
    let $ = _cheerio.load(searchPageHtml);

    let searchResults = Array.from(
        $("#search_resultsRows > a.search_result_row")
    );

    let searchPageData = [];

    for (let searchResult of searchResults) {
        let gameData = getGameDataFromSearchResult(searchResult);
        searchPageData.push(gameData);
    }

    return searchPageData;
}

function getSearchAppPageData(appPageHtml) {
    let firstGame = getMainGameElement(appPageHtml);
    if (!firstGame) {
        throw new CustomException(
            "NO_GAME_ELEMENTS",
            "Could not find any game elements."
        );
    }

    let countdown = getCountdownFromGameElement(firstGame);
    let headsets = getHeadsets(appPageHtml);

    return {
        countdown,
        headsets
    };
}

function getMainGameElement(appPageHtml) {
    let $ = _cheerio.load(appPageHtml);

    let gameElements = Array.from(
        $(
            "#game_area_purchase .game_area_purchase_game:not(.demo_above_purchase)"
        )
    );
    if (gameElements.length < 1) {
        return;
    }

    return gameElements[0];
}

function getHeadsets(appPageHtml) {
    let $ = _cheerio.load(appPageHtml);

    let headsetTitleElement = $(
        '.details_block.vrsupport > div:contains("Headsets")'
    ).parent();
    let headsetElements = Array.from(
        headsetTitleElement.nextUntil(".details_block")
    );

    let headsets = [];

    for (let headsetElement of headsetElements) {
        let headsetName = $(".name", headsetElement)
            .text()
            .trim();
        if (headsetName) {
            headsets.push(headsetName);
        }
    }

    return headsets;
}

function getReviews(appPageHtml) {
    let $ = _cheerio.load(appPageHtml);

    let reviews = {
        reviewsPercent: "",
        reviewsCount: ""
    };

    let reviewsTooltip = $(
        "div.user_reviews_summary_bar span.game_review_summary"
    )
        .first()
        .data("tooltip-html");

    if (reviewsTooltip) {
        reviewsTooltip = reviewsTooltip.trim();
        let reviewsPercent = _regexUtils.extractPercent(reviewsTooltip);
        if (reviewsPercent) {
            reviews.reviewsPercent = reviewsPercent;
        }

        let reviewsCount = _regexUtils.extractReviewsCount(reviewsTooltip);
        if (reviewsCount) {
            reviews.reviewsCount = reviewsCount;
        }
    }

    return reviews;
}

function getGameDataFromSearchResult(searchResult) {
    let $ = _cheerio.load(searchResult);

    let gameData = {
        link: "",
        title: "",
        type: "UNKNOWN",
        price: "",
        originalPrice: "",
        percentOff: "",
        reviewsPercent: "",
        reviewsCount: ""
    };

    let title = $("div.search_name > span.title")
        .text()
        .trim();
    if (title) {
        gameData.title = title;
    }

    let link = _stringUtils.stripQueryString(searchResult.attribs.href);
    if (link) {
        gameData.link = link;
    }

    if (gameData.link.includes("/app/")) {
        gameData.type = "APP";
    } else if (gameData.link.includes("/bundle/")) {
        gameData.type = "BUNDLE";
    }

    let price = $("div.search_price")
        .clone()
        .children()
        .remove()
        .end()
        .text()
        .trim();
    if (price) {
        gameData.price = price;
    }

    let originalPrice = $("div.search_price > span > strike")
        .text()
        .trim();
    if (originalPrice) {
        gameData.originalPrice = originalPrice;
    }

    let percentOff = _regexUtils.extractPercent(
        $("div.search_discount > span")
            .text()
            .trim()
    );
    if (percentOff) {
        gameData.percentOff = percentOff;
    }

    if (gameData.type == "APP") {
        let reviewsTooltip = $(
            "div.search_reviewscore > span.search_review_summary"
        ).data("tooltip-html");

        if (reviewsTooltip) {
            reviewsTooltip = reviewsTooltip.trim();
            let reviewsPercent = _regexUtils.extractPercent(reviewsTooltip);
            if (reviewsPercent) {
                gameData.reviewsPercent = reviewsPercent;
            }

            let reviewsCount = _regexUtils.extractReviewsCount(reviewsTooltip);
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
        price: "",
        originalPrice: "",
        percentOff: ""
    };

    let title = $(".game_area_purchase_game > h1")
        .children()
        .remove()
        .end()
        .text()
        .trim();
    for (let removeKeyword of TITLE_REMOVE) {
        if (title.startsWith(removeKeyword)) {
            title = title.substr(removeKeyword.length).trim();
        }
    }

    if (title) {
        gameData.title = title;
    }

    let originalPrice = $(".discount_original_price")
        .text()
        .trim();
    if (originalPrice) {
        gameData.originalPrice = originalPrice;
    }

    let percentOff = _regexUtils.extractPercent(
        $(".discount_pct")
            .text()
            .trim()
    );
    if (percentOff) {
        gameData.percentOff = percentOff;
    }

    let price = gameData.originalPrice
        ? $(".discount_final_price")
              .text()
              .trim()
        : $(".game_purchase_price")
              .text()
              .trim();
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
    };

    try {
        let text = $(".game_purchase_discount_countdown")
            .text()
            .trim();
        if (text) {
            countdownData.text = text;
        }
    } catch {}

    try {
        let countdownScript = $(".game_area_purchase_game > script")[0]
            .children[0].data;
        let countdownTimeText = _regexUtils.extractDiscountCountdown(
            countdownScript
        );
        let time = parseInt(countdownTimeText);
        if (time) {
            countdownData.time = time;
        }
    } catch {}

    return countdownData;
}

module.exports = {
    getAppPageData,
    getSearchAppPageData,
    getSearchPageData
};
