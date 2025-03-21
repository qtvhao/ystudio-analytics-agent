interface ImageTag {
    alt: string;
    src: string;
}
export declare class YoutubeStudio {
    private navigator;
    private debug;
    constructor(debug?: boolean);
    private logDebug;
    /**
     * Initializes the navigator and retrieves the channelId.
     */
    start(): Promise<void>;
    /**
     * Navigates to the Impressions by Content page for the current channel.
     */
    navigateToImpressionsByContentPage(options?: {
        timePeriod?: string;
        granularity?: string;
        orderByColumn?: string;
        orderDirection?: string;
    }): Promise<void>;
    /**
     * Retrieves the <img> tags' alt and src attributes from the Impressions by Content page.
     * Filters for <img> tags whose alt attribute starts with "Video thumbnail:".
     */
    fetchImpressionContentImageTags(): Promise<ImageTag[]>;
    /**
     * Saves the given data to a file.
     */
    saveHTMLToFile(content: string, filePath: string): Promise<void>;
    /**
     * Combines navigation, fetching image tags with alt and src, and saving to a file.
     */
    fetchAndSaveImpressionsByContentPage(options?: {
        timePeriod?: string;
        granularity?: string;
        orderByColumn?: string;
        orderDirection?: string;
    }, filePath?: string): Promise<ImageTag[]>;
    /**
     * Closes the browser connection.
     */
    close(): Promise<void>;
    /**
     * Returns the channelId from the navigator.
     */
    getChannelId(): string | null;
}
export {};
