const db = require('../config/db');
require('dotenv').config();
const { googleSheets, getClient } = require('../config/googleSheets');
const { disableTriggers, enableTriggers } = require('./tableUtility');

// Fetch changes from the sync_changes table
const getSyncChanges = async () => {
    return new Promise((resolve, reject) => {
        db.query('SELECT * FROM sync_changes', (err, result) => {
            if (err) {
                console.error('Error fetching sync changes:', err);
                reject(err);
            } else {
                console.log('Fetched sync changes:', result);
                resolve(result);
            }
        });
    });
};

// Delete processed changes from sync_changes table
const deleteProcessedChange = async (changeId) => {
    return new Promise((resolve, reject) => {
        db.query('DELETE FROM sync_changes WHERE id = ?', [changeId], (err) => {
            if (err) {
                console.error('Error deleting sync change:', err);
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

// Fetch full row data by row_id from dynamic_table
const getRowDataById = async (row_id) => {
    return new Promise((resolve, reject) => {
        db.query('SELECT * FROM dynamic_table WHERE Id = ?', [row_id], (err, result) => {
            if (err) {
                console.error('Error fetching row data:', err);
                reject(err);
            } else {
                resolve(result[0]); // Assuming only one row is returned
            }
        });
    });
};

// Update Google Sheets based on DB changes
const updateSheet = async (spreadsheetId, changes) => {
    await disableTriggers();
    const client = await getClient();
    const sheetName = 'Sheet1';

    for (const change of changes) {
        const { id, operation, row_id } = change;

        if (operation === 'INSERT') {
            const rowData = await getRowDataById(row_id);
            const formattedValues = [Object.values(rowData)];

            await googleSheets.spreadsheets.values.append({
                spreadsheetId,
                range: `${sheetName}!A:A`,
                valueInputOption: 'USER_ENTERED',
                resource: { values: formattedValues },
                auth: client,
            });
            console.log(`Inserted row with ID ${row_id} into Google Sheets.`);

        } else if (operation === 'UPDATE') {
            const rowData = await getRowDataById(row_id);
            const formattedValues = [Object.values(rowData)];

            await googleSheets.spreadsheets.values.update({
                spreadsheetId,
                range: `${sheetName}!A${row_id + 1}`,
                valueInputOption: 'USER_ENTERED',
                resource: { values: formattedValues },
                auth: client,
            });
            console.log(`Updated row with ID ${row_id} in Google Sheets.`);

        } else if (operation === 'DELETE') {
            console.log(`Row with ID ${row_id} should be deleted in Google Sheets.`);

            const sheetData = await googleSheets.spreadsheets.values.get({
                spreadsheetId,
                range: `${sheetName}!A:Z`,
                auth: client,
            });

            const rows = sheetData.data.values || [];
            const rowIndex = rows.findIndex(row => row[0] == row_id);

            if (rowIndex > -1) {
                await googleSheets.spreadsheets.values.update({
                    spreadsheetId,
                    range: `${sheetName}!A${rowIndex + 1}:Z${rowIndex + 1}`,
                    valueInputOption: 'USER_ENTERED',
                    resource: { values: [['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']] },
                    auth: client,
                });
                console.log(`Deleted row with ID ${row_id} in Google Sheets.`);
            }
        }

        await deleteProcessedChange(id);
    }
    await enableTriggers();
};

// Main sync function to periodically invoke
const syncDbChangesToSheet = async () => {
    try {
        const changes = await getSyncChanges();
        if (changes.length > 0) {
            const spreadsheetId = process.env.SHEET_ID;
            await updateSheet(spreadsheetId, changes);
        } else {
            console.log('No new changes to sync.');
        }
    } catch (error) {
        console.error('Error syncing DB changes to Google Sheets:', error);
    }
};

module.exports = { syncDbChangesToSheet };