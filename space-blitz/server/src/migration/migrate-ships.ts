import mysql from 'mysql2/promise';
import mongoose from 'mongoose';
import { Ship, Game, Player } from '../models/index.js';
import dotenv from 'dotenv';

dotenv.config();

interface MySQLShip {
  id: number;
  game_id: number;
  series_id: number;
  game_number: number;
  name: string;
  type: string;
  owner: string;
  player_id: number;
  location: string;
  fleet_id: number | null;
  br: number;
  max_br: number;
  build_cost: number;
  maintenance_cost: number;
  fuel_cost: number;
  cloaked: '1' | '0';
  orders: string;
  order_arguments: string;
}

async function migrateShips() {
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

    // Get all ships from MySQL
    const [rows] = await mysqlConnection.execute('SELECT * FROM ships ORDER BY id');
    const mysqlShips = rows as MySQLShip[];

    console.log(`Found ${mysqlShips.length} ships to migrate`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const ship of mysqlShips) {
      try {
        // Check if ship already exists
        const existingShip = await Ship.findOne({
          gameId: ship.game_id,
          name: ship.name,
          owner: ship.owner
        });
        if (existingShip) {
          console.log(`Skipping existing ship: ${ship.name} owned by ${ship.owner}`);
          skipped++;
          continue;
        }

        // Find the game ObjectId
        const game = await Game.findOne({
          seriesId: ship.series_id,
          gameNumber: ship.game_number
        });
        if (!game) {
          console.log(`Game not found for ship ${ship.name} in game ${ship.game_number}, skipping`);
          errors++;
          continue;
        }

        // Find the player ObjectId
        const player = await Player.findOne({
          gameId: game._id,
          empireName: ship.owner
        });
        if (!player) {
          console.log(`Player not found for ship ${ship.name} owned by ${ship.owner}, skipping`);
          errors++;
          continue;
        }

        // Convert MySQL data to MongoDB format
        const shipData = {
          gameId: game._id,
          seriesId: game.seriesId,
          gameNumber: ship.game_number,

          // Identity
          name: ship.name,
          type: ship.type,
          owner: ship.owner,
          playerId: player._id,

          // Location
          location: ship.location,

          // Fleet membership (will be set later if fleet exists)
          fleetId: ship.fleet_id ? ship.fleet_id : null,

          // Combat stats
          br: ship.br,
          maxBr: ship.max_br,

          // Costs
          buildCost: ship.build_cost,
          maintenanceCost: ship.maintenance_cost,
          fuelCost: ship.fuel_cost,

          // State
          cloaked: ship.cloaked === '1',

          // Orders
          orders: ship.orders || '',
          orderArguments: ship.order_arguments || ''
        };

        // Create ship in MongoDB
        const newShip = new Ship(shipData);
        await newShip.save();

        migrated++;
        console.log(`Migrated ship: ${ship.name} (${ship.type}) owned by ${ship.owner}`);

      } catch (error) {
        console.error(`Error migrating ship ${ship.name}:`, error);
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
  migrateShips()
    .then(() => {
      console.log('Ships migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Ships migration failed:', error);
      process.exit(1);
    });
}

export { migrateShips };