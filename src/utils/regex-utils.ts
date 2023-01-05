const TITLE_REGEX = /<b>Title:<\/b>(.*)<br>/;
const RELEASE_DATE_REGEX = /<b>Release Date:<\/b>(.*)<br>/;
const PERCENT_REGEX = /(\d+%)/;
const REVIEWS_COUNT_REGEX = /([\d,]+) user review/;
const DISCOUNT_COUNTDOWN_REGEX = /DiscountCountdown,[ ]*([\d]{7,})/;

export abstract class RegexUtils {
    public static extractTitle(input: string): string {
        let match = TITLE_REGEX.exec(input);
        if (match) {
            return match[1].trim();
        }
    }

    public static extractReleaseDate(input: string): string {
        let match = RELEASE_DATE_REGEX.exec(input);
        if (match) {
            return match[1].trim();
        }
    }

    public static extractPercent(input: string): string {
        let match = PERCENT_REGEX.exec(input);
        if (match) {
            return match[1];
        }
    }

    public static extractReviewsCount(input: string): string {
        let match = REVIEWS_COUNT_REGEX.exec(input);
        if (match) {
            return match[1].replace(/,/g, '');
        }
    }

    public static extractDiscountCountdown(input: string): string {
        let match = DISCOUNT_COUNTDOWN_REGEX.exec(input);
        if (match) {
            return match[1];
        }
    }
}
