[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/e0mOS4g_)
# Superjoin Hiring Assignment

### Welcome to Superjoin's hiring assignment! 🚀

### Objective
Build a solution that enables real-time synchronization of data between a Google Sheet and a specified database (e.g., MySQL, PostgreSQL). The solution should detect changes in the Google Sheet and update the database accordingly, and vice versa.

### Problem Statement
Many businesses use Google Sheets for collaborative data management and databases for more robust and scalable data storage. However, keeping the data synchronised between Google Sheets and databases is often a manual and error-prone process. Your task is to develop a solution that automates this synchronisation, ensuring that changes in one are reflected in the other in real-time.

### Requirements:
1. Real-time Synchronisation
  - Implement a system that detects changes in Google Sheets and updates the database accordingly.
   - Similarly, detect changes in the database and update the Google Sheet.
  2.	CRUD Operations
   - Ensure the system supports Create, Read, Update, and Delete operations for both Google Sheets and the database.
   - Maintain data consistency across both platforms.
   
### Optional Challenges (This is not mandatory):
1. Conflict Handling
- Develop a strategy to handle conflicts that may arise when changes are made simultaneously in both Google Sheets and the database.
- Provide options for conflict resolution (e.g., last write wins, user-defined rules).
    
2. Scalability: 	
- Ensure the solution can handle large datasets and high-frequency updates without performance degradation.
- Optimize for scalability and efficiency.

## Submission ⏰
The timeline for this submission is: **Next 2 days**

Some things you might want to take care of:
- Make use of git and commit your steps!
- Use good coding practices.
- Write beautiful and readable code. Well-written code is nothing less than a work of art.
- Use semantic variable naming.
- Your code should be organized well in files and folders which is easy to figure out.
- If there is something happening in your code that is not very intuitive, add some comments.
- Add to this README at the bottom explaining your approach (brownie points 😋)
- Use ChatGPT4o/o1/Github Co-pilot, anything that accelerates how you work 💪🏽. 

Make sure you finish the assignment a little earlier than this so you have time to make any final changes.

Once you're done, make sure you **record a video** showing your project working. The video should **NOT** be longer than 120 seconds. While you record the video, tell us about your biggest blocker, and how you overcame it! Don't be shy, talk us through, we'd love that.

We have a checklist at the bottom of this README file, which you should update as your progress with your assignment. It will help us evaluate your project.

- [X] My code's working just fine! 🥳
- [X] I have recorded a video showing it working and embedded it in the README ▶️
- [X] I have tested all the normal working cases 😎
- [X] I have even solved some edge cases (brownie points) 💪
- [X] I added my very planned-out approach to the problem at the end of this README 📜

## Got Questions❓
Feel free to check the discussions tab, you might get some help there. Check out that tab before reaching out to us. Also, did you know, the internet is a great place to explore? 😛

We're available at techhiring@superjoin.ai for all queries. 

All the best ✨.

## Developer's Section
*Add your video here, and your approach to the problem (optional). Leave some comments for us here if you want, we will be reading this :)*
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



