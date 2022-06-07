require('dotenv').config();
const { Router } = require('express');
const router = Router();
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const csvToJson = require('csvtojson');

const retailerToParse = 'blibli';
const retailerDownloadFolder = path.resolve(__dirname, '../../data/' + retailerToParse);

// Configuración del navegador y opciones de Hatch
const urlToParse = "https://my.gethatch.com";
const hatchEmail = process.env.HATCH_EMAIL;
const hatchPassword = process.env.HATCH_PASSWORD;

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

router.get('/', (req, res) => {
    res.json({message: 'Hello World!!'})
});

router.get('/parseRetailer', (req, res) => {
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
        await page.type("#mui-12", retailerToParse);
        await page.focus("#mui-12");
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
        // Establezco la ubicación de la carpeta donde se va a descargar el archivo
        await page._client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: retailerDownloadFolder 
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

    res.json({message: 'The information is being analyzed!'})
});

router.get('/getPriority', (req, res) => {

    let responseMessage = 'The priority was reported on the server!';
    
    if (!fs.existsSync(retailerDownloadFolder)) {
        fs.mkdir(retailerDownloadFolder, (err) => {
            if (err) console.log(err.message);
        });
    }
    
    const files = fs.readdirSync(retailerDownloadFolder);
    
    if (files.length > 0) {
        for (const file of files) {
            getPriority(file);
        }
    } else {
        responseMessage = 'You must first obtain the data, visit /parseRetailer';
    }
        
    res.json({message: responseMessage});
});

const getPriority = (file) => {
     csvToJson({ delimiter: '\t'}).fromFile(path.join(retailerDownloadFolder, file)).then((json) => {
        // Obtengo un array con todos los mpn
        let jsonMpn = json.map(function(data) {
            return data.MPN;
        });
    
        // Averiguo la cantidad de veces que aparece cada uno
        let numberOfOccurrences = {};
        jsonMpn.forEach(function(mpn){
            numberOfOccurrences[mpn] = (numberOfOccurrences[mpn] || 0) + 1;
        });
    
        // Devuelvo la prioridad ordenada por la cantidad de veces que aparecen
        let sortedMpn = Object.keys(numberOfOccurrences).sort(function(a,b){return numberOfOccurrences[b]-numberOfOccurrences[a]});
        let mpnPriority = {};
    
        for (const key in sortedMpn) {
            mpnPriority[sortedMpn[key]] = parseInt(key) + 1;
        }
    
        console.log(mpnPriority);
    });
}

module.exports = router;