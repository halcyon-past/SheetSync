const db = require('../config/db');

// Drop a specified trigger
const dropTrigger = (triggerName) => {
    return new Promise((resolve, reject) => {
        db.query(`DROP TRIGGER IF EXISTS ${triggerName}`, (err) => {
            if (err) {
                console.error(`Error dropping trigger ${triggerName}:`, err);
                reject(err);
            } else {
                console.log(`Trigger ${triggerName} dropped.`);
                resolve();
            }
        });
    });
};

// Disable all triggers
const disableTriggers = async () => {
    try {
        await Promise.all(['sync_insert', 'sync_update', 'sync_delete'].map(dropTrigger));
    } catch (err) {
        console.error('Error dropping triggers:', err);
    }
};

// Create a specified trigger
const createTrigger = (triggerSQL) => {
    return new Promise((resolve, reject) => {
        db.query(triggerSQL, (err) => {
            if (err) {
                console.error('Error creating trigger:', err);
                reject(err);
            } else {
                console.log('Trigger created.');
                resolve();
            }
        });
    });
};

// Enable triggers
const enableTriggers = async () => {
    try {
        const triggers = [
            {
                name: 'sync_insert',
                sql: `
                    CREATE TRIGGER sync_insert
                    AFTER INSERT ON dynamic_table
                    FOR EACH ROW
                    BEGIN
                        INSERT INTO sync_changes (row_id, operation) VALUES (NEW.Id, 'INSERT');
                    END;
                `,
            },
            {
                name: 'sync_update',
                sql: `
                    CREATE TRIGGER sync_update
                    AFTER UPDATE ON dynamic_table
                    FOR EACH ROW
                    BEGIN
                        INSERT INTO sync_changes (row_id, operation) VALUES (NEW.Id, 'UPDATE');
                    END;
                `,
            },
            {
                name: 'sync_delete',
                sql: `
                    CREATE TRIGGER sync_delete
                    AFTER DELETE ON dynamic_table
                    FOR EACH ROW
                    BEGIN
                        INSERT INTO sync_changes (row_id, operation) VALUES (OLD.Id, 'DELETE');
                    END;
                `,
            },
        ];

        await Promise.all(triggers.map(trigger => createTrigger(trigger.sql)));
    } catch (err) {
        console.error('Error recreating triggers:', err);
    }
};

// Check if the table exists
const tableExists = async () => {
    return new Promise((resolve, reject) => {
        db.query("SHOW TABLES LIKE 'dynamic_table'", (err, result) => {
            if (err) {
                console.error('Error checking table existence:', err);
                reject(err);
            } else {
                resolve(result.length > 0);
            }
        });
    });
};

// Get existing column names from the table
const getColumnNames = async () => {
    return new Promise((resolve, reject) => {
        db.query("SHOW COLUMNS FROM dynamic_table", (err, result) => {
            if (err) {
                console.error('Error fetching column names:', err);
                reject(err);
            } else {
                const columns = result.map(row => row.Field);
                resolve(columns);
            }
        });
    });
};

// Alter the table based on new columns
const alterTable = async (existingColumns, newColumns) => {
    const columnsToAdd = newColumns.filter(col => !existingColumns.includes(col));
    const columnsToRemove = existingColumns.filter(col => !newColumns.includes(col));

    for (const col of columnsToAdd) {
        await new Promise((resolve, reject) => {
            db.query(`ALTER TABLE dynamic_table ADD COLUMN ${col} VARCHAR(255)`, (err) => {
                if (err) {
                    console.error(`Error adding column ${col}:`, err);
                    reject(err);
                } else {
                    console.log(`Added column ${col} to the table.`);
                    resolve();
                }
            });
        });
    }

    for (const col of columnsToRemove) {
        await new Promise((resolve, reject) => {
            db.query(`ALTER TABLE dynamic_table DROP COLUMN ${col}`, (err) => {
                if (err) {
                    console.error(`Error removing column ${col}:`, err);
                    reject(err);
                } else {
                    console.log(`Removed column ${col} from the table.`);
                    resolve();
                }
            });
        });
    }
};

module.exports = {
    tableExists,
    getColumnNames,
    alterTable,
    disableTriggers,
    enableTriggers,
};
