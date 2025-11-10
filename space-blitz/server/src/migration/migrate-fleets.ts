import mysql from 'mysql2/promise';
import mongoose from 'mongoose';
import { Fleet, Game, Player } from '../models/index.js';
import dotenv from 'dotenv';

dotenv.config();

interface MySQLFleet {
  id: number;
  game_id: number;
  series_id: number;
  game_number: number;
  name: string;
  owner: string;
  player_id: number;
  collapsed: '1' | '0';
  location: string;
  orders: string;
  order_arguments: string;
}

async function migrateFleets() {
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

    // Get all fleets from MySQL
    const [rows] = await mysqlConnection.execute('SELECT * FROM fleets ORDER BY id');
    const mysqlFleets = rows as MySQLFleet[];

    console.log(`Found ${mysqlFleets.length} fleets to migrate`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const fleet of mysqlFleets) {
      try {
        // Check if fleet already exists
        const existingFleet = await Fleet.findOne({
          gameId: fleet.game_id,
          name: fleet.name,
          owner: fleet.owner
        });
        if (existingFleet) {
          console.log(`Skipping existing fleet: ${fleet.name} owned by ${fleet.owner}`);
          skipped++;
          continue;
        }

        // Find the game ObjectId
        const game = await Game.findOne({
          seriesId: fleet.series_id,
          gameNumber: fleet.game_number
        });
        if (!game) {
          console.log(`Game not found for fleet ${fleet.name} in game ${fleet.game_number}, skipping`);
          errors++;
          continue;
        }

        // Find the player ObjectId
        const player = await Player.findOne({
          gameId: game._id,
          empireName: fleet.owner
        });
        if (!player) {
          console.log(`Player not found for fleet ${fleet.name} owned by ${fleet.owner}, skipping`);
          errors++;
          continue;
        }

        // Convert MySQL data to MongoDB format
        const fleetData = {
          gameId: game._id,
          seriesId: game.seriesId,
          gameNumber: fleet.game_number,

          // Identity
          name: fleet.name,
          owner: fleet.owner,
          playerId: player._id,

          // State
          collapsed: fleet.collapsed === '1',
          location: fleet.location,

          // Orders
          orders: fleet.orders || '',
          orderArguments: fleet.order_arguments || ''
        };

        // Create fleet in MongoDB
        const newFleet = new Fleet(fleetData);
        await newFleet.save();

        migrated++;
        console.log(`Migrated fleet: ${fleet.name} owned by ${fleet.owner}`);

      } catch (error) {
        console.error(`Error migrating fleet ${fleet.name}:`, error);
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
  migrateFleets()
    .then(() => {
      console.log('Fleets migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fleets migration failed:', error);
      process.exit(1);
    });
}

export { migrateFleets };