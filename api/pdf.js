const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    let { url } = req.body;
    
    if (!url.startsWith('http')) {
        url = 'https://' + url;
    }

    try {
        const browser = await puppeteer.launch({
            args: chromium.args,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        });

        const page = await browser.newPage();
        
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
        
        // Return PDF as a Buffer
        const buffer = await page.pdf({ format: 'A4', printBackground: true });
        await browser.close();
        
        // Convert Buffer to Base64 String URL
        const base64Str = buffer.toString('base64');
        const dataUrl = `data:application/pdf;base64,${base64Str}`;
        
        res.json({ success: true, url: dataUrl });
    } catch (error) {
        console.error('PDF error:', error);
        res.status(500).json({ success: false, error: 'Failed to generate PDF' });
    }
}
