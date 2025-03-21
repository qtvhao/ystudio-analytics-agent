import puppeteer, { Browser, Page } from 'puppeteer';

export class BrowserConnector {
    private browser: Browser | null = null;
    private page: Page | null = null;
    private debug: boolean;

    constructor(debug: boolean = false) {
        this.debug = debug;
    }

    private logDebug(message: string): void {
        if (this.debug) {
            console.debug(`[BrowserConnector DEBUG] ${message}`);
        }
    }

    public async connect(browserURL: string = 'http://localhost:9222'): Promise<Page> {
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
        } catch (error) {
            console.error('[BrowserConnector] Failed to connect:', error);
            throw error;
        }
    }

    public async navigate(url: string, waitUntil: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2' = 'networkidle2'): Promise<void> {
        if (!this.page) {
            throw new Error('[BrowserConnector] Page is not initialized. Call connect() first.');
        }

        try {
            this.logDebug(`Navigating to: ${url}`);
            await this.page.goto(url, { waitUntil });
            console.log(`[BrowserConnector] Navigated to ${url}`);
        } catch (error) {
            console.error(`[BrowserConnector] Failed to navigate to ${url}:`, error);
            throw error;
        }
    }

    public async setUserAgent(userAgent: string): Promise<void> {
        if (!this.page) {
            throw new Error('[BrowserConnector] Page is not initialized.');
        }

        try {
            this.logDebug(`Setting User-Agent: ${userAgent}`);
            await this.page.setUserAgent(userAgent);
        } catch (error) {
            console.error('[BrowserConnector] Failed to set User-Agent:', error);
            throw error;
        }
    }

    public getPage(): Page | null {
        return this.page;
    }

    public async close(): Promise<void> {
        if (this.browser) {
            try {
                this.logDebug('Disconnecting from browser...');
                await this.browser.disconnect();
                console.log('[BrowserConnector] Disconnected from browser.');
            } catch (error) {
                console.error('[BrowserConnector] Error while disconnecting:', error);
            }
        }
    }
}
