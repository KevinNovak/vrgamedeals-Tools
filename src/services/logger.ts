import { Response } from 'node-fetch';

export class Logger {
    public static info(message: string): void {
        let log = `[Info] ${message}`;
        console.log(log);
    }

    public static warn(message: string): void {
        let log = `[Warn] ${message}`;
        console.warn(log);
    }

    public static async error(message: string, error?: any): Promise<void> {
        // Log custom error message
        let log = `[Error] ${message}`;
        console.error(log);

        // Log error object if exists
        if (!error) {
            return;
        }

        switch (error.constructor) {
            case Response: {
                let res = error as Response;
                let resText: string;
                try {
                    resText = await res.text();
                } catch {
                    // Ignore
                }
                console.error({
                    path: res.url,
                    statusCode: res.status,
                    statusName: res.statusText,
                    headers: res.headers.raw(),
                    body: resText,
                });
                break;
            }
            default: {
                console.error(error);
                break;
            }
        }
    }
}
