import mysql from 'mysql2/promise';
import mongoose from 'mongoose';
import { Series } from '../models/index.js';
import dotenv from 'dotenv';

dotenv.config();

interface MySQLSeries {
  id: number;
  name: string;
  game_type: string;
  average_resources: number;
  avg_ag: number;
  avg_fuel: number;
  avg_min: number;
  bridier_allowed: '1' | '0';
  build_cloakers_cloaked: '1' | '0';
  can_draw: '1' | '0';
  can_surrender: '1' | '0';
  cloakers_as_attacks: '1' | '0';
  creator: string;
  custom: '0' | '1';
  diplomacy: number;
  game_count: number;
  halted: '1' | '0';
  map_compression: number;
  map_type: string;
  map_visible: '0' | '1';
  max_players: number;
  max_wins: number;
  min_wins: number;
  systems_per_player: number;
  team_game: '1' | '0';
  tech_multiple: number;
  update_time: number;
  visible_builds: '1' | '0';
  weekend_updates: '1' | '0';
}

interface MySQLShipTypeOption {
  series_id: number;
  ship_type: string;
  status: string;
  range_multiplier: number | null;
  loss: number | null;
  build_cost: number | null;
  maintenance_cost: number | null;
}

async function migrateSeries() {
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

    // Get all series from MySQL
    const [rows] = await mysqlConnection.execute('SELECT * FROM series ORDER BY id');
    const mysqlSeries = rows as MySQLSeries[];

    console.log(`Found ${mysqlSeries.length} series to migrate`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const series of mysqlSeries) {
      try {
        // Check if series already exists
        const existingSeries = await Series.findOne({ name: series.name });
        if (existingSeries) {
          console.log(`Skipping existing series: ${series.name}`);
          skipped++;
          continue;
        }

        // Get ship type options for this series
        const [shipOptionsRows] = await mysqlConnection.execute(
          'SELECT * FROM series_ship_type_options WHERE series_id = ?',
          [series.id]
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
        const seriesData = {
          name: series.name,
          gameType: series.game_type || 'v2',
          creator: series.creator,
          custom: series.custom === '1',

          // Game settings
          diplomacy: series.diplomacy,
          averageResources: series.average_resources,
          avgAg: series.avg_ag,
          avgFuel: series.avg_fuel,
          avgMin: series.avg_min,
          techMultiple: series.tech_multiple,
          updateTime: series.update_time,
          weekendUpdates: series.weekend_updates === '1',

          // Series configuration
          maxPlayers: series.max_players,
          maxWins: series.max_wins,
          minWins: series.min_wins,
          systemsPerPlayer: series.systems_per_player,
          teamGame: series.team_game === '1',
          mapType: series.map_type,
          mapCompression: series.map_compression,
          mapVisible: series.map_visible === '1',
          bridierAllowed: series.bridier_allowed === '1',

          // Build settings
          buildCloakersCloaked: series.build_cloakers_cloaked === '1',
          cloakersAsAttacks: series.cloakers_as_attacks === '1',
          visibleBuilds: series.visible_builds === '1',

          // Game end conditions
          canDraw: series.can_draw === '1',
          canSurrender: series.can_surrender === '1',

          // Status
          halted: series.halted === '1',
          gameCount: series.game_count,

          // Ship type options
          shipTypeOptions: shipTypeOptions
        };

        // Create series in MongoDB
        const newSeries = new Series(seriesData);
        await newSeries.save();

        migrated++;
        console.log(`Migrated series: ${series.name}`);

      } catch (error) {
        console.error(`Error migrating series ${series.name}:`, error);
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
  migrateSeries()
    .then(() => {
      console.log('Series migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Series migration failed:', error);
      process.exit(1);
    });
}

export { migrateSeries };