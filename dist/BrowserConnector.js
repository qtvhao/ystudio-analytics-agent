import puppeteer from 'puppeteer';
export class BrowserConnector {
    browser = null;
    page = null;
    debug;
    constructor(debug = false) {
        this.debug = debug;
    }
    logDebug(message) {
        if (this.debug) {
            console.debug(`[BrowserConnector DEBUG] ${message}`);
        }
    }
    async connect(browserURL = 'http://localhost:9222') {
        try {
            this.logDebug(`Connecting to browser at ${browserURL}...`);
            this.browser = await puppeteer.connect({
                browserURL,
                defaultViewport: null,
            });
            const pages = await this.browser.pages();
            this.page = pages.length ? pages[0] : await this.browser.newPage();
            console.log('[BrowserConnector] Connected to browser.');
            this.logDebug(`Total open pages: ${pages.length}`);
            return this.page;
        }
        catch (error) {
            console.error('[BrowserConnector] Failed to connect:', error);
            throw error;
        }
    }
    async navigate(url, waitUntil = 'networkidle2') {
        if (!this.page) {
            throw new Error('[BrowserConnector] Page is not initialized. Call connect() first.');
        }
        try {
            this.logDebug(`Navigating to: ${url}`);
            await this.page.goto(url, { waitUntil });
            console.log(`[BrowserConnector] Navigated to ${url}`);
        }
        catch (error) {
            console.error(`[BrowserConnector] Failed to navigate to ${url}:`, error);
            throw error;
        }
    }
    async setUserAgent(userAgent) {
        if (!this.page) {
            throw new Error('[BrowserConnector] Page is not initialized.');
        }
        try {
            this.logDebug(`Setting User-Agent: ${userAgent}`);
            await this.page.setUserAgent(userAgent);
        }
        catch (error) {
            console.error('[BrowserConnector] Failed to set User-Agent:', error);
            throw error;
        }
    }
    getPage() {
        return this.page;
    }
    async close() {
        if (this.browser) {
            try {
                this.logDebug('Disconnecting from browser...');
                await this.browser.disconnect();
                console.log('[BrowserConnector] Disconnected from browser.');
            }
            catch (error) {
                console.error('[BrowserConnector] Error while disconnecting:', error);
            }
        }
    }
}
