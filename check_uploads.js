require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// === CONFIGURATION ===
// Allow DB host/port override via command-line arguments
const argv = require('minimist')(process.argv.slice(2));
let dbHost = argv.host || process.env.DB_HOST || 'localhost';
let dbPort = argv.port ? parseInt(argv.port) : (process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306);
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || '';
const dbName = process.env.DB_NAME || 'e_repository_db';
const UPLOADS_DIR = path.join(__dirname, 'uploads');

const DB_CONFIG = {
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
};

// === HELPER ===
async function getFileAndCoverUrls(connection, table) {
    const [rows] = await connection.query(
        `SELECT id, file_url, cover_image_url FROM ${table} WHERE file_url IS NOT NULL OR cover_image_url IS NOT NULL`
    );
    return rows.flatMap(row => [
        row.file_url ? { id: row.id, type: 'file', url: row.file_url } : null,
        row.cover_image_url ? { id: row.id, type: 'cover', url: row.cover_image_url } : null,
    ].filter(Boolean));
}

function fileExists(filePath) {
    if (!filePath) return false;
    return fs.existsSync(path.join(UPLOADS_DIR, filePath.replace('/uploads/', '')));
}

function walkDir(dir, fileList = []) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath, fileList);
        } else {
            fileList.push(fullPath);
        }
    });
    return fileList;
}

// === MAIN ===
(async () => {
    let connection;
    try {
        // Try initial connection
        connection = await mysql.createConnection(DB_CONFIG);
    } catch (err) {
        // If failed and using Docker Compose defaults, try localhost:3307 as fallback
        if ((dbHost === 'mysql' || dbHost === '127.0.0.1' || dbHost === 'localhost') && dbPort === 3306) {
            try {
                console.warn('[WARN] Failed to connect to mysql:3306, trying localhost:3307...');
                connection = await mysql.createConnection({
                    host: 'localhost',
                    port: 3307,
                    user: dbUser,
                    password: dbPassword,
                    database: dbName,
                });
            } catch (err2) {
                console.error('Error connecting to MySQL:', err2.message);
                process.exit(1);
            }
        } else {
            console.error('Error connecting to MySQL:', err.message);
            process.exit(1);
        }
    }

    // 1. Get all file_urls and cover_image_urls from books and papers
    const bookFiles = await getFileAndCoverUrls(connection, 'books');
    const paperFiles = await getFileAndCoverUrls(connection, 'papers');

    // 2. Check for missing files
    let missing = [];
    for (const { id, type, url } of [...bookFiles, ...paperFiles]) {
        if (!fileExists(url)) {
            missing.push({ id, type, url });
        }
    }

    // 3. Check for orphan files (files in uploads/ not referenced in DB)
    const allDbFiles = new Set([...bookFiles, ...paperFiles].map(f => f.url.replace('/uploads/', '')));
    const allFilesOnDisk = walkDir(UPLOADS_DIR).map(f => path.relative(UPLOADS_DIR, f));
    const orphanFiles = allFilesOnDisk.filter(f => !allDbFiles.has(f));

    // 4. Report
    console.log('=== Missing Files (referenced in DB but not found on disk) ===');
    if (missing.length === 0) {
        console.log('None! 🎉');
    } else {
        missing.forEach(m => console.log(`ID: ${m.id} | Type: ${m.type} | ${m.url}`));
    }

    console.log('\n=== Orphan Files (exist on disk but not referenced in DB) ===');
    if (orphanFiles.length === 0) {
        console.log('None! 🎉');
    } else {
        orphanFiles.forEach(f => console.log(f));

        // === AUTO DELETE ORPHAN FILES ===
        orphanFiles.forEach(f => {
            const fullPath = path.join(UPLOADS_DIR, f);
            fs.unlinkSync(fullPath);
            console.log(`Deleted: ${f}`);
        });
    }

    await connection.end();
})();