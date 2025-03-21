export declare class StudioUrlBuilder {
    private debug;
    constructor(debug?: boolean);
    private logDebug;
    buildImpressionsByContentUrl(options: {
        channelId: string;
        timePeriod?: string;
        granularity?: string;
        orderByColumn?: string;
        orderDirection?: string;
    }): string;
}
