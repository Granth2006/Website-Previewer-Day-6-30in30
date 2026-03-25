const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

const viewportSizes = {
    desktop: { width: 1920, height: 1080 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 812 },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    let { url, device = 'desktop', fullPage = true } = req.body;
    
    if (!url.startsWith('http')) {
        url = 'https://' + url;
    }

    const { width, height } = viewportSizes[device] || viewportSizes.desktop;

    try {
        const browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: { width, height },
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        });

        const page = await browser.newPage();
        
        // Use a 20 second timeout for serverless environments
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
        
        // Return screenshot as a Buffer
        const buffer = await page.screenshot({ fullPage: fullPage });
        await browser.close();

        // Convert Buffer to Base64 String URL
        const base64Str = buffer.toString('base64');
        const dataUrl = `data:image/png;base64,${base64Str}`;
        
        res.json({ success: true, url: dataUrl });
    } catch (error) {
        console.error('Screenshot error:', error);
        res.status(500).json({ success: false, error: 'Failed to capture screenshot' });
    }
}
