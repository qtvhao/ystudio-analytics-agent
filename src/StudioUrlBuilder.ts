interface AnalyticsUrlOptionsBase {
    channelId: string;
    timePeriod?: string;
    granularity?: string;
    orderByColumn?: string;
    orderDirection?: string;
}

interface AnalyticsUrlBuildOptions extends AnalyticsUrlOptionsBase {
    orderByColumn: string;
    metric: string;
    metricsList: string[];
}

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
    
    private buildAnalyticsUrl(options: AnalyticsUrlBuildOptions): string {
        const {
            channelId,
            timePeriod = '4_weeks',
            granularity = 'DAY',
            orderByColumn,
            orderDirection = 'ANALYTICS_ORDER_DIRECTION_DESC',
            metric,
            metricsList
        } = options;

        if (!channelId) {
            throw new Error('Channel ID is required to build the analytics URL.');
        }

        this.logDebug(`Building analytics URL for channelId: ${channelId}`);

        const baseUrl = `https://studio.youtube.com/channel/${channelId}/analytics/tab-overview/period-default/explore`;

        const params = new URLSearchParams({
            entity_type: 'CHANNEL',
            entity_id: channelId,
            time_period: timePeriod,
            explore_type: 'TABLE_AND_CHART',
            metric: metric,
            granularity: granularity,
            dimension: 'VIDEO',
            o_column: orderByColumn,
            o_direction: orderDirection,
        });

        const metricsParams = metricsList.map(t => `t_metrics=${t}`).join('&');
        const finalUrl = `${baseUrl}?${params.toString()}&${metricsParams}`;

        this.logDebug(`Built URL: ${finalUrl}`);

        return finalUrl;
    }
    public buildSubscribersByContentUrl(options: AnalyticsUrlOptionsBase): string {
        return this.buildAnalyticsUrl({
            ...options,
            orderByColumn: options.orderByColumn || 'SUBSCRIBERS_NET_CHANGE',
            metric: 'SUBSCRIBERS_NET_CHANGE',
            metricsList: [
                'EXTERNAL_VIEWS',
                'EXTERNAL_WATCH_TIME',
                'SUBSCRIBERS_NET_CHANGE',
                'TOTAL_ESTIMATED_EARNINGS',
                'VIDEO_THUMBNAIL_IMPRESSIONS',
                'VIDEO_THUMBNAIL_IMPRESSIONS_VTR'
            ]
        });
    }

    public buildWatchTimeByContentUrl(options: AnalyticsUrlOptionsBase): string {
        return this.buildAnalyticsUrl({
            ...options,
            orderByColumn: options.orderByColumn || 'EXTERNAL_WATCH_TIME',
            metric: 'EXTERNAL_WATCH_TIME',
            metricsList: [
                'EXTERNAL_VIEWS',
                'EXTERNAL_WATCH_TIME',
                'SUBSCRIBERS_NET_CHANGE',
                'TOTAL_ESTIMATED_EARNINGS',
                'VIDEO_THUMBNAIL_IMPRESSIONS',
                'VIDEO_THUMBNAIL_IMPRESSIONS_VTR'
            ]
        });
    }

    public buildImpressionsByContentUrl(options: AnalyticsUrlOptionsBase): string {
        return this.buildAnalyticsUrl({
            ...options,
            orderByColumn: options.orderByColumn || 'VIDEO_THUMBNAIL_IMPRESSIONS',
            metric: 'VIDEO_THUMBNAIL_IMPRESSIONS',
            metricsList: [
                'VIEWS',
                'WATCH_TIME',
                'SUBSCRIBERS_NET_CHANGE',
                'TOTAL_ESTIMATED_EARNINGS',
                'VIDEO_THUMBNAIL_IMPRESSIONS',
                'VIDEO_THUMBNAIL_IMPRESSIONS_VTR'
            ]
        });
    }
}
