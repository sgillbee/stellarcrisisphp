import mysql from 'mysql2/promise';
import mongoose from 'mongoose';
import { Tournament, User, Game } from '../models/index.js';
import dotenv from 'dotenv';

dotenv.config();

interface MySQLTournament {
  id: number;
  name: string;
  description: string;
  series_id: number;
  completed: '1' | '0';
  start_time: number;
}

interface MySQLTournamentEntrant {
  id: number;
  tournament_id: number;
  empire_id: number;
  eliminated: '1' | '0';
  byes: number;
}

interface MySQLTournamentGame {
  id: number;
  tournament_id: number;
  game_id: number;
  round: number;
  first_empire: string;
  second_empire: string;
  winner: number | null;
}

async function migrateTournaments() {
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

    // Get all tournaments from MySQL
    const [tournamentRows] = await mysqlConnection.execute('SELECT * FROM tournament ORDER BY id');
    const mysqlTournaments = tournamentRows as MySQLTournament[];

    console.log(`Found ${mysqlTournaments.length} tournaments to migrate`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const tournament of mysqlTournaments) {
      try {
        // Check if tournament already exists
        const existingTournament = await Tournament.findOne({ name: tournament.name });
        if (existingTournament) {
          console.log(`Skipping existing tournament: ${tournament.name}`);
          skipped++;
          continue;
        }

        // Get entrants for this tournament
        const [entrantRows] = await mysqlConnection.execute(
          'SELECT * FROM tournamententrant WHERE tournament_id = ?',
          [tournament.id]
        );
        const entrants = (entrantRows as MySQLTournamentEntrant[]).map(async (entrant) => {
          const user = await User.findOne({ _id: entrant.empire_id });
          return {
            empireId: user ? user._id : entrant.empire_id,
            empireName: user ? user.name : `Empire ${entrant.empire_id}`,
            eliminated: entrant.eliminated === '1',
            byes: entrant.byes
          };
        });

        // Get games for this tournament
        const [gameRows] = await mysqlConnection.execute(
          'SELECT * FROM tournamentgame WHERE tournament_id = ?',
          [tournament.id]
        );
        const games = (gameRows as MySQLTournamentGame[]).map(async (game) => {
          const mongoGame = await Game.findOne({ _id: game.game_id });
          return {
            gameId: mongoGame ? mongoGame._id : game.game_id,
            round: game.round,
            firstEmpire: game.first_empire,
            secondEmpire: game.second_empire,
            winner: game.winner ? game.winner : null
          };
        });

        // Wait for all async operations
        const entrantsData = await Promise.all(entrants);
        const gamesData = await Promise.all(games);

        // Convert MySQL data to MongoDB format
        const tournamentData = {
          name: tournament.name,
          description: tournament.description || '',
          seriesId: tournament.series_id,

          // Status
          completed: tournament.completed === '1',
          startTime: tournament.start_time ? new Date(tournament.start_time * 1000) : new Date(),

          // Participants
          entrants: entrantsData,

          // Games
          games: gamesData
        };

        // Create tournament in MongoDB
        const newTournament = new Tournament(tournamentData);
        await newTournament.save();

        migrated++;
        console.log(`Migrated tournament: ${tournament.name}`);

      } catch (error) {
        console.error(`Error migrating tournament ${tournament.name}:`, error);
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
  migrateTournaments()
    .then(() => {
      console.log('Tournaments migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Tournaments migration failed:', error);
      process.exit(1);
    });
}

export { migrateTournaments };