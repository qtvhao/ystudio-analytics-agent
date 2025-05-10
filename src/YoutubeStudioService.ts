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
        this.app.get('/health', (_req, res) => {res.status(200).send('OK')});
        this.app.post('/fetch/impressions', this.handleFetchImpressions.bind(this));
        this.app.post('/fetch/watchtime', this.handleFetchWatchTime.bind(this));
        this.app.post('/fetch/subscribers', this.handleFetchSubscribers.bind(this));
    }

    private resolveChannelId(req: Request, res: Response): boolean {
        const { channel_id } = req.body;
        if (!channel_id) {
            res.status(400).json({error: 'channel_id is required'});
            return false;
        }
        this.studio.setChannelId(channel_id);
        return true;
    }

    private async handleFetchImpressions(req: Request, res: Response): Promise<void> {
        try {
            if (!this.resolveChannelId(req, res)) return;
            const { options, filePath } = req.body;
            const result = await this.studio.fetchAndSaveImpressionsByContentPage(options, filePath);
            res.json(result);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error fetching Impressions by Content', details: err instanceof Error ? err.message : String(err) });
        }
    }

    private async handleFetchWatchTime(req: Request, res: Response): Promise<void> {
        try {
            if (!this.resolveChannelId(req, res)) return;
            const { options, filePath } = req.body;
            const result = await this.studio.fetchAndSaveWatchTimeByContentPage(options, filePath);
            res.json(result);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error fetching Watch Time by Content', details: err instanceof Error ? err.message : String(err) });
        }
    }

    private async handleFetchSubscribers(req: Request, res: Response): Promise<void> {
        try {
            if (!this.resolveChannelId(req, res)) return;
            const { options, filePath } = req.body;
            const result = await this.studio.fetchAndSaveSubscribersByContentPage(options, filePath);
            res.json(result);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error fetching Subscribers by Content', details: err instanceof Error ? err.message : String(err) });
        }
    }

    public start(): void {
        this.app.listen(this.port, () => {
            console.log(`YoutubeStudioService is running on http://localhost:${this.port}`);
        });
    }
}
