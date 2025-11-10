import mysql from 'mysql2/promise';
import mongoose from 'mongoose';
import { User } from '../models/index.js';
import dotenv from 'dotenv';

dotenv.config();

interface MySQLEmpire {
  id: number;
  name: string;
  auto_update: '1' | '0';
  background_attachment: 'scroll' | 'fixed';
  bridier_delta: number;
  bridier_index: number;
  bridier_rank: number;
  bridier_update: number;
  can_create_custom_series: '1' | '0';
  comment: string;
  custom_bg_url: string | null;
  draw_background: '1' | '0';
  email: string;
  email_visible: '0' | '1';
  icon: string;
  is_admin: '0' | '1';
  join_date: number;
  last_ip: string;
  last_login: number;
  list_ships_by_system: '1' | '0';
  map_origin: string;
  max_economic_power: number;
  max_military_power: number;
  nuked: number;
  nukes: number;
  password: string;
  real_name: string;
  ruined: number;
  show_coordinates: '1' | '0';
  show_icons: '1' | '0';
  tos_accepted: '0' | '1';
  url: string | null;
  validation_info: string;
  wins: number;
}

async function migrateUsers() {
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

    // Get all empires from MySQL
    const [rows] = await mysqlConnection.execute('SELECT * FROM empires ORDER BY id');
    const empires = rows as MySQLEmpire[];

    console.log(`Found ${empires.length} empires to migrate`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const empire of empires) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ name: empire.name });
        if (existingUser) {
          console.log(`Skipping existing user: ${empire.name}`);
          skipped++;
          continue;
        }

        // Convert MySQL data to MongoDB format
        const userData = {
          name: empire.name,
          email: empire.email || '',
          password: empire.password, // Note: This should be hashed in production
          realName: empire.real_name || '',
          isAdmin: empire.is_admin === '1',
          joinDate: new Date(empire.join_date * 1000), // Convert Unix timestamp
          lastLogin: empire.last_login ? new Date(empire.last_login * 1000) : null,
          lastIp: empire.last_ip || '',
          tosAccepted: empire.tos_accepted === '1',
          validationInfo: empire.validation_info || '',

          // Profile settings
          backgroundAttachment: empire.background_attachment,
          drawBackground: empire.draw_background === '1',
          customBgUrl: empire.custom_bg_url || '',
          showCoordinates: empire.show_coordinates === '1',
          showIcons: empire.show_icons === '1',
          listShipsBySystem: empire.list_ships_by_system === '1',
          mapOrigin: empire.map_origin,

          // Game stats
          wins: empire.wins,
          nuked: empire.nuked,
          nukes: empire.nukes,
          ruined: empire.ruined,
          maxEconomicPower: empire.max_economic_power,
          maxMilitaryPower: empire.max_military_power,

          // Bridier ranking system
          bridier: {
            index: empire.bridier_index,
            rank: empire.bridier_rank,
            delta: empire.bridier_delta,
            update: empire.bridier_update ? new Date(empire.bridier_update * 1000) : null
          },

          // Preferences
          canCreateCustomSeries: empire.can_create_custom_series === '1',
          comment: empire.comment || '',
          emailVisible: empire.email_visible === '1',
          icon: empire.icon || 'alien1.gif',
          url: empire.url || ''
        };

        // Create user in MongoDB
        const user = new User(userData);
        await user.save();

        migrated++;
        console.log(`Migrated user: ${empire.name}`);

      } catch (error) {
        console.error(`Error migrating user ${empire.name}:`, error);
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
  migrateUsers()
    .then(() => {
      console.log('User migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('User migration failed:', error);
      process.exit(1);
    });
}

export { migrateUsers };