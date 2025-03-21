import { Page } from 'puppeteer';
export declare class StudioNavigator {
    private connector;
    private page;
    private debug;
    private urlBuilder;
    private channelId;
    constructor(debug?: boolean);
    private logDebug;
    getPage(): Page | null;
    initialize(): Promise<void>;
    setupUserAgent(): Promise<void>;
    navigateToStudio(): Promise<void>;
    navigateToImpressionsByContent(channelId: string, options?: {
        timePeriod?: string;
        granularity?: string;
        orderByColumn?: string;
        orderDirection?: string;
    }): Promise<void>;
    /**
     * Extracts and stores the channel ID from the current page URL.
     */
    fetchAndStoreChannelId(): Promise<string | null>;
    /**
     * Returns the stored channel ID if available.
     */
    getChannelId(): string | null;
    /**
     * Attempts to extract a channel ID from a given URL.
     */
    private getChannelIdFromUrl;
    close(): Promise<void>;
}
