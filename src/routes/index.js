const { Router } = require('express');
const router = Router();
const puppeteer = require('puppeteer');

router.get('/', (req, res) => {
    res.json({message: 'Hello World!!'})
});

const options = { 
    executablePath: '/usr/bin/google-chrome',
    headless: true, // true
    args: [
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--disable-setuid-sandbox",
        "--no-sandbox",
    ] 
};

const urlToParse = "https://my.gethatch.com";

router.get('/all', (req, res) => {
    puppeteer.launch(options).then((browser) => {
        browser.newPage().then((page) => {
            page.goto(urlToParse, {
                waitUntil: 'networkidle2',
                // Remove the timeout
                timeout: 0
            }).then(() => {
                page.screenshot({path:'image.png'});
                console.log('Se tomó la captura');
            })
        })
    }).catch((e) => {
        console.log('Falló: ', e);
    });

    res.json({message: 'Hello All!!'})
});

module.exports = router;