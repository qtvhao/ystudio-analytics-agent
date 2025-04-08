import { Page } from 'puppeteer';
import { promises as fs } from 'fs';
import { StudioNavigator } from './StudioNavigator.js';

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

    constructor(debug: boolean = false) {
        this.debug = debug;
        this.navigator = new StudioNavigator(debug);
    }

    private logDebug(message: string): void {
        if (this.debug) {
            console.debug(`[YoutubeStudio DEBUG] ${message}`);
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

            const channelId = await this.navigator.fetchAndStoreChannelId();

            if (channelId) {
                console.log(`Extracted and stored channelId: ${channelId}`);
            } else {
                console.warn('channelId not found in the URL.');
            }
        } catch (error) {
            console.error('Error during YoutubeStudio automation:', error);
        } finally {
            this.logDebug('Finished YoutubeStudio automation.');
        }
    }

    /**
     * Navigates to the Impressions by Content page for the current channel.
     */
    public async navigateToImpressionsByContentPage(options?: ImpressionPageOptions): Promise<void> {
        let channelId = this.navigator.getChannelId();
        const startTime = Date.now();

        while (!channelId && Date.now() - startTime < 30000) {
            this.logDebug('Channel ID not available yet. Retrying...');
            await new Promise((res) => setTimeout(res, 1000));
            channelId = this.navigator.getChannelId();
        }

        if (!channelId) {
            throw new Error('Channel ID is required to navigate to Impressions by Content page. Make sure to call start() first.');
        }

        this.logDebug(`Navigating to Impressions by Content page with channelId: ${channelId}`);

        await this.navigator.navigateToImpressionsByContent(channelId, options);
    }

    /**
     * Retrieves the <img> tags' alt and src attributes from the Impressions by Content page.
     * Filters for <img> tags whose alt attribute starts with "Video thumbnail:".
     */
    public async fetchImpressionContentImageTags(): Promise<ImageTag[]> {
        const page: Page | null = this.navigator.getPage();

        if (!page) {
            throw new Error('Page instance is null. Cannot fetch Impressions by Content page image tags.');
        }

        this.logDebug('Fetching <img> tags with alt attribute starting with "Video thumbnail:" from the Impressions by Content page...');

        const imgTags: ImageTag[] = await page.$$eval('img', (imgs) =>
            imgs
                .filter((img) => img.hasAttribute('alt') && img.getAttribute('alt')?.startsWith('Video thumbnail:'))
                .map((img) => ({
                    alt: img.getAttribute('alt')?.replace('Video thumbnail: ', '') || '',
                    src: img.getAttribute('src') || ''
                }))
        );

        return imgTags;
    }

    /**
     * Saves the given data to a file.
     */
    public async saveHTMLToFile(content: string, filePath: string): Promise<void> {
        await fs.writeFile(filePath, content);
        console.log(`Content saved to ${filePath}`);
    }

    /**
     * Combines navigation, fetching image tags with alt and src, and saving to a file.
     */
    public async fetchAndSaveImpressionsByContentPage(
        options?: ImpressionPageOptions,
        filePath: string = 'impressions_by_content_imgs.json'
    ): Promise<ImageTag[]> {
        await this.navigateToImpressionsByContentPage(options);

        const imgTags: ImageTag[] = await this.fetchImpressionContentImageTags();

        await this.saveHTMLToFile(JSON.stringify(imgTags, null, 2), filePath);

        console.log('Fetched and saved <img> tags from Impressions by Content page.');

        return imgTags;
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
}
