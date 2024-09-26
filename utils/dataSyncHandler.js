const { getClient, googleSheets } = require('../config/googleSheets');
const { createTable, tableExists, getColumnNames, alterTable } = require('./tableUtility');
const db = require('../config/db');
const { disableTriggers, enableTriggers } = require('./tableUtility');
require('dotenv').config();

// Function to parse date strings into Date objects
const parseDate = (dateString) => {
    const parsedDate = new Date(dateString);
    return isNaN(parsedDate.getTime()) ? null : parsedDate;
};

// Function to get the number of columns in the sheet
const getColumnCount = async (client, spreadsheetId) => {
    const response = await googleSheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Sheet1!1:1',
        auth: client
    });

    return response.data.values[0].filter(header => header && header.trim() !== '').length;
};

// Function to sync Google Sheet to DB
const syncSheetToDb = async () => {
    try {
        const client = await getClient();
        const spreadsheetId = process.env.SHEET_ID;

        await disableTriggers();

        const columnCount = await getColumnCount(client, spreadsheetId);
        const dynamicRange = `Sheet1!A:${String.fromCharCode(65 + columnCount - 1)}`;
        const timestampRange = `Sheet1!Z:Z`;

        const dynamicResponse = await googleSheets.spreadsheets.values.get({
            spreadsheetId,
            range: dynamicRange,
            auth: client,
        });

        const timestampResponse = await googleSheets.spreadsheets.values.get({
            spreadsheetId,
            range: timestampRange,
            auth: client,
        });

        const dynamicRows = dynamicResponse.data.values;
        const timestampRows = timestampResponse.data.values || [];

        if (dynamicRows.length) {
            const headers = dynamicRows[0];
            const newRows = dynamicRows.slice(1);

            if (!(await tableExists())) {
                await createTable(headers);
            } else {
                const existingColumns = await getColumnNames();
                await alterTable(existingColumns, headers);
            }

            const newData = newRows.map((row, index) => {
                const rowData = {};
                headers.forEach((header, columnIndex) => {
                    rowData[header] = row[columnIndex] || '';
                });
                const timestamp = timestampRows[index + 1] ? timestampRows[index + 1][0] : null;
                rowData['timestamp'] = parseDate(timestamp);
                return rowData;
            });

            await new Promise((resolve, reject) => {
                db.query('DELETE FROM dynamic_table', (err) => {
                    if (err) {
                        console.error('Error deleting existing data:', err);
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });

            for (const newRow of newData) {
                const insertData = { ...newRow };
                delete insertData['timestamp'];
                await new Promise((resolve, reject) => {
                    db.query('INSERT INTO dynamic_table SET ?', insertData, (err) => {
                        if (err) {
                            console.error('Error inserting data:', err);
                            reject(err);
                        } else {
                            console.log(`Inserted ${newRow['Id']} into the database.`);
                            resolve();
                        }
                    });
                });
            }
        } else {
            console.log('No data found in the sheet.');
        }
    } catch (error) {
        console.error('Error reading from Google Sheets:', error);
        throw new Error('Error reading from Google Sheets');
    } finally {
        await enableTriggers();
    }
};

module.exports = {
    syncSheetToDb
};
