import { BrowserConnector } from './BrowserConnector.js';
import { StudioUrlBuilder } from './StudioUrlBuilder.js';
import { Page } from 'puppeteer';

type NavigationOptions = {
    timePeriod?: string;
    granularity?: string;
    orderByColumn?: string;
    orderDirection?: string;
};

export class StudioNavigator {
    private connector: BrowserConnector;
    private page: Page | null = null;
    private debug: boolean;
    private urlBuilder: StudioUrlBuilder;
    private channelId: string | null = null;

    constructor(debug: boolean = false) {
        this.debug = debug;
        this.connector = new BrowserConnector(debug);
        this.urlBuilder = new StudioUrlBuilder(debug);
    }

    private logDebug(message: string): void {
        if (this.debug) {
            console.debug(`[StudioNavigator DEBUG] ${message}`);
        }
    }

    public getPage(): Page | null {
        return this.page;
    }

    public async initialize(): Promise<void> {
        this.page = await this.connector.connect();
        this.logDebug('Browser connection initialized.');
    }

    public async setupUserAgent(): Promise<void> {
        if (!this.page) {
            throw new Error('Page is not initialized.');
        }

        const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36';
        await this.page.setUserAgent(userAgent);

        this.logDebug(`User agent set: ${userAgent}`);
    }

    public async navigateToStudio(): Promise<void> {
        const studioUrl = 'https://studio.youtube.com/';
        await this.connector.navigate(studioUrl);
        while(true) {
            await new Promise(r => setTimeout(r, 1000))
            const currentUrl = this.page?.url() || '';
            if ('studio.youtube.com' === (new URL(currentUrl)).hostname) {
                this.logDebug(`Confirmed domain: ${currentUrl}`);
                break;
            } else {
                this.logDebug(`Still on incorrect domain: ${currentUrl}`);
            }
        }

        this.logDebug(`Navigated to ${studioUrl}`);
    }

    private async navigateToContentPage(
        channelId: string,
        options: NavigationOptions | undefined,
        builderFunction: (params: {
            channelId: string;
            timePeriod?: string;
            granularity?: string;
            orderByColumn?: string;
            orderDirection?: string;
        }) => string
    ): Promise<void> {
        if (!this.page) {
            throw new Error('Page is not initialized.');
        }

        this.logDebug(`Navigating for channelId: ${channelId}`);

        const targetUrl = builderFunction({
            channelId,
            timePeriod: options?.timePeriod,
            granularity: options?.granularity,
            orderByColumn: options?.orderByColumn,
            orderDirection: options?.orderDirection
        });

        this.logDebug(`Navigating to URL: ${targetUrl}`);

        await this.connector.navigate(targetUrl);

        this.logDebug('Successfully navigated to content page.');
    }

    public async navigateToImpressionsByContent(
        channelId: string,
        options?: NavigationOptions
    ): Promise<void> {
        await this.navigateToContentPage(channelId, options, this.urlBuilder.buildImpressionsByContentUrl.bind(this.urlBuilder));
    }

    public async navigateToWatchTimeByContent(
        channelId: string,
        options?: NavigationOptions
    ): Promise<void> {
        await this.navigateToContentPage(channelId, options, this.urlBuilder.buildWatchTimeByContentUrl.bind(this.urlBuilder));
    }

    public async navigateToSubscribersByContent(
        channelId: string,
        options?: NavigationOptions
    ): Promise<void> {
        await this.navigateToContentPage(channelId, options, this.urlBuilder.buildSubscribersByContentUrl.bind(this.urlBuilder));
    }

    /**
     * Extracts and stores the channel ID from the current page URL.
     */
    public async fetchAndStoreChannelId(): Promise<string | null> {
        if (!this.page) {
            throw new Error('Page is not initialized.');
        }

        await new Promise(r => setTimeout(r, 10_000))
        const currentUrl = this.page.url();
        this.logDebug(`Current page URL for channelId extraction: ${currentUrl}`);

        const extractedId = this.getChannelIdFromUrl(currentUrl);

        if (extractedId) {
            this.channelId = extractedId;
            this.logDebug(`Extracted and stored channelId: ${this.channelId}`);
            return this.channelId;
        } else {
            this.logDebug('No channelId found in URL.');
            return null;
        }
    }

    /**
     * Returns the stored channel ID if available.
     */
    public getChannelId(): string | null {
        return this.channelId;
    }

    /**
     * Attempts to extract a channel ID from a given URL.
     */
    private getChannelIdFromUrl(url: string): string | null {
        this.logDebug(`Extracting channelId from URL: ${url}`);

        const regex = /channel\/([a-zA-Z0-9_-]+)/;
        const match = url.match(regex);

        if (match && match[1]) {
            this.logDebug(`Extracted channelId: ${match[1]}`);
            return match[1];
        }

        this.logDebug('No channelId found in URL.');
        return null;
    }

    public async close(): Promise<void> {
        await this.connector.close();
        this.logDebug('Browser connection closed.');
    }
}
