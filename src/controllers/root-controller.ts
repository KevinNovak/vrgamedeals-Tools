import { Request, Response, Router } from 'express';
import router from 'express-promise-router';

import { Controller } from './controller.js';

export class RootController implements Controller {
    public path = '/';
    public router: Router = router();

    constructor() {
        this.router.get(this.path, (req, res) => this.get(req, res));
    }

    private async get(req: Request, res: Response): Promise<void> {
        res.status(200).json({ message: 'vrgamedeals Tools' });
    }
}
