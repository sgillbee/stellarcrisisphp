import mysql from 'mysql2/promise';
import mongoose from 'mongoose';
import { Message, Player, User } from '../models/index.js';
import dotenv from 'dotenv';

dotenv.config();

interface MySQLMessage {
  id: number;
  text: string;
  type: string;
  time: number;
  sender: string;
  recipient: string;
  player_id: number | null;
  empire_id: number | null;
  flag: '1' | '0';
}

async function migrateMessages() {
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

    // Get all messages from MySQL
    const [rows] = await mysqlConnection.execute('SELECT * FROM messages ORDER BY id');
    const mysqlMessages = rows as MySQLMessage[];

    console.log(`Found ${mysqlMessages.length} messages to migrate`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const message of mysqlMessages) {
      try {
        // Check if message already exists (using a combination of fields as unique identifier)
        const existingMessage = await Message.findOne({
          text: message.text,
          time: new Date(message.time * 1000),
          sender: message.sender
        });
        if (existingMessage) {
          console.log(`Skipping existing message from ${message.sender} at ${message.time}`);
          skipped++;
          continue;
        }

        // Find the player ObjectId if it exists
        let playerId = null;
        if (message.player_id) {
          const player = await Player.findOne({ empireName: message.sender });
          if (player) {
            playerId = player._id;
          }
        }

        // Find the empire ObjectId if it exists
        let empireId = null;
        if (message.empire_id) {
          const user = await User.findOne({ name: message.sender });
          if (user) {
            empireId = user._id;
          }
        }

        // Convert MySQL data to MongoDB format
        const messageData = {
          // Content
          text: message.text,
          type: message.type,

          // Metadata
          time: new Date(message.time * 1000),
          sender: message.sender,
          recipient: message.recipient,

          // References
          playerId: playerId,
          empireId: empireId,

          // State
          flag: message.flag === '1'
        };

        // Create message in MongoDB
        const newMessage = new Message(messageData);
        await newMessage.save();

        migrated++;
        if (migrated % 100 === 0) {
          console.log(`Migrated ${migrated} messages...`);
        }

      } catch (error) {
        console.error(`Error migrating message from ${message.sender}:`, error);
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
  migrateMessages()
    .then(() => {
      console.log('Messages migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Messages migration failed:', error);
      process.exit(1);
    });
}

export { migrateMessages };