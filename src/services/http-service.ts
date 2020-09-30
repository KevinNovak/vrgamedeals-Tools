import fetch from 'node-fetch';

export class HttpService {
    public async get(url: string): Promise<string> {
        let res = await fetch(url, {
            method: 'get',
        });

        if (!res.ok) {
            throw res;
        }

        return await res.text();
    }
}
