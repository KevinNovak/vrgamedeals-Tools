export interface AppPageData {
    title: string;
    price: string;
    originalPrice: string;
    percentOff: string;
    reviewsPercent: string;
    reviewsCount: string;
    countdown: CountdownData;
    vrSupport: string;
    link: string;
}

export interface SearchAppPageData {
    countdown: CountdownData;
    vrSupport: string;
}

export interface GameData {
    link: string;
    title: string;
    type: string;
    price: string;
    originalPrice: string;
    percentOff: string;
    reviewsPercent: string;
    reviewsCount: string;
}

export interface GameElementData {
    price: string;
    originalPrice: string;
    percentOff: string;
}

export interface CountdownData {
    text: string;
    time: number;
}

export interface ReviewData {
    reviewsPercent: string;
    reviewsCount: string;
}
