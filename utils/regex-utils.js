const PERCENT_REGEX = /(\d+%)/;
const REVIEWS_COUNT_REGEX = /([\d,]+) user review/;
const DISCOUNT_COUNTDOWN_REGEX = /DiscountCountdown,[ ]*([\d]{7,})/;

function extractPercent(input) {
    let match = PERCENT_REGEX.exec(input);
    if (match) {
        return match[1];
    }
}

function extractReviewsCount(input) {
    let match = REVIEWS_COUNT_REGEX.exec(input);
    if (match) {
        return match[1].replace(/,/g, "");
    }
}

function extractDiscountCountdown(input) {
    let match = DISCOUNT_COUNTDOWN_REGEX.exec(input);
    if (match) {
        return match[1];
    }
}

module.exports = {
    extractPercent,
    extractReviewsCount,
    extractDiscountCountdown
};
