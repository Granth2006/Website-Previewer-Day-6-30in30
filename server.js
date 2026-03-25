const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/captures', express.static(path.join(__dirname, 'captures')));

// Ensure captures directory exists
if (!fs.existsSync(path.join(__dirname, 'captures'))) {
    fs.mkdirSync(path.join(__dirname, 'captures'));
}

const viewportSizes = {
    desktop: { width: 1920, height: 1080 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 812 },
};

app.post('/api/screenshot', async (req, res) => {
    let { url, device = 'desktop', fullPage = true } = req.body;
    
    if (!url.startsWith('http')) {
        url = 'https://' + url;
    }

    const { width, height } = viewportSizes[device] || viewportSizes.desktop;

    try {
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        await page.setViewport({ width, height });
        
        // Wait until network is idle to handle complex pages better
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        
        const filename = `screenshot-${Date.now()}.png`;
        const filepath = path.join(__dirname, 'captures', filename);
        
        await page.screenshot({ path: filepath, fullPage });
        await browser.close();
        
        res.json({ success: true, url: `/captures/${filename}` });
    } catch (error) {
        console.error('Screenshot error:', error);
        res.status(500).json({ success: false, error: 'Failed to capture screenshot' });
    }
});

app.post('/api/pdf', async (req, res) => {
    let { url } = req.body;
    
    if (!url.startsWith('http')) {
        url = 'https://' + url;
    }

    try {
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        
        const filename = `document-${Date.now()}.pdf`;
        const filepath = path.join(__dirname, 'captures', filename);
        
        await page.pdf({ path: filepath, format: 'A4', printBackground: true });
        await browser.close();
        
        res.json({ success: true, url: `/captures/${filename}` });
    } catch (error) {
        console.error('PDF error:', error);
        res.status(500).json({ success: false, error: 'Failed to generate PDF' });
    }
});

app.listen(PORT, () => {
    console.log(`WebSnap server running on http://localhost:${PORT}`);
});
