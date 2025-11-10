import mysql from 'mysql2/promise';
import mongoose from 'mongoose';
import { History, Game } from '../models/index.js';
import dotenv from 'dotenv';

dotenv.config();

interface MySQLHistory {
  id: number;
  game_id: number;
  empire: string;
  coordinates: string;
  event: string;
  info: string;
  update_no: number;
}

async function migrateHistory() {
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

    // Get all history records from MySQL
    const [rows] = await mysqlConnection.execute('SELECT * FROM history ORDER BY id');
    const mysqlHistory = rows as MySQLHistory[];

    console.log(`Found ${mysqlHistory.length} history records to migrate`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const history of mysqlHistory) {
      try {
        // Check if history record already exists
        const existingHistory = await History.findOne({
          gameId: history.game_id,
          empire: history.empire,
          coordinates: history.coordinates,
          updateNo: history.update_no
        });
        if (existingHistory) {
          console.log(`Skipping existing history record: ${history.empire} at ${history.coordinates} update ${history.update_no}`);
          skipped++;
          continue;
        }

        // Find the game ObjectId
        const game = await Game.findOne({ _id: history.game_id });
        if (!game) {
          console.log(`Game not found for history record ${history.id}, skipping`);
          errors++;
          continue;
        }

        // Convert MySQL data to MongoDB format
        const historyData = {
          gameId: game._id,

          // Event data
          empire: history.empire,
          coordinates: history.coordinates,
          event: history.event,
          info: history.info,
          updateNo: history.update_no
        };

        // Create history record in MongoDB
        const newHistory = new History(historyData);
        await newHistory.save();

        migrated++;
        if (migrated % 1000 === 0) {
          console.log(`Migrated ${migrated} history records...`);
        }

      } catch (error) {
        console.error(`Error migrating history record ${history.id}:`, error);
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
  migrateHistory()
    .then(() => {
      console.log('History migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('History migration failed:', error);
      process.exit(1);
    });
}

export { migrateHistory };