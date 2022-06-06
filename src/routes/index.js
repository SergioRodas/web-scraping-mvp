require('dotenv').config();
const { Router } = require('express');
const router = Router();
const puppeteer = require('puppeteer');
const path = require('path');

router.get('/', (req, res) => {
    res.json({message: 'Hello World!!'})
});

// Configuración del navegador y opciones de Hatch
const urlToParse = "https://my.gethatch.com";
const hatchEmail = process.env.HATCH_EMAIL;
const hatchPassword = process.env.HATCH_PASSWORD;

const downloadPath = path.resolve(__dirname, '../../data');
const browserOptions = { 
    executablePath: '/usr/bin/google-chrome', // comentar esta línea en local
    headless: true, // true en docker / false en local
    defaultViewport: null,
    args: [
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--disable-setuid-sandbox",
        "--no-sandbox",
    ] 
};
const pageOptions = {
    waitUntil: 'networkidle2',
    // Remove the timeout
    timeout: 0
}

router.get('/all', (req, res) => {
    console.log("Comienza la búsqueda de la data");
    (async () => {
        const browser = await puppeteer.launch(browserOptions);
        const page = await browser.newPage();
        await page.goto(urlToParse, pageOptions);
        await page.waitForSelector(".MuiButton-root");
        await page.type("#mui-1", hatchEmail);
        await page.type("#mui-2", hatchPassword);
        await page.click(".MuiButton-root");
        // Finaliza logueo
        await page.waitForTimeout(10000);
        // Selecciona el retailer
        await page.waitForSelector("#mui-12");
        await page.click("#mui-12");
        await page.type("#mui-12", "currys");
        await page.focus("#mui-12");
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
        // Establezco la ubicación de la carpeta donde se va a descargar el archivo
        await page._client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: downloadPath 
        });
        // Click en el boton de descargar
        await page.evaluate(() => {
            let saveButton = document.querySelectorAll('.MuiIconButton-sizeLarge'); 
            saveButton[0].click();
        });
        await page.waitForTimeout(1000);
        // Selecciona la opción "Lead Data"
        await page.evaluate(() => {
            let saveButton = document.querySelectorAll('.MuiButton-outlinedInherit');
            saveButton[0].click();
        });
        await page.waitForTimeout(10000);
        // await browser.close();
        console.log('Se completó la descarga');
    })()
    .catch(err => console.error(err));

    res.json({message: 'Hello All!!'})
});


module.exports = router;