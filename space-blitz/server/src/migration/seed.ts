import mongoose from 'mongoose';
import { User, Series, Game, Player, System, Ship, Fleet } from '../models/index.js';
import dotenv from 'dotenv';

dotenv.config();

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/space-blitz');
    console.log('Connected to MongoDB for seeding');

    // Clear existing data (optional - comment out for production)
    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Series.deleteMany({}),
      Game.deleteMany({}),
      Player.deleteMany({}),
      System.deleteMany({}),
      Ship.deleteMany({}),
      Fleet.deleteMany({})
    ]);

    // Seed users
    console.log('Seeding users...');
    const users = await User.insertMany([
      {
        name: 'Admin',
        email: 'admin@stellarcrisis.com',
        password: 'admin123', // In production, this should be hashed
        realName: 'Administrator',
        isAdmin: true,
        joinDate: new Date(),
        tosAccepted: true,
        wins: 0,
        nuked: 0,
        nukes: 0,
        ruined: 0,
        maxEconomicPower: 0,
        maxMilitaryPower: 0,
        bridier: {
          index: 500,
          rank: 500,
          delta: 0,
          update: null
        },
        canCreateCustomSeries: true,
        icon: 'alien1.gif'
      },
      {
        name: 'TestPlayer1',
        email: 'player1@test.com',
        password: 'test123',
        realName: 'Test Player One',
        isAdmin: false,
        joinDate: new Date(),
        tosAccepted: true,
        wins: 5,
        nuked: 0,
        nukes: 2,
        ruined: 0,
        maxEconomicPower: 1500,
        maxMilitaryPower: 800,
        bridier: {
          index: 520,
          rank: 520,
          delta: 15,
          update: new Date()
        },
        canCreateCustomSeries: false,
        icon: 'alien2.gif'
      },
      {
        name: 'TestPlayer2',
        email: 'player2@test.com',
        password: 'test123',
        realName: 'Test Player Two',
        isAdmin: false,
        joinDate: new Date(),
        tosAccepted: true,
        wins: 3,
        nuked: 1,
        nukes: 1,
        ruined: 0,
        maxEconomicPower: 1200,
        maxMilitaryPower: 600,
        bridier: {
          index: 480,
          rank: 480,
          delta: -20,
          update: new Date()
        },
        canCreateCustomSeries: false,
        icon: 'alien3.gif'
      }
    ]);

    // Seed series
    console.log('Seeding series...');
    const series = await Series.insertMany([
      {
        name: 'Test Series',
        gameType: 'v2',
        creator: 'Admin',
        custom: false,
        diplomacy: 2,
        averageResources: 30,
        avgAg: 30,
        avgFuel: 30,
        avgMin: 30,
        techMultiple: 0,
        updateTime: 86400, // 24 hours
        weekendUpdates: true,
        maxPlayers: 4,
        maxWins: -1,
        minWins: 0,
        systemsPerPlayer: 8,
        teamGame: false,
        mapType: 'standard',
        mapCompression: 0.001,
        mapVisible: false,
        bridierAllowed: true,
        buildCloakersCloaked: false,
        cloakersAsAttacks: false,
        visibleBuilds: false,
        canDraw: false,
        canSurrender: false,
        halted: false,
        gameCount: 1,
        shipTypeOptions: []
      }
    ]);

    // Seed games
    console.log('Seeding games...');
    const games = await Game.insertMany([
      {
        seriesId: series[0]._id,
        gameNumber: 1,
        seriesName: 'Test Series',
        status: 'active',
        phase: 'active',
        diplomacy: 2,
        avgAg: 30,
        avgFuel: 30,
        avgMin: 30,
        bridier: -1,
        weekendUpdates: true,
        createdBy: 'Admin',
        lastUpdate: new Date(),
        updateCount: 5,
        updateTime: 86400,
        playerCount: 2,
        processing: false,
        updating: false,
        onHold: false,
        closed: false,
        version: 'v2.0',
        players: [],
        systems: [],
        shipTypeOptions: []
      }
    ]);

    // Seed players
    console.log('Seeding players...');
    const players = await Player.insertMany([
      {
        gameId: games[0]._id,
        seriesId: series[0]._id,
        gameNumber: 1,
        seriesName: 'Test Series',
        empireName: 'TestPlayer1',
        empireId: users[1]._id,
        agriculture: 150,
        fuel: 120,
        mineral: 180,
        population: 45,
        agricultureRatio: 1.0,
        fuelRatio: 0.8,
        mineralRatio: 1.2,
        economicPower: 1200,
        militaryPower: 600,
        maintenance: 50,
        build: 100,
        fuelUse: 10,
        techLevel: 2.5,
        techDevelopment: 15.0,
        techs: '{"weapons": 2, "shields": 3}',
        endedTurn: false,
        lastUpdate: 5,
        tradedIn: 0,
        team: 0,
        teamSpot: '',
        mapOrigin: '0,0',
        maxPopulation: 50,
        notes: 'Test empire notes',
        ip: '127.0.0.1',
        lastAccess: new Date()
      },
      {
        gameId: games[0]._id,
        seriesId: series[0]._id,
        gameNumber: 1,
        seriesName: 'Test Series',
        empireName: 'TestPlayer2',
        empireId: users[2]._id,
        agriculture: 130,
        fuel: 140,
        mineral: 160,
        population: 42,
        agricultureRatio: 1.1,
        fuelRatio: 0.9,
        mineralRatio: 1.0,
        economicPower: 1000,
        militaryPower: 500,
        maintenance: 45,
        build: 80,
        fuelUse: 8,
        techLevel: 2.2,
        techDevelopment: 12.0,
        techs: '{"weapons": 3, "shields": 2}',
        endedTurn: true,
        lastUpdate: 5,
        tradedIn: 1,
        team: 0,
        teamSpot: '',
        mapOrigin: '0,0',
        maxPopulation: 48,
        notes: 'Another test empire',
        ip: '127.0.0.1',
        lastAccess: new Date()
      }
    ]);

    // Update game with player references
    await Game.findByIdAndUpdate(games[0]._id, {
      players: players.map(p => p._id)
    });

    // Seed systems
    console.log('Seeding systems...');
    const systems = await System.insertMany([
      {
        gameId: games[0]._id,
        seriesId: series[0]._id,
        gameNumber: 1,
        coordinates: '0,0',
        name: 'Sol',
        agriculture: 25,
        fuel: 20,
        mineral: 30,
        population: 15,
        maxPopulation: 50,
        owner: 'TestPlayer1',
        playerNumber: 1,
        systemActive: true,
        annihilated: false,
        homeworld: 'TestPlayer1',
        jumps: '1,0;0,1;-1,0;0,-1'
      },
      {
        gameId: games[0]._id,
        seriesId: series[0]._id,
        gameNumber: 1,
        coordinates: '1,0',
        name: 'Alpha Centauri',
        agriculture: 15,
        fuel: 35,
        mineral: 20,
        population: 0,
        maxPopulation: 30,
        owner: '',
        playerNumber: 0,
        systemActive: true,
        annihilated: false,
        homeworld: '',
        jumps: '0,0;2,0;1,1'
      },
      {
        gameId: games[0]._id,
        seriesId: series[0]._id,
        gameNumber: 1,
        coordinates: '0,1',
        name: 'Sirius',
        agriculture: 20,
        fuel: 25,
        mineral: 25,
        population: 0,
        maxPopulation: 35,
        owner: '',
        playerNumber: 0,
        systemActive: true,
        annihilated: false,
        homeworld: '',
        jumps: '0,0;1,1;0,2'
      }
    ]);

    // Update game with system references
    await Game.findByIdAndUpdate(games[0]._id, {
      systems: systems.map(s => s._id)
    });

    // Seed ships
    console.log('Seeding ships...');
    await Ship.insertMany([
      {
        gameId: games[0]._id,
        seriesId: series[0]._id,
        gameNumber: 1,
        name: 'Colony Ship 1',
        type: 'Colony',
        owner: 'TestPlayer1',
        playerId: players[0]._id,
        location: 'Sol',
        br: 0,
        maxBr: 0,
        buildCost: 20,
        maintenanceCost: 1,
        fuelCost: 5,
        cloaked: false,
        orders: '',
        orderArguments: ''
      },
      {
        gameId: games[0]._id,
        seriesId: series[0]._id,
        gameNumber: 1,
        name: 'Attack Ship 1',
        type: 'Attack',
        owner: 'TestPlayer1',
        playerId: players[0]._id,
        location: 'Sol',
        br: 10,
        maxBr: 10,
        buildCost: 15,
        maintenanceCost: 2,
        fuelCost: 3,
        cloaked: false,
        orders: '',
        orderArguments: ''
      }
    ]);

    // Seed fleets
    console.log('Seeding fleets...');
    await Fleet.insertMany([
      {
        gameId: games[0]._id,
        seriesId: series[0]._id,
        gameNumber: 1,
        name: 'Main Fleet',
        owner: 'TestPlayer1',
        playerId: players[0]._id,
        collapsed: false,
        location: 'Sol',
        orders: '',
        orderArguments: ''
      }
    ]);

    console.log('✅ Database seeding completed successfully!');
    console.log(`Created:`);
    console.log(`- ${users.length} users`);
    console.log(`- ${series.length} series`);
    console.log(`- ${games.length} games`);
    console.log(`- ${players.length} players`);
    console.log(`- ${systems.length} systems`);
    console.log(`- Ships and fleets created`);

  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
  }
}

// Run seeding if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      console.log('Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

export { seedDatabase };