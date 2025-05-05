import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import { YoutubeStudio } from './YoutubeStudio.js';

export class YoutubeStudioService {
    private app = express();
    private port: number;
    private studio: YoutubeStudio;

    constructor(port: number = 3000) {
        this.port = port;
        this.studio = new YoutubeStudio(true);
        this.configureMiddleware();
        this.configureRoutes();
    }

    private configureMiddleware(): void {
        this.app.use(bodyParser.json());
        this.app.use(async (_req, res, next) => {
            if (!this.studio.getChannelId()) {
                try {
                    await this.studio.start();
                } catch (err) {
                    console.error('Initialization error:', err);
                    res.status(500).send('Failed to initialize YoutubeStudio');
                    return;
                }
            }
            next();
        });
    }

    private configureRoutes(): void {
        this.app.post('/fetch/impressions', this.handleFetchImpressions.bind(this));
        this.app.post('/fetch/watchtime', this.handleFetchWatchTime.bind(this));
        this.app.post('/fetch/subscribers', this.handleFetchSubscribers.bind(this));
    }

    private async handleFetchImpressions(req: Request, res: Response): Promise<void> {
        try {
            const { options, filePath } = req.body;
            const result = await this.studio.fetchAndSaveImpressionsByContentPage(options, filePath);
            res.json(result);
        } catch (err) {
            console.error(err);
            res.status(500).send('Error fetching Impressions by Content');
        }
    }

    private async handleFetchWatchTime(req: Request, res: Response): Promise<void> {
        try {
            const { options, filePath } = req.body;
            const result = await this.studio.fetchAndSaveWatchTimeByContentPage(options, filePath);
            res.json(result);
        } catch (err) {
            console.error(err);
            res.status(500).send('Error fetching Watch Time by Content');
        }
    }

    private async handleFetchSubscribers(req: Request, res: Response): Promise<void> {
        try {
            const { options, filePath } = req.body;
            const result = await this.studio.fetchAndSaveSubscribersByContentPage(options, filePath);
            res.json(result);
        } catch (err) {
            console.error(err);
            res.status(500).send('Error fetching Subscribers by Content');
        }
    }

    public start(): void {
        this.app.listen(this.port, () => {
            console.log(`YoutubeStudioService is running on http://localhost:${this.port}`);
        });
    }
}
