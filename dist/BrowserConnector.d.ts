import { Page } from 'puppeteer';
export declare class BrowserConnector {
    private browser;
    private page;
    private debug;
    constructor(debug?: boolean);
    private logDebug;
    connect(browserURL?: string): Promise<Page>;
    navigate(url: string, waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2'): Promise<void>;
    setUserAgent(userAgent: string): Promise<void>;
    getPage(): Page | null;
    close(): Promise<void>;
}
