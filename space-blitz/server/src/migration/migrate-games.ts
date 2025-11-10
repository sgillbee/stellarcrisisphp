import mysql from 'mysql2/promise';
import mongoose from 'mongoose';
import { Game, Series } from '../models/index.js';
import dotenv from 'dotenv';

dotenv.config();

interface MySQLGame {
  id: number;
  series_id: number;
  game_number: number;
  series_name: string;
  status: string;
  phase: string;
  diplomacy: number;
  avg_ag: number;
  avg_fuel: number;
  avg_min: number;
  bridier: number;
  weekend_updates: '1' | '0';
  created_at: number;
  created_by: string;
  last_update: number;
  update_count: number;
  update_time: number;
  password1: string;
  password2: string;
  processing: '1' | '0';
  updating: '1' | '0';
  on_hold: '1' | '0';
  closed: '1' | '0';
  player_count: number;
  max_allies: number;
  version: string;
}

interface MySQLShipTypeOption {
  game_id: number;
  ship_type: string;
  status: string;
  range_multiplier: number | null;
  loss: number | null;
  build_cost: number | null;
  maintenance_cost: number | null;
}

async function migrateGames() {
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

    // Get all games from MySQL
    const [rows] = await mysqlConnection.execute('SELECT * FROM games ORDER BY id');
    const mysqlGames = rows as MySQLGame[];

    console.log(`Found ${mysqlGames.length} games to migrate`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const game of mysqlGames) {
      try {
        // Check if game already exists
        const existingGame = await Game.findOne({
          seriesId: game.series_id,
          gameNumber: game.game_number
        });
        if (existingGame) {
          console.log(`Skipping existing game: ${game.series_name} #${game.game_number}`);
          skipped++;
          continue;
        }

        // Find the series ObjectId
        const series = await Series.findOne({ name: game.series_name });
        if (!series) {
          console.log(`Series not found for game ${game.series_name} #${game.game_number}, skipping`);
          errors++;
          continue;
        }

        // Get ship type options for this game
        const [shipOptionsRows] = await mysqlConnection.execute(
          'SELECT * FROM game_ship_type_options WHERE game_id = ?',
          [game.id]
        );
        const shipTypeOptions = (shipOptionsRows as MySQLShipTypeOption[]).map(option => ({
          shipType: option.ship_type,
          status: option.status,
          rangeMultiplier: option.range_multiplier || 1.0,
          loss: option.loss || 0.0,
          buildCost: option.build_cost || 0,
          maintenanceCost: option.maintenance_cost || 0
        }));

        // Convert MySQL data to MongoDB format
        const gameData = {
          seriesId: series._id,
          gameNumber: game.game_number,
          seriesName: game.series_name,

          // Game state
          status: game.status || 'active',
          phase: game.phase || 'setup',

          // Game settings
          diplomacy: game.diplomacy,
          avgAg: game.avg_ag,
          avgFuel: game.avg_fuel,
          avgMin: game.avg_min,
          bridier: game.bridier,
          weekendUpdates: game.weekend_updates === '1',

          // Game metadata
          createdAt: new Date(game.created_at * 1000),
          createdBy: game.created_by,
          lastUpdate: game.last_update ? new Date(game.last_update * 1000) : null,
          updateCount: game.update_count,
          updateTime: game.update_time,

          // Passwords for joining
          password1: game.password1 || '',
          password2: game.password2 || '',

          // Current state
          processing: game.processing === '1',
          updating: game.updating === '1',
          onHold: game.on_hold === '1',
          closed: game.closed === '1',

          // Player management
          playerCount: game.player_count,
          maxAllies: game.max_allies,

          // Version info
          version: game.version || 'v2',

          // Embedded collections (will be populated later)
          players: [],
          systems: [],

          // Ship type options specific to this game
          shipTypeOptions: shipTypeOptions
        };

        // Create game in MongoDB
        const newGame = new Game(gameData);
        await newGame.save();

        migrated++;
        console.log(`Migrated game: ${game.series_name} #${game.game_number}`);

      } catch (error) {
        console.error(`Error migrating game ${game.series_name} #${game.game_number}:`, error);
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
  migrateGames()
    .then(() => {
      console.log('Games migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Games migration failed:', error);
      process.exit(1);
    });
}

export { migrateGames };