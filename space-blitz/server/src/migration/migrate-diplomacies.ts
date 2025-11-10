import mysql from 'mysql2/promise';
import mongoose from 'mongoose';
import { Diplomacy, Game } from '../models/index.js';
import dotenv from 'dotenv';

dotenv.config();

interface MySQLDiplomacy {
  id: number;
  game_id: number;
  series_id: number;
  game_number: number;
  empire: string;
  opponent: string;
  offer: number;
  status: number;
}

async function migrateDiplomacies() {
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

    // Get all diplomacies from MySQL
    const [rows] = await mysqlConnection.execute('SELECT * FROM diplomacies ORDER BY id');
    const mysqlDiplomacies = rows as MySQLDiplomacy[];

    console.log(`Found ${mysqlDiplomacies.length} diplomacy records to migrate`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const diplomacy of mysqlDiplomacies) {
      try {
        // Check if diplomacy already exists
        const existingDiplomacy = await Diplomacy.findOne({
          gameId: diplomacy.game_id,
          empire: diplomacy.empire,
          opponent: diplomacy.opponent
        });
        if (existingDiplomacy) {
          console.log(`Skipping existing diplomacy: ${diplomacy.empire} vs ${diplomacy.opponent}`);
          skipped++;
          continue;
        }

        // Find the game ObjectId
        const game = await Game.findOne({
          seriesId: diplomacy.series_id,
          gameNumber: diplomacy.game_number
        });
        if (!game) {
          console.log(`Game not found for diplomacy ${diplomacy.empire} vs ${diplomacy.opponent} in game ${diplomacy.game_number}, skipping`);
          errors++;
          continue;
        }

        // Convert MySQL data to MongoDB format
        const diplomacyData = {
          gameId: game._id,
          seriesId: game.seriesId,
          gameNumber: diplomacy.game_number,

          // Relationship
          empire: diplomacy.empire,
          opponent: diplomacy.opponent,

          // Status
          offer: diplomacy.offer,
          status: diplomacy.status
        };

        // Create diplomacy in MongoDB
        const newDiplomacy = new Diplomacy(diplomacyData);
        await newDiplomacy.save();

        migrated++;
        console.log(`Migrated diplomacy: ${diplomacy.empire} vs ${diplomacy.opponent} (${diplomacy.status})`);

      } catch (error) {
        console.error(`Error migrating diplomacy ${diplomacy.empire} vs ${diplomacy.opponent}:`, error);
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
  migrateDiplomacies()
    .then(() => {
      console.log('Diplomacies migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Diplomacies migration failed:', error);
      process.exit(1);
    });
}

export { migrateDiplomacies };