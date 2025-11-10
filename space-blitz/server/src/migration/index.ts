#!/usr/bin/env node

import { migrateUsers } from './migrate-users.js';
import { migrateSeries } from './migrate-series.js';
import { migrateGames } from './migrate-games.js';
import { migratePlayers } from './migrate-players.js';
import { migrateSystems } from './migrate-systems.js';
import { migrateShips } from './migrate-ships.js';
import { migrateFleets } from './migrate-fleets.js';
import { migrateMessages } from './migrate-messages.js';
import { migrateDiplomacies } from './migrate-diplomacies.js';
import { migrateScoutingReports } from './migrate-scouting-reports.js';
import { migrateExplored } from './migrate-explored.js';
import { migrateHistory } from './migrate-history.js';
import { migrateTournaments } from './migrate-tournaments.js';
import { migrateGameLog } from './migrate-game-log.js';
import { migrateBridierRankings } from './migrate-bridier-rankings.js';
import { migrateInvitations } from './migrate-invitations.js';
import dotenv from 'dotenv';

dotenv.config();

async function runMigrations() {
  console.log('Starting Stellar Crisis database migration...');
  console.log('==========================================\n');

  try {
    // Migrate users first (needed for references)
    console.log('Phase 1: Migrating users...');
    await migrateUsers();
    console.log('✓ Users migration completed\n');

    // Migrate series
    console.log('Phase 2: Migrating series...');
    await migrateSeries();
    console.log('✓ Series migration completed\n');

    // Migrate games
    console.log('Phase 3: Migrating games...');
    await migrateGames();
    console.log('✓ Games migration completed\n');

    // Migrate players
    console.log('Phase 4: Migrating players...');
    await migratePlayers();
    console.log('✓ Players migration completed\n');

    // Migrate systems
    console.log('Phase 5: Migrating systems...');
    await migrateSystems();
    console.log('✓ Systems migration completed\n');

    // Migrate ships
    console.log('Phase 6: Migrating ships...');
    await migrateShips();
    console.log('✓ Ships migration completed\n');

    // Migrate fleets
    console.log('Phase 7: Migrating fleets...');
    await migrateFleets();
    console.log('✓ Fleets migration completed\n');

    // Migrate messages
    console.log('Phase 8: Migrating messages...');
    await migrateMessages();
    console.log('✓ Messages migration completed\n');

    // Migrate diplomacies
    console.log('Phase 9: Migrating diplomacies...');
    await migrateDiplomacies();
    console.log('✓ Diplomacies migration completed\n');

    // Migrate scouting reports
    console.log('Phase 10: Migrating scouting reports...');
    await migrateScoutingReports();
    console.log('✓ Scouting reports migration completed\n');

    // Migrate explored
    console.log('Phase 11: Migrating explored...');
    await migrateExplored();
    console.log('✓ Explored migration completed\n');

    // Migrate history
    console.log('Phase 12: Migrating history...');
    await migrateHistory();
    console.log('✓ History migration completed\n');

    // Migrate tournaments
    console.log('Phase 13: Migrating tournaments...');
    await migrateTournaments();
    console.log('✓ Tournaments migration completed\n');

    // Migrate game logs
    console.log('Phase 14: Migrating game logs...');
    await migrateGameLog();
    console.log('✓ Game logs migration completed\n');

    // Migrate bridier rankings
    console.log('Phase 15: Migrating bridier rankings...');
    await migrateBridierRankings();
    console.log('✓ Bridier rankings migration completed\n');

    // Migrate invitations
    console.log('Phase 16: Migrating invitations...');
    await migrateInvitations();
    console.log('✓ Invitations migration completed\n');

    console.log('==========================================');
    console.log('🎉 All migrations completed successfully!');
    console.log('==========================================');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migrations if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations();
}

export { runMigrations };