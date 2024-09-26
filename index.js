const express = require('express');
const { syncSheetToDb } = require('./utils/dataSyncHandler');
const { syncDbChangesToSheet } = require('./utils/dbEventListener');

const app = express();
app.use(express.json());

//Check for updates every 8 seconds
setInterval(syncDbChangesToSheet, 8000);
setInterval(syncSheetToDb, 8000);

app.get("/", (req, res) => {
    res.status(200).send('Synchronization Server is UP!!');
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});