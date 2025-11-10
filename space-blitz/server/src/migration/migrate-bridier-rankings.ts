import mysql from 'mysql2/promise';
import mongoose from 'mongoose';
import { BridierRanking, Game } from '../models/index.js';
import dotenv from 'dotenv';

dotenv.config();

interface MySQLBridier {
  id: number;
  game_id: number;
  series_name: string;
  game_number: number;
  empire1: string;
  starting_rank1: number;
  starting_index1: number;
  ending_rank1: number;
  empire2: string;
  starting_rank2: number;
  starting_index2: number;
  ending_rank2: number;
  winner: number;
  start_time: number;
  end_time: number;
}

async function migrateBridierRankings() {
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

    // Get all bridier records from MySQL
    const [rows] = await mysqlConnection.execute('SELECT * FROM bridier ORDER BY id');
    const mysqlBridier = rows as MySQLBridier[];

    console.log(`Found ${mysqlBridier.length} bridier ranking records to migrate`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const bridier of mysqlBridier) {
      try {
        // Check if bridier ranking already exists
        const existingBridier = await BridierRanking.findOne({
          gameId: bridier.game_id,
          empire1: bridier.empire1,
          empire2: bridier.empire2,
          startTime: new Date(bridier.start_time * 1000)
        });
        if (existingBridier) {
          console.log(`Skipping existing bridier ranking: ${bridier.empire1} vs ${bridier.empire2}`);
          skipped++;
          continue;
        }

        // Find the game ObjectId
        const game = await Game.findOne({
          seriesId: bridier.game_id, // Note: This might need adjustment based on actual data structure
          gameNumber: bridier.game_number
        });

        // Convert MySQL data to MongoDB format
        const bridierData = {
          gameId: game ? game._id : bridier.game_id,
          seriesName: bridier.series_name,
          gameNumber: bridier.game_number,

          // Match data
          empire1: bridier.empire1,
          startingRank1: bridier.starting_rank1,
          startingIndex1: bridier.starting_index1,
          endingRank1: bridier.ending_rank1,

          empire2: bridier.empire2,
          startingRank2: bridier.starting_rank2,
          startingIndex2: bridier.starting_index2,
          endingRank2: bridier.ending_rank2,

          // Result
          winner: bridier.winner,
          startTime: new Date(bridier.start_time * 1000),
          endTime: new Date(bridier.end_time * 1000)
        };

        // Create bridier ranking in MongoDB
        const newBridier = new BridierRanking(bridierData);
        await newBridier.save();

        migrated++;
        console.log(`Migrated bridier ranking: ${bridier.empire1} vs ${bridier.empire2}`);

      } catch (error) {
        console.error(`Error migrating bridier ranking ${bridier.empire1} vs ${bridier.empire2}:`, error);
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
  migrateBridierRankings()
    .then(() => {
      console.log('Bridier rankings migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Bridier rankings migration failed:', error);
      process.exit(1);
    });
}

export { migrateBridierRankings };