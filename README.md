# SheetSync

The project is made by:
- Aritro Saha 21BLC1174

## Working Video
[![Thumbnail](./assets/placeholder.jpeg)](https://www.youtube.com/watch?v=oAA0IglYapM "Click to Play Video Demonstration")

## Project Overview
This project is designed to synchronize data between a Google Sheets spreadsheet and a MySQL database ```(dynamic_table)``` in real time. The application monitors changes in both Google Sheets and the MySQL database and keeps them in sync. It supports Create, Read, Update, and Delete (CRUD) operations, ensuring that any changes in one data source reflect in the other.

## Features
- Google Sheets to MySQL Synchronization: Reads data from a Google Sheet and syncs it into a MySQL database table.
- MySQL to Google Sheets Synchronization: Tracks changes in the MySQL database and syncs them back to the Google Sheet.
- Trigger-based Change Detection: Uses MySQL triggers to detect data changes and logs them in a ```sync_changes``` table for synchronization.
- Conflict-Free Sync: Ensures changes are processed sequentially without conflicts.
- Real-Time Synchronization: Automatically checks for updates every 8 seconds for both Google Sheets and MySQL.

## Folder Structure

```bash
.
├── config
│   ├── db.js
│   ├── googleSheets.js
├── utils
│   ├── dataSyncHandler.js
│   ├── dbEventListener.js
│   ├── tableUtility.js
├── index.js
├── .env
├── credentials.json
├── package.json
```

### Files Description

- ```config/db.js:``` Handles MySQL database connection using environment variables.
- ```config/googleSheets.js:``` Provides authentication for Google Sheets API and exposes client to interact with Google Sheets.
- ```utils/dataSyncHandler.js:``` Contains logic to pull data from Google Sheets and insert it into the MySQL database, maintaining consistency.
- ```utils/dbEventListener.js:``` Handles synchronization from MySQL to Google Sheets by detecting changes in the database using a sync_changes table.
- ```utils/tableUtility.js:``` Utility functions for managing MySQL triggers, altering the database schema, and checking the existence of tables.
- ```index.js:``` Main entry point of the Express server, which periodically invokes synchronization functions between Google Sheets and MySQL.

## Environment Variables

Create a .env file in the root directory and set the following data

```
GOOGLE_APPLICATION_CREDENTIALS=./credentials.json
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=<your-db-password>
DB_NAME=sheetsync
SHEET_ID=<your-google-sheet-id>
```

### Detailed Code Explanation

1. config/db.js
  This file establishes a connection to your MySQL database using the ```mysql2``` library. The connection details (host, port, user, password, and database name) are loaded from environment variables stored in ```.env```.
  ```javascript
  const mysql = require('mysql2');
  const db = mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
  });

  db.connect(...);
  module.exports = db;
  ```

2. config/googleSheets.js
  This module sets up authentication to interact with the Google Sheets API using Google Cloud credentials and exports the ```googleSheets``` client.
  ```javascript
  const { google } = require('googleapis');
  const auth = new google.auth.GoogleAuth({
      keyFile: path.join(__dirname, '..', process.env.GOOGLE_APPLICATION_CREDENTIALS),
      scopes: "https://www.googleapis.com/auth/spreadsheets",
  });

  const googleSheets = google.sheets({ version: "v4" });
  module.exports = { googleSheets, getClient };
  ```

3. utils/dataSyncHandler.js
  This module is responsible for synchronizing data from Google Sheets into the MySQL database ```(dynamic_table)```. It reads data from the spreadsheet, updates the database schema (if necessary), and inserts the data into the ```dynamic_table```.
  ```javascript
  const syncSheetToDb = async () => {
      ...
      const dynamicRows = dynamicResponse.data.values;
      const newData = newRows.map((row) => {
          // Process rows
      });

      db.query('DELETE FROM dynamic_table', ...);

      for (const newRow of newData) {
          db.query('INSERT INTO dynamic_table SET ?', insertData, ...);
      }
  };
  ```

4. utils/dbEventListener.js
  This module listens for changes in the MySQL database and pushes these changes to the Google Sheet. It checks the ```sync_changes``` table for new entries and updates Google Sheets accordingly.
  ```javascript
  const syncDbChangesToSheet = async () => {
      const changes = await getSyncChanges();
      if (changes.length > 0) {
          const spreadsheetId = process.env.SHEET_ID;
          await updateSheet(spreadsheetId, changes);
      }
  };
  ```

5. utils/tableUtility.js
  Contains helper functions to manage database triggers, alter table structure, and check for table existence. These are essential for ensuring that the database schema remains consistent with the Google Sheets structure.

  - disableTriggers: Disables all triggers (insert, update, delete) on the ```dynamic_table``` to prevent recursive syncing during bulk updates.
  - enableTriggers: Re-enables the triggers once synchronization is complete.
  - alterTable: Modifies the schema of ```dynamic_table``` based on changes in Google Sheets.

6. index.js
  This is the main file that starts the Express server and schedules two synchronization functions to run every 8 seconds:

  - ```syncSheetToDb```: Syncs data from Google Sheets to MySQL.
  - ```syncDbChangesToSheet```: Syncs data from MySQL to Google Sheets.
  ```javascript
  setInterval(syncSheetToDb, 8000);
  setInterval(syncDbChangesToSheet, 8000);
  ```

## How the System Works

1. Google Sheets to MySQL:

  - Data from the Google Sheet is fetched and compared to the structure of ```dynamic_table```.
  - Any structural changes (e.g., new columns) are reflected in the MySQL database schema.
  - The rows from the sheet are then inserted or updated in the ```dynamic_table```.

2. MySQL to Google Sheets:

  - The database uses triggers to log changes (INSERT, UPDATE, DELETE) in the ```sync_changes``` table.
  - The changes are then processed, and the corresponding updates are made in the Google Sheet.

## Future Improvements

- **Conflict Handling**: Add more advanced conflict resolution mechanisms to handle simultaneous changes in both Google Sheets and the database.
  - One Solution That I have come up with is I will be using hashing to hash the rows and check for changes
  and then compare the hashesh to look for changes and then only change that particular row which greatly increases the efficiency
- **Scalability**: Implement more scalable synchronization techniques for larger datasets or higher change frequency.
  - Using Timestamps to Monitor Changes and Implementation of Batch System to Upload data by accumulating some changes together first instead of one by one updation can increase the scalability.
- **Logging and Monitoring**: Implement more detailed logging and error monitoring to track synchronization failures.
  - Maintaince of Logs and Live Monitoring can help in actively tracking synchronization failures or database errors.

## Problems I Faced 

- I tried to create a time stamp based approach where time will be monitored and stored from the sheets and that will be used to check when the row was last modified to compare and update only the cells which have been updated since the last modification but I couldn't really find a solution to that because I couldn't realise how to monitor the time and thus relied on updating the database on every change in the sheets.



