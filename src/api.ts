import express, { ErrorRequestHandler, Express } from 'express';
import { createRequire } from 'node:module';

import { Controller } from './controllers/index.js';
import { Logger } from './services/index.js';

const require = createRequire(import.meta.url);
let Config = require('../config/config.json');
let Logs = require('../lang/logs.json');

export class Api {
    private app: Express;

    constructor(public controllers: Controller[]) {
        this.app = express();
        this.app.use(express.json());
        this.app.use(express.static('public'));
        this.setupControllers();
    }

    public async start(): Promise<void> {
        this.app.listen(process.env.PORT || Config.port, () => this.ready());
    }

    private async ready(): Promise<void> {
        Logger.info(Logs.info.started.replace('{PORT}', process.env.PORT || Config.port));
    }

    private setupControllers(): void {
        for (let controller of this.controllers) {
            controller.router.use(this.handleError);
            this.app.use('/', controller.router);
        }
    }

    private handleError: ErrorRequestHandler = (error, req, res, _next) => {
        Logger.error(
            Logs.error.processRequest
                .replace('{HTTP_METHOD}', req.method)
                .replace('{URL}', req.url),
            error
        );
        res.status(500).json({ error: true, message: error.message });
    };
}
