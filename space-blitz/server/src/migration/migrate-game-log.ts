import mysql from 'mysql2/promise';
import mongoose from 'mongoose';
import { GameLog } from '../models/index.js';
import dotenv from 'dotenv';

dotenv.config();

interface MySQLGameLog {
  id: number;
  name: string;
  result: string;
  bridier: '1' | '0';
  end_date: number;
  emps_left: string;
  emps_nuked: string;
}

async function migrateGameLog() {
  let mysqlConnection: mysql.Connection | null = null;
  let mongoConnection: mongoose.Connection | null = null;

  try {
    // Connect to MySQL
    mysqlConnection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'sc',
      port: parseInt(process.env.MYSQL_PORT || '3306')
    });

    console.log('Connected to MySQL database');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/space-blitz');
    mongoConnection = mongoose.connection;
    console.log('Connected to MongoDB');

    // Get all game log records from MySQL
    const [rows] = await mysqlConnection.execute('SELECT * FROM gamelog ORDER BY id');
    const mysqlGameLogs = rows as MySQLGameLog[];

    console.log(`Found ${mysqlGameLogs.length} game log records to migrate`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const gameLog of mysqlGameLogs) {
      try {
        // Check if game log already exists
        const existingGameLog = await GameLog.findOne({
          name: gameLog.name,
          endDate: new Date(gameLog.end_date * 1000)
        });
        if (existingGameLog) {
          console.log(`Skipping existing game log: ${gameLog.name}`);
          skipped++;
          continue;
        }

        // Convert MySQL data to MongoDB format
        const gameLogData = {
          // Game info
          name: gameLog.name,
          result: gameLog.result,
          bridier: gameLog.bridier === '1',

          // End state
          endDate: new Date(gameLog.end_date * 1000),
          empsLeft: gameLog.emps_left || '',
          empsNuked: gameLog.emps_nuked || ''
        };

        // Create game log in MongoDB
        const newGameLog = new GameLog(gameLogData);
        await newGameLog.save();

        migrated++;
        console.log(`Migrated game log: ${gameLog.name}`);

      } catch (error) {
        console.error(`Error migrating game log ${gameLog.name}:`, error);
        errors++;
      }
    }

    console.log(`\nMigration completed:`);
    console.log(`- Migrated: ${migrated}`);
    console.log(`- Skipped: ${skipped}`);
    console.log(`- Errors: ${errors}`);

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    // Close connections
    if (mysqlConnection) {
      await mysqlConnection.end();
    }
    if (mongoConnection) {
      await mongoConnection.close();
    }
  }
}

// Run migration if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateGameLog()
    .then(() => {
      console.log('Game log migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Game log migration failed:', error);
      process.exit(1);
    });
}

export { migrateGameLog };