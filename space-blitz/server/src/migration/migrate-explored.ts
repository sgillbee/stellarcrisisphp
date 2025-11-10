import mysql from 'mysql2/promise';
import mongoose from 'mongoose';
import { Explored, Player, Game } from '../models/index.js';
import dotenv from 'dotenv';

dotenv.config();

interface MySQLExplored {
  id: number;
  player_id: number;
  game_id: number;
  series_id: number;
  game_number: number;
  coordinates: string;
  empire: string;
  update_explored: number;
  from_shared_hq: '1' | '0';
}

async function migrateExplored() {
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

    // Get all explored records from MySQL
    const [rows] = await mysqlConnection.execute('SELECT * FROM explored ORDER BY id');
    const mysqlExplored = rows as MySQLExplored[];

    console.log(`Found ${mysqlExplored.length} explored records to migrate`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const explored of mysqlExplored) {
      try {
        // Check if explored record already exists
        const existingExplored = await Explored.findOne({
          playerId: explored.player_id,
          gameId: explored.game_id,
          coordinates: explored.coordinates
        });
        if (existingExplored) {
          console.log(`Skipping existing explored record: ${explored.coordinates} for player ${explored.player_id}`);
          skipped++;
          continue;
        }

        // Find the player ObjectId
        const player = await Player.findOne({
          gameId: explored.game_id,
          empireName: explored.empire
        });
        if (!player) {
          console.log(`Player not found for explored record ${explored.coordinates} for ${explored.empire}, skipping`);
          errors++;
          continue;
        }

        // Find the game ObjectId
        const game = await Game.findOne({
          seriesId: explored.series_id,
          gameNumber: explored.game_number
        });
        if (!game) {
          console.log(`Game not found for explored record ${explored.coordinates} in game ${explored.game_number}, skipping`);
          errors++;
          continue;
        }

        // Convert MySQL data to MongoDB format
        const exploredData = {
          playerId: player._id,
          gameId: game._id,
          seriesId: game.seriesId,
          gameNumber: explored.game_number,

          // Location
          coordinates: explored.coordinates,
          empire: explored.empire,

          // State
          updateExplored: explored.update_explored,
          fromSharedHq: explored.from_shared_hq === '1'
        };

        // Create explored record in MongoDB
        const newExplored = new Explored(exploredData);
        await newExplored.save();

        migrated++;
        console.log(`Migrated explored record: ${explored.coordinates} for ${explored.empire}`);

      } catch (error) {
        console.error(`Error migrating explored record ${explored.coordinates}:`, error);
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
  migrateExplored()
    .then(() => {
      console.log('Explored migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Explored migration failed:', error);
      process.exit(1);
    });
}

export { migrateExplored };