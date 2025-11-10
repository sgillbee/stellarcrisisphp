import mysql from 'mysql2/promise';
import mongoose from 'mongoose';
import { ScoutingReport, Player } from '../models/index.js';
import dotenv from 'dotenv';

dotenv.config();

interface MySQLScoutingReport {
  id: number;
  player_id: number;
  coordinates: string;
  name: string;
  owner: string;
  agriculture: number;
  fuel: number;
  mineral: number;
  population: number;
  ships: string;
  annihilated: '1' | '0';
  comment: string;
  jumps: string;
}

async function migrateScoutingReports() {
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

    // Get all scouting reports from MySQL
    const [rows] = await mysqlConnection.execute('SELECT * FROM scouting_reports ORDER BY id');
    const mysqlReports = rows as MySQLScoutingReport[];

    console.log(`Found ${mysqlReports.length} scouting reports to migrate`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const report of mysqlReports) {
      try {
        // Check if scouting report already exists
        const existingReport = await ScoutingReport.findOne({
          playerId: report.player_id,
          coordinates: report.coordinates
        });
        if (existingReport) {
          console.log(`Skipping existing scouting report: ${report.coordinates} for player ${report.player_id}`);
          skipped++;
          continue;
        }

        // Find the player ObjectId
        const player = await Player.findOne({ empireName: report.owner });
        if (!player) {
          console.log(`Player not found for scouting report ${report.coordinates} owned by ${report.owner}, skipping`);
          errors++;
          continue;
        }

        // Convert MySQL data to MongoDB format
        const reportData = {
          playerId: player._id,

          // Location
          coordinates: report.coordinates,
          name: report.name,
          owner: report.owner,

          // Resources
          agriculture: report.agriculture,
          fuel: report.fuel,
          mineral: report.mineral,
          population: report.population,

          // Ships
          ships: report.ships || '',

          // State
          annihilated: report.annihilated === '1',
          comment: report.comment || '',
          jumps: report.jumps || ''
        };

        // Create scouting report in MongoDB
        const newReport = new ScoutingReport(reportData);
        await newReport.save();

        migrated++;
        console.log(`Migrated scouting report: ${report.coordinates} (${report.name}) for ${report.owner}`);

      } catch (error) {
        console.error(`Error migrating scouting report ${report.coordinates}:`, error);
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
  migrateScoutingReports()
    .then(() => {
      console.log('Scouting reports migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Scouting reports migration failed:', error);
      process.exit(1);
    });
}

export { migrateScoutingReports };