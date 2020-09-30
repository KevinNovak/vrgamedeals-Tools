import fetch from 'node-fetch';

export class HttpService {
    public async get(url: string): Promise<string> {
        let res = await fetch(url, {
            method: 'get',
            headers: {
                Accept: 'application/json',
            },
        });

        if (!res.ok) {
            throw res;
        }

        return await res.text();
    }
}
