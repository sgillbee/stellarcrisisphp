import mysql from 'mysql2/promise';
import mongoose from 'mongoose';
import { System, Game } from '../models/index.js';
import dotenv from 'dotenv';

dotenv.config();

interface MySQLSystem {
  id: number;
  game_id: number;
  series_id: number;
  game_number: number;
  coordinates: string;
  name: string;
  agriculture: number;
  fuel: number;
  mineral: number;
  population: number;
  max_population: number;
  owner: string;
  player_number: number;
  system_active: '1' | '0';
  annihilated: '1' | '0';
  homeworld: string;
  jumps: string;
}

async function migrateSystems() {
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

    // Get all systems from MySQL
    const [rows] = await mysqlConnection.execute('SELECT * FROM systems ORDER BY id');
    const mysqlSystems = rows as MySQLSystem[];

    console.log(`Found ${mysqlSystems.length} systems to migrate`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const system of mysqlSystems) {
      try {
        // Check if system already exists
        const existingSystem = await System.findOne({
          gameId: system.game_id,
          coordinates: system.coordinates
        });
        if (existingSystem) {
          console.log(`Skipping existing system: ${system.coordinates} in game ${system.game_number}`);
          skipped++;
          continue;
        }

        // Find the game ObjectId
        const game = await Game.findOne({
          seriesId: system.series_id,
          gameNumber: system.game_number
        });
        if (!game) {
          console.log(`Game not found for system ${system.coordinates} in game ${system.game_number}, skipping`);
          errors++;
          continue;
        }

        // Convert MySQL data to MongoDB format
        const systemData = {
          gameId: game._id,
          seriesId: game.seriesId,
          gameNumber: system.game_number,

          // Location
          coordinates: system.coordinates,
          name: system.name,

          // Resources
          agriculture: system.agriculture,
          fuel: system.fuel,
          mineral: system.mineral,

          // Population
          population: system.population,
          maxPopulation: system.max_population,

          // Ownership
          owner: system.owner || '',
          playerNumber: system.player_number,

          // State
          systemActive: system.system_active === '1',
          annihilated: system.annihilated === '1',

          // Homeworld info
          homeworld: system.homeworld || '',

          // Jump connections
          jumps: system.jumps || ''
        };

        // Create system in MongoDB
        const newSystem = new System(systemData);
        await newSystem.save();

        migrated++;
        console.log(`Migrated system: ${system.coordinates} (${system.name}) in game ${system.game_number}`);

      } catch (error) {
        console.error(`Error migrating system ${system.coordinates}:`, error);
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
  migrateSystems()
    .then(() => {
      console.log('Systems migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Systems migration failed:', error);
      process.exit(1);
    });
}

export { migrateSystems };