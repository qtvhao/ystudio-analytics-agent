import { Page } from 'puppeteer-core';

export interface ImageTag {
    alt: string;
    src: string;
}

export class VideoMetricsExtractor {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    public async extract() {
        return this.page.evaluate(() => {
            return Array.from(document.getElementsByTagName('img'))
                .filter((img) => {
                    return img.hasAttribute('alt') &&
                        img.getAttribute('alt')?.startsWith('Video thumbnail:');
                })
                .map((img) => {
                    let current = img;
                    while (current && current !== document.body) {
                        if (current.textContent && current.textContent.includes('%')) {
                            return current;
                        }
                        // @ts-ignore
                        current = current.parentElement;
                    }
                    return null;
                })
                .filter((tag) => tag !== null)
                .map((htmlElement) => {
                    // Lấy tiêu đề video
                    const title = (htmlElement.querySelector('#entity-title-value')?.textContent || '').trim();

                    // Lấy URL thumbnail
                    // @ts-ignore
                    const thumbnailUrl = (htmlElement.querySelector('img#img-with-fallback')?.src || '');

                    // Lấy thời lượng video
                    const duration = (htmlElement.querySelector('.timestamp .label')?.textContent || '').trim();

                    // Lấy danh sách các giá trị metrics
                    // @ts-ignore
                    const metrics = [];
                    htmlElement.querySelectorAll('.value.debug-metric-value').forEach((el) => {
                        metrics.unshift((el.textContent || '').trim());
                    });
                    // 
                    const elements = document.querySelectorAll('div.debug-metric-title');
                    // @ts-ignore
                    const metricsHeading = [];

                    elements.forEach(el => {
                        const text = el.textContent?.trim();
                        if (text) {
                            metricsHeading.unshift(text);
                        }
                    });

                    const metricPairs: { [key: string]: string } = {};
                    for (let i = 0; i < Math.min(metrics.length, metricsHeading.length); i++) {
                        // @ts-ignore
                        metricPairs[metricsHeading[i]] = metrics[i];
                    }

                    return {
                        title,
                        thumbnailUrl,
                        duration,
                        metrics: metricPairs
                    };
                })
        });
    }
}
