export abstract class StringUtils {
    public static stripQueryString(url: string): string {
        return url.split(/[?#]/)[0];
    }
}
