import { spawn, execSync } from 'child_process';
import path from 'path';
import os from 'os';
import fs from 'fs';
import puppeteer, { Browser, Page } from 'puppeteer-core';

export class BrowserConnector {
    private browser: Browser | null = null;
    private page: Page | null = null;
    private debug: boolean;
    private dataDir: string;
    private autoLaunch: boolean;

    constructor(debug: boolean = false, dataDir: string, autoLaunch: boolean = false) {
        this.debug = debug;
        this.dataDir = dataDir;
        this.autoLaunch = autoLaunch;
    }

    private logDebug(message: string): void {
        if (this.debug) {
            console.debug(`[BrowserConnector DEBUG] ${message}`);
        }
    }

    public async connect(browserURL: string = 'http://localhost:9222'): Promise<Page> {
        try {
            if (this.autoLaunch && !this.browser) {
                this.logDebug('Auto-launching browser...');
                await this.launch();
            }

            this.logDebug(`Connecting to browser at ${browserURL}...`);
            this.browser = await puppeteer.connect({
                browserURL,
                defaultViewport: null
            });

            const pages = await this.browser.pages();
            this.page = pages.length ? pages[0] : await this.browser.newPage();
            await this.page.setViewport({ width: 1450, height: 4000 });

            console.log('[BrowserConnector] Connected to browser.');
            this.logDebug(`Total open pages: ${pages.length}`);

            return this.page;
        } catch (error) {
            console.error('[BrowserConnector] Failed to connect:', error);
            throw error;
        }
    }

    public async navigate(url: string, waitUntil: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2' = 'networkidle2', attempts: number = 3): Promise<void> {
        if (!this.page) {
            throw new Error('[BrowserConnector] Page is not initialized. Call connect() first.');
        }

        for (let attempt = 1; attempt <= attempts; attempt++) {
            try {
                this.logDebug(`Attempt ${attempt} to navigate to: ${url}`);
                await this.page.goto(url, { waitUntil });
                console.log(`[BrowserConnector] Navigated to ${url}`);
                return;
            } catch (error) {
                this.logDebug(`[BrowserConnector] Attempt ${attempt} failed to navigate to ${url}: ${error}`);
                if (attempt === attempts) {
                    console.error(`[BrowserConnector] Failed to navigate to ${url} after ${attempts} attempts:`, error);
                    throw error;
                }
                await new Promise(resolve => setTimeout(resolve, 15000));
            }
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

                if (this.autoLaunch) {
                    this.logDebug('Auto-launched browser: killing associated process...');
                    const platform = os.platform();
                    let cmd: string;

                    if (platform === 'darwin') {
                        cmd = "pkill -f 'Google Chrome.*--remote-debugging-port=9222'";
                    } else if (platform === 'linux') {
                        cmd = "pkill -f 'google-chrome.*--remote-debugging-port=9222'";
                    } else {
                        console.warn('[BrowserConnector] Unsupported platform for killing process.');
                        return;
                    }

                    try {
                        execSync(cmd);
                        console.log('[BrowserConnector] Chrome process killed.');
                    } catch (err) {
                        console.error('[BrowserConnector] Failed to kill Chrome process:', err);
                    }
                }

                console.log('[BrowserConnector] Disconnected from browser.');
            } catch (error) {
                console.error('[BrowserConnector] Error while disconnecting:', error);
            }
        }
    }

    public async launch(): Promise<void> {
        const dataDir = this.dataDir;

        let chromePath: string;
        const platform = os.platform();
        if (platform === 'darwin') {
            chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
        } else if (platform === 'linux') {
            chromePath = '/usr/bin/google-chrome';
        } else {
            throw new Error(`[BrowserConnector] Unsupported platform: ${platform}`);
        }

        const args = [
            '--remote-debugging-port=9222',
            `--user-data-dir=${dataDir}`,
            '--disable-dev-shm-usage',
            '--disable-software-rasterizer',
            '--disable-proxy-certificate-handler',
            '--no-sandbox',
            '--no-first-run',
            '--disable-features=PrivacySandboxSettings4',
            '--no-zygote',
            '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Safari/605.1.15',
            '--window-size=4000,4000'
        ];

        this.logDebug(`Launching Chrome at ${chromePath} with args: ${args.join(' ')}`);
        spawn(chromePath, args, {
            detached: true,
            stdio: 'ignore'
        }).unref();

        for (let i = 0; i < 150; i++) {
            try {
                const response = await fetch('http://localhost:9222/json/version');
                if (response.ok) {
                    this.logDebug('Chrome remote debugging endpoint is responsive.');
                    return;
                }
            } catch (error) {
                this.logDebug(`Waiting for Chrome to respond... (${i + 1}/5)`);
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        throw new Error('[BrowserConnector] Failed to connect to Chrome remote debugging endpoint after 5 attempts.');
    }
}
