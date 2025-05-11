import { Page } from 'puppeteer-core';
import { promises as fs } from 'fs';
import { StudioNavigator } from './StudioNavigator.js';
import { VideoMetricsExtractor } from './VideoMetricsExtractor.js';

interface ImageTag {
    alt: string;
    src: string;
}

interface ImpressionPageOptions {
    timePeriod?: string;
    granularity?: string;
    orderByColumn?: string;
    orderDirection?: string;
}

export class YoutubeStudio {
    private navigator: StudioNavigator;
    private debug: boolean;
    private screenshotsFolder: string;

    constructor(accountId: string, debug: boolean = false) {
        this.debug = debug;
        this.navigator = new StudioNavigator(accountId, debug);
        this.screenshotsFolder = 'screenshots';
        fs.mkdir(this.screenshotsFolder, { recursive: true }).catch(console.error);
    }

    private logDebug(message: string): void {
        if (this.debug) {
            console.debug(`[YoutubeStudio DEBUG] ${message}`);
        }
    }

    private async navigateToContentPage(
        pageType: 'impressions' | 'watchTime' | 'subscribers',
        options?: ImpressionPageOptions
    ): Promise<void> {
        let channelId = this.navigator.getChannelId();
        const startTime = Date.now();

        while (!channelId && Date.now() - startTime < 30000) {
            this.logDebug('Channel ID not available yet. Retrying...');
            await new Promise((res) => setTimeout(res, 1000));
            channelId = this.navigator.getChannelId();
        }

        if (!channelId) {
            throw new Error(`Channel ID is required to navigate to ${pageType} page. Make sure to call start() first.`);
        }

        this.logDebug(`Navigating to ${pageType} page with channelId: ${channelId}`);

        if (pageType === 'impressions') {
            await this.navigator.navigateToImpressionsByContent(channelId, options);
        } else if (pageType === 'watchTime') {
            await this.navigator.navigateToWatchTimeByContent(channelId, options);
        } else if (pageType === 'subscribers') {
            await this.navigator.navigateToSubscribersByContent(channelId, options);
        }
    }

    /**
     * Initializes the navigator and retrieves the channelId.
     */
    public async start(): Promise<void> {
        try {
            this.logDebug('Starting YoutubeStudio automation...');

            await this.navigator.initialize();
            await this.navigator.setupUserAgent();
            await this.navigator.navigateToStudio();


            if (this.getChannelId() === null) {
                const channelId = await this.navigator.fetchAndStoreChannelId();
                console.log(`Extracted and stored channelId: ${channelId}`);
            } else {
                console.warn('channelId not found in the URL.');
            }
        } catch (error) {
            console.error('Error during YoutubeStudio automation:', error);
            throw error;
        } finally {
            this.logDebug('Finished YoutubeStudio automation.');
        }
    }

    /**
     * Navigates to the Impressions by Content page for the current channel.
     */
    public async navigateToImpressionsByContentPage(options?: ImpressionPageOptions): Promise<void> {
        return this.navigateToContentPage('impressions', options);
    }

    /**
     * Navigates to the Watch Time by Content page for the current channel.
     */
    public async navigateToWatchTimeByContentPage(options?: ImpressionPageOptions): Promise<void> {
        return this.navigateToContentPage('watchTime', options);
    }

    /**
     * Navigates to the Subscribers by Content page for the current channel.
     */
    public async navigateToSubscribersByContentPage(options?: ImpressionPageOptions): Promise<void> {
        return this.navigateToContentPage('subscribers', options);
    }

    /**
     * Fetches image tags and checks if their parent element contains a percentage string.
     */
    private async fetchVideoDetailsWithMetrics(): Promise<any[]> {
        const page: Page | null = this.navigator.getPage();
        if (!page) {
            throw new Error('Page instance is null. Cannot fetch video details.');
        }

        this.logDebug('Fetching video details with metrics...');
        const extractor = new VideoMetricsExtractor(page);
        return await extractor.extract();
    }

    /**
     * Saves the given data to a file.
     */
    public async saveHTMLToFile(content: string, filePath: string): Promise<void> {
        await fs.writeFile(filePath, content);
        console.log(`Content saved to ${filePath}`);
    }

    private async fetchAndSaveContentPage(
        pageType: 'impressions' | 'watchTime' | 'subscribers',
        options: ImpressionPageOptions | undefined,
        filePath: string
    ): Promise<ImageTag[]> {
        await this.start();
        if (pageType === 'impressions') {
            await this.navigateToImpressionsByContentPage(options);
        } else if (pageType === 'watchTime') {
            await this.navigateToWatchTimeByContentPage(options);
        } else if (pageType === 'subscribers') {
            await this.navigateToSubscribersByContentPage(options);
        }

        const videoDetailsWithMetrics: ImageTag[] = await this.fetchVideoDetailsWithMetrics();
        await this.close();

        console.log(`Fetched and saved <img> tags from ${pageType.charAt(0).toUpperCase() + pageType.slice(1)} by Content page.`);
        return videoDetailsWithMetrics;
    }

    /**
     * Combines navigation, fetching image tags with alt and src, and saving to a file.
     */
    public async fetchAndSaveImpressionsByContentPage(
        options?: ImpressionPageOptions,
        filePath: string = 'impressions_by_content_imgs.json'
    ): Promise<ImageTag[]> {
        return this.fetchAndSaveContentPage('impressions', options, filePath);
    }

    /**
     * Combines navigation to the Watch Time by Content page, fetching image tags with alt and src, and saving to a file.
     */
    public async fetchAndSaveWatchTimeByContentPage(
        options?: ImpressionPageOptions,
        filePath: string = 'watch_time_by_content_imgs.json'
    ): Promise<ImageTag[]> {
        return this.fetchAndSaveContentPage('watchTime', options, filePath);
    }

    /**
     * Combines navigation to the Subscribers by Content page, fetching image tags with alt and src, and saving to a file.
     */
    public async fetchAndSaveSubscribersByContentPage(
        options?: ImpressionPageOptions,
        filePath: string = 'subscribers_by_content_imgs.json'
    ): Promise<ImageTag[]> {
        return this.fetchAndSaveContentPage('subscribers', options, filePath);
    }

    /**
     * Closes the browser connection.
     */
    public async close(): Promise<void> {
        await this.navigator.close();
    }

    /**
     * Returns the channelId from the navigator.
     */
    public getChannelId(): string | null {
        return this.navigator.getChannelId();
    }

    /**
     * Sets the channelId directly on the navigator.
     */
    public setChannelId(channelId: string): void {
        this.navigator.setChannelId(channelId);
    }
}
