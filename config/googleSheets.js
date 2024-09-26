const { google } = require('googleapis');
const path = require('path');
require('dotenv').config();

const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, '..', process.env.GOOGLE_APPLICATION_CREDENTIALS),
    scopes: "https://www.googleapis.com/auth/spreadsheets",
});

const getClient = async () => {
    const client = await auth.getClient();
    return client;
};

const googleSheets = google.sheets({ version: "v4" });
module.exports = { googleSheets, getClient };