import mysql from 'mysql2/promise';
import mongoose from 'mongoose';
import { Invitation, Game } from '../models/index.js';
import dotenv from 'dotenv';

dotenv.config();

interface MySQLInvitation {
  id: number;
  game_id: number;
  series_id: number;
  game_number: number;
  empire: string;
  message: string;
  status: string;
  team: number;
}

async function migrateInvitations() {
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

    // Get all invitations from MySQL
    const [rows] = await mysqlConnection.execute('SELECT * FROM invitations ORDER BY id');
    const mysqlInvitations = rows as MySQLInvitation[];

    console.log(`Found ${mysqlInvitations.length} invitations to migrate`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const invitation of mysqlInvitations) {
      try {
        // Check if invitation already exists
        const existingInvitation = await Invitation.findOne({
          gameId: invitation.game_id,
          empire: invitation.empire
        });
        if (existingInvitation) {
          console.log(`Skipping existing invitation: ${invitation.empire} for game ${invitation.game_number}`);
          skipped++;
          continue;
        }

        // Find the game ObjectId
        const game = await Game.findOne({
          seriesId: invitation.series_id,
          gameNumber: invitation.game_number
        });
        if (!game) {
          console.log(`Game not found for invitation ${invitation.empire} in game ${invitation.game_number}, skipping`);
          errors++;
          continue;
        }

        // Convert MySQL data to MongoDB format
        const invitationData = {
          gameId: game._id,
          seriesId: game.seriesId,
          gameNumber: invitation.game_number,

          // Invitation details
          empire: invitation.empire,
          message: invitation.message || '',
          status: invitation.status,
          team: invitation.team
        };

        // Create invitation in MongoDB
        const newInvitation = new Invitation(invitationData);
        await newInvitation.save();

        migrated++;
        console.log(`Migrated invitation: ${invitation.empire} for game ${invitation.game_number}`);

      } catch (error) {
        console.error(`Error migrating invitation ${invitation.empire}:`, error);
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
  migrateInvitations()
    .then(() => {
      console.log('Invitations migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Invitations migration failed:', error);
      process.exit(1);
    });
}

export { migrateInvitations };