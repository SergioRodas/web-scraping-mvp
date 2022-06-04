const app = require('./app');
const config = require('./config');

// Constants
const PORT = config.PORT;
const HOST = config.HOST;

// App
app.listen(PORT, HOST);

console.log(`Running on http://${HOST}:${PORT}`);