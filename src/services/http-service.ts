import fetch from 'node-fetch';
import { URL } from 'node:url';

export class HttpService {
    public async get(url: string | URL): Promise<string> {
        let res = await fetch(url.toString(), {
            method: 'get',
            headers: {
                Accept: 'application/json',
            },
        });

        if (!res.ok) {
            throw res;
        }

        return res.text();
    }

    public async post(url: string | URL, body?: object): Promise<string> {
        let res = await fetch(url.toString(), {
            method: 'post',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!res.ok) {
            throw res;
        }

        return res.text();
    }

    public async put(url: string | URL, body?: object): Promise<string> {
        let res = await fetch(url.toString(), {
            method: 'put',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!res.ok) {
            throw res;
        }

        return res.text();
    }

    public async delete(url: string | URL, body?: object): Promise<string> {
        let res = await fetch(url.toString(), {
            method: 'delete',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!res.ok) {
            throw res;
        }

        return res.text();
    }
}
