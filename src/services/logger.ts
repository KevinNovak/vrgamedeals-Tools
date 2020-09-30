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
            default:
                console.error(error);
                break;
        }
    }
}
