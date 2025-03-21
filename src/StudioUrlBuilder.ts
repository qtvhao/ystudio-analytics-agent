export class StudioUrlBuilder {
    private debug: boolean;

    constructor(debug: boolean = false) {
        this.debug = debug;
    }

    private logDebug(message: string): void {
        if (this.debug) {
            console.debug(`[StudioUrlBuilder DEBUG] ${message}`);
        }
    }

    public buildImpressionsByContentUrl(options: {
        channelId: string;
        timePeriod?: string;
        granularity?: string;
        orderByColumn?: string;
        orderDirection?: string;
    }): string {
        const { channelId, timePeriod = 'week', granularity = 'DAY', orderByColumn = 'VIDEO_THUMBNAIL_IMPRESSIONS', orderDirection = 'ANALYTICS_ORDER_DIRECTION_DESC' } = options;

        if (!channelId) {
            throw new Error('Channel ID is required to build the impressions URL.');
        }

        this.logDebug(`Building impressions URL for channelId: ${channelId}`);

        const baseUrl = `https://studio.youtube.com/channel/${channelId}/analytics/tab-overview/period-default/explore`;

        const params = new URLSearchParams({
            entity_type: 'CHANNEL',
            entity_id: channelId,
            time_period: timePeriod,
            explore_type: 'TABLE_AND_CHART',
            metric: 'VIDEO_THUMBNAIL_IMPRESSIONS',
            granularity: granularity,
            dimension: 'VIDEO',
            o_column: orderByColumn,
            o_direction: orderDirection,
        });

        const metrics = [
            'VIEWS',
            'WATCH_TIME',
            'SUBSCRIBERS_NET_CHANGE',
            'TOTAL_ESTIMATED_EARNINGS',
            'VIDEO_THUMBNAIL_IMPRESSIONS',
            'VIDEO_THUMBNAIL_IMPRESSIONS_VTR'
        ];

        const metricsParams = metrics.map(t => `t_metrics=${t}`).join('&');

        const finalUrl = `${baseUrl}?${params.toString()}&${metricsParams}`;

        this.logDebug(`Built URL: ${finalUrl}`);

        return finalUrl;
    }
}
