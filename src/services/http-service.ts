import rp from 'request-promise';

export class HttpService {
    public async get(url: string) {
        return await rp({ url });
    }
}
