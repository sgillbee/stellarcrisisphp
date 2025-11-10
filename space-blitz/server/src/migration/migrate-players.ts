import mysql from 'mysql2/promise';
import mongoose from 'mongoose';
import { Player, Game, User } from '../models/index.js';
import dotenv from 'dotenv';

dotenv.config();

interface MySQLPlayer {
  id: number;
  game_id: number;
  series_id: number;
  game_number: number;
  series_name: string;
  empire_name: string;
  empire_id: number;
  agriculture: number;
  fuel: number;
  mineral: number;
  population: number;
  agriculture_ratio: number;
  fuel_ratio: number;
  mineral_ratio: number;
  economic_power: number;
  military_power: number;
  maintenance: number;
  build: number;
  fuel_use: number;
  tech_level: number;
  tech_development: number;
  techs: string;
  ended_turn: '1' | '0';
  last_update: number;
  traded_in: number;
  team: number;
  team_spot: string;
  map_origin: string;
  max_population: number;
  notes: string;
  ip: string;
  last_access: number;
}

async function migratePlayers() {
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

    // Get all players from MySQL
    const [rows] = await mysqlConnection.execute('SELECT * FROM players ORDER BY id');
    const mysqlPlayers = rows as MySQLPlayer[];

    console.log(`Found ${mysqlPlayers.length} players to migrate`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const player of mysqlPlayers) {
      try {
        // Check if player already exists
        const existingPlayer = await Player.findOne({
          gameId: player.game_id,
          empireName: player.empire_name
        });
        if (existingPlayer) {
          console.log(`Skipping existing player: ${player.empire_name} in game ${player.game_number}`);
          skipped++;
          continue;
        }

        // Find the game ObjectId
        const game = await Game.findOne({
          seriesId: player.series_id,
          gameNumber: player.game_number
        });
        if (!game) {
          console.log(`Game not found for player ${player.empire_name} in ${player.series_name} #${player.game_number}, skipping`);
          errors++;
          continue;
        }

        // Find the user ObjectId
        const user = await User.findOne({ name: player.empire_name });
        if (!user) {
          console.log(`User not found for player ${player.empire_name}, skipping`);
          errors++;
          continue;
        }

        // Convert MySQL data to MongoDB format
        const playerData = {
          gameId: game._id,
          seriesId: game.seriesId,
          gameNumber: player.game_number,
          seriesName: player.series_name,

          // Player identity
          empireName: player.empire_name,
          empireId: user._id,

          // Resources
          agriculture: player.agriculture,
          fuel: player.fuel,
          mineral: player.mineral,
          population: player.population,

          // Ratios
          agricultureRatio: player.agriculture_ratio,
          fuelRatio: player.fuel_ratio,
          mineralRatio: player.mineral_ratio,

          // Economic state
          economicPower: player.economic_power,
          militaryPower: player.military_power,
          maintenance: player.maintenance,
          build: player.build,
          fuelUse: player.fuel_use,

          // Technology
          techLevel: player.tech_level,
          techDevelopment: player.tech_development,
          techs: player.techs || '',

          // Game state
          endedTurn: player.ended_turn === '1',
          lastUpdate: player.last_update,
          tradedIn: player.traded_in,

          // Team information
          team: player.team,
          teamSpot: player.team_spot,

          // UI preferences
          mapOrigin: player.map_origin,
          maxPopulation: player.max_population,
          notes: player.notes || '',

          // Network info
          ip: player.ip || '',
          lastAccess: player.last_access ? new Date(player.last_access * 1000) : null
        };

        // Create player in MongoDB
        const newPlayer = new Player(playerData);
        await newPlayer.save();

        migrated++;
        console.log(`Migrated player: ${player.empire_name} in ${player.series_name} #${player.game_number}`);

      } catch (error) {
        console.error(`Error migrating player ${player.empire_name}:`, error);
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
  migratePlayers()
    .then(() => {
      console.log('Players migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Players migration failed:', error);
      process.exit(1);
    });
}

export { migratePlayers };