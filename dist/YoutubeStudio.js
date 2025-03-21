import { promises as fs } from 'fs';
import { StudioNavigator } from './StudioNavigator.js';
export class YoutubeStudio {
    navigator;
    debug;
    constructor(debug = false) {
        this.debug = debug;
        this.navigator = new StudioNavigator(debug);
    }
    logDebug(message) {
        if (this.debug) {
            console.debug(`[YoutubeStudio DEBUG] ${message}`);
        }
    }
    /**
     * Initializes the navigator and retrieves the channelId.
     */
    async start() {
        try {
            this.logDebug('Starting YoutubeStudio automation...');
            await this.navigator.initialize();
            await this.navigator.setupUserAgent();
            await this.navigator.navigateToStudio();
            const channelId = await this.navigator.fetchAndStoreChannelId();
            if (channelId) {
                console.log(`Extracted and stored channelId: ${channelId}`);
            }
            else {
                console.warn('channelId not found in the URL.');
            }
        }
        catch (error) {
            console.error('Error during YoutubeStudio automation:', error);
        }
        finally {
            this.logDebug('Finished YoutubeStudio automation.');
        }
    }
    /**
     * Navigates to the Impressions by Content page for the current channel.
     */
    async navigateToImpressionsByContentPage(options) {
        const channelId = this.navigator.getChannelId();
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
    async fetchImpressionContentImageTags() {
        const page = this.navigator.getPage();
        if (!page) {
            throw new Error('Page instance is null. Cannot fetch Impressions by Content page image tags.');
        }
        this.logDebug('Fetching <img> tags with alt attribute starting with "Video thumbnail:" from the Impressions by Content page...');
        const imgTags = await page.$$eval('img', (imgs) => imgs
            .filter((img) => img.hasAttribute('alt') && img.getAttribute('alt')?.startsWith('Video thumbnail:'))
            .map((img) => ({
            alt: img.getAttribute('alt')?.replace('Video thumbnail: ', '') || '',
            src: img.getAttribute('src') || ''
        })));
        return imgTags;
    }
    /**
     * Saves the given data to a file.
     */
    async saveHTMLToFile(content, filePath) {
        await fs.writeFile(filePath, content);
        console.log(`Content saved to ${filePath}`);
    }
    /**
     * Combines navigation, fetching image tags with alt and src, and saving to a file.
     */
    async fetchAndSaveImpressionsByContentPage(options, filePath = 'impressions_by_content_imgs.json') {
        await this.navigateToImpressionsByContentPage(options);
        const imgTags = await this.fetchImpressionContentImageTags();
        await this.saveHTMLToFile(JSON.stringify(imgTags, null, 2), filePath);
        console.log('Fetched and saved <img> tags from Impressions by Content page.');
        return imgTags;
    }
    /**
     * Closes the browser connection.
     */
    async close() {
        await this.navigator.close();
    }
    /**
     * Returns the channelId from the navigator.
     */
    getChannelId() {
        return this.navigator.getChannelId();
    }
}
