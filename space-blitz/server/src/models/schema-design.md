# MongoDB Schema Design for Stellar Crisis

## Overview
This document outlines the MongoDB collection design for migrating from the MySQL-based Stellar Crisis database. The design optimizes for game performance, real-time updates, and complex queries.

## Collection Design

### 1. users (from empires table)
```javascript
{
  _id: ObjectId,
  name: String, // unique empire name
  email: String,
  password: String, // hashed
  realName: String,
  isAdmin: Boolean,
  joinDate: Date,
  lastLogin: Date,
  lastIp: String,
  tosAccepted: Boolean,
  validationInfo: String,

  // Profile settings
  backgroundAttachment: String,
  drawBackground: Boolean,
  customBgUrl: String,
  showCoordinates: Boolean,
  showIcons: Boolean,
  listShipsBySystem: Boolean,
  mapOrigin: String,

  // Game stats
  wins: Number,
  nuked: Number,
  nukes: Number,
  ruined: Number,
  maxEconomicPower: Number,
  maxMilitaryPower: Number,

  // Bridier ranking system
  bridier: {
    index: Number,
    rank: Number,
    delta: Number,
    update: Date
  },

  // Preferences
  canCreateCustomSeries: Boolean,
  comment: String,
  emailVisible: Boolean,
  icon: String,
  url: String,

  createdAt: Date,
  updatedAt: Date
}
```

### 2. series (from series table)
```javascript
{
  _id: ObjectId,
  name: String, // unique
  gameType: String, // 'v2', 'v3'
  creator: String, // empire name
  custom: Boolean,

  // Game settings
  diplomacy: Number, // 0-6 scale
  averageResources: Number,
  avgAg: Number,
  avgFuel: Number,
  avgMin: Number,
  techMultiple: Number,
  updateTime: Number, // seconds
  weekendUpdates: Boolean,

  // Series configuration
  maxPlayers: Number,
  maxWins: Number,
  minWins: Number,
  systemsPerPlayer: Number,
  teamGame: Boolean,
  mapType: String,
  mapCompression: Number,
  mapVisible: Boolean,
  bridierAllowed: Boolean,

  // Build settings
  buildCloakersCloaked: Boolean,
  cloakersAsAttacks: Boolean,
  visibleBuilds: Boolean,

  // Game end conditions
  canDraw: Boolean,
  canSurrender: Boolean,

  // Status
  halted: Boolean,
  gameCount: Number,

  // Ship type options (embedded)
  shipTypeOptions: [{
    shipType: String,
    status: String,
    rangeMultiplier: Number,
    loss: Number,
    buildCost: Number,
    maintenanceCost: Number
  }],

  createdAt: Date,
  updatedAt: Date
}
```

### 3. games (from games table)
```javascript
{
  _id: ObjectId,
  seriesId: ObjectId,
  gameNumber: Number,
  seriesName: String,

  // Game state
  status: String, // 'active', 'completed', 'paused', 'cancelled'
  phase: String, // 'setup', 'active', 'finished'

  // Game settings (inherited from series but can be overridden)
  diplomacy: Number,
  avgAg: Number,
  avgFuel: Number,
  avgMin: Number,
  bridier: Number,
  weekendUpdates: Boolean,

  // Game metadata
  createdAt: Date,
  createdBy: String, // empire name
  lastUpdate: Date,
  updateCount: Number,
  updateTime: Number,

  // Passwords for joining
  password1: String,
  password2: String,

  // Current state
  processing: Boolean,
  updating: Boolean,
  onHold: Boolean,
  closed: Boolean,

  // Player management
  playerCount: Number,
  maxAllies: Number,

  // Version info
  version: String,

  // Embedded collections
  players: [ObjectId], // references to player documents
  systems: [ObjectId], // references to system documents

  // Ship type options specific to this game
  shipTypeOptions: [{
    shipType: String,
    status: String,
    rangeMultiplier: Number,
    loss: Number,
    buildCost: Number,
    maintenanceCost: Number
  }],

  updatedAt: Date
}
```

### 4. players (from players table)
```javascript
{
  _id: ObjectId,
  gameId: ObjectId,
  seriesId: ObjectId,
  gameNumber: Number,
  seriesName: String,

  // Player identity
  empireName: String,
  empireId: ObjectId, // reference to users collection

  // Resources
  agriculture: Number,
  fuel: Number,
  mineral: Number,
  population: Number,

  // Ratios
  agricultureRatio: Number,
  fuelRatio: Number,
  mineralRatio: Number,

  // Economic state
  economicPower: Number,
  militaryPower: Number,
  maintenance: Number,
  build: Number,
  fuelUse: Number,

  // Technology
  techLevel: Number,
  techDevelopment: Number,
  techs: String, // JSON string of tech data

  // Game state
  endedTurn: Boolean,
  lastUpdate: Number,
  tradedIn: Number,

  // Team information
  team: Number,
  teamSpot: String,

  // UI preferences
  mapOrigin: String,
  maxPopulation: Number,
  notes: String,

  // Network info
  ip: String,
  lastAccess: Date,

  createdAt: Date,
  updatedAt: Date
}
```

### 5. systems (from systems table)
```javascript
{
  _id: ObjectId,
  gameId: ObjectId,
  seriesId: ObjectId,
  gameNumber: Number,

  // Location
  coordinates: String, // "x,y" format
  name: String,

  // Resources
  agriculture: Number,
  fuel: Number,
  mineral: Number,

  // Population
  population: Number,
  maxPopulation: Number,

  // Ownership
  owner: String, // empire name
  playerNumber: Number,

  // State
  systemActive: Boolean,
  annihilated: Boolean,

  // Homeworld info
  homeworld: String, // empire name if homeworld

  // Jump connections
  jumps: String, // comma-separated coordinates

  createdAt: Date,
  updatedAt: Date
}
```

### 6. ships (from ships table)
```javascript
{
  _id: ObjectId,
  gameId: ObjectId,
  seriesId: ObjectId,
  gameNumber: Number,

  // Identity
  name: String,
  type: String,
  owner: String, // empire name
  playerId: ObjectId,

  // Location
  location: String, // system name or fleet name

  // Fleet membership
  fleetId: ObjectId,

  // Combat stats
  br: Number, // battle rating
  maxBr: Number,

  // Costs
  buildCost: Number,
  maintenanceCost: Number,
  fuelCost: Number,

  // State
  cloaked: Boolean,

  // Orders
  orders: String,
  orderArguments: String,

  createdAt: Date,
  updatedAt: Date
}
```

### 7. fleets (from fleets table)
```javascript
{
  _id: ObjectId,
  gameId: ObjectId,
  seriesId: ObjectId,
  gameNumber: Number,

  // Identity
  name: String,
  owner: String, // empire name
  playerId: ObjectId,

  // State
  collapsed: Boolean,
  location: String,

  // Orders
  orders: String,
  orderArguments: String,

  createdAt: Date,
  updatedAt: Date
}
```

### 8. messages (from messages table)
```javascript
{
  _id: ObjectId,

  // Content
  text: String,
  type: String, // 'instant', 'motd', 'private', 'broadcast', 'team', 'update', 'scout', 'game_message'

  // Metadata
  time: Date,
  sender: String, // empire name
  recipient: String, // can be multiple recipients

  // References
  playerId: ObjectId,
  empireId: ObjectId,

  // State
  flag: Boolean, // read/unread

  createdAt: Date
}
```

### 9. diplomacies (from diplomacies table)
```javascript
{
  _id: ObjectId,
  gameId: ObjectId,
  seriesId: ObjectId,
  gameNumber: Number,

  // Relationship
  empire: String,
  opponent: String,

  // Status
  offer: Number, // 0-6 scale
  status: Number, // 0-6 scale

  createdAt: Date,
  updatedAt: Date
}
```

### 10. scouting_reports (from scouting_reports table)
```javascript
{
  _id: ObjectId,
  playerId: ObjectId,

  // Location
  coordinates: String,
  name: String,
  owner: String,

  // Resources
  agriculture: Number,
  fuel: Number,
  mineral: Number,
  population: Number,

  // Ships
  ships: String, // JSON string of ship data

  // State
  annihilated: Boolean,
  comment: String,
  jumps: String,

  createdAt: Date,
  updatedAt: Date
}
```

### 11. explored (from explored table)
```javascript
{
  _id: ObjectId,
  playerId: ObjectId,
  gameId: ObjectId,
  seriesId: ObjectId,
  gameNumber: Number,

  // Location
  coordinates: String,
  empire: String,

  // State
  updateExplored: Number,
  fromSharedHq: Boolean,

  createdAt: Date,
  updatedAt: Date
}
```

### 12. history (from history table)
```javascript
{
  _id: ObjectId,
  gameId: ObjectId,

  // Event data
  empire: String,
  coordinates: String,
  event: String,
  info: String,
  updateNo: Number,

  createdAt: Date
}
```

### 13. tournaments (from tournament, tournamententrant, tournamentgame tables)
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  seriesId: ObjectId,

  // Status
  completed: Boolean,
  startTime: Date,

  // Participants
  entrants: [{
    empireId: ObjectId,
    empireName: String,
    eliminated: Boolean,
    byes: Number
  }],

  // Games
  games: [{
    gameId: ObjectId,
    round: Number,
    firstEmpire: String,
    secondEmpire: String,
    winner: ObjectId, // empire ID
  }],

  createdAt: Date,
  updatedAt: Date
}
```

### 14. game_log (from gamelog table)
```javascript
{
  _id: ObjectId,

  // Game info
  name: String,
  result: String, // 'win', 'draw', 'abandoned', 'no winner'
  bridier: Boolean,

  // End state
  endDate: Date,
  empsLeft: String,
  empsNuked: String,

  createdAt: Date
}
```

### 15. bridier_rankings (from bridier table)
```javascript
{
  _id: ObjectId,
  gameId: ObjectId,
  seriesName: String,
  gameNumber: Number,

  // Match data
  empire1: String,
  startingRank1: Number,
  startingIndex1: Number,
  endingRank1: Number,

  empire2: String,
  startingRank2: Number,
  startingIndex2: Number,
  endingRank2: Number,

  // Result
  winner: Number, // 0, 1, or 2
  startTime: Date,
  endTime: Date,

  createdAt: Date
}
```

### 16. invitations (from invitations table)
```javascript
{
  _id: ObjectId,
  gameId: ObjectId,
  seriesId: ObjectId,
  gameNumber: Number,

  // Invitation details
  empire: String,
  message: String,
  status: String, // 'Accepted', 'Declined', 'None'
  team: Number,

  createdAt: Date,
  updatedAt: Date
}
```

## Indexing Strategy

### Performance Indexes
- `users.name`: unique index for empire lookup
- `series.name`: unique index for series lookup
- `games.seriesId, games.gameNumber`: compound index for game lookup
- `players.gameId, players.empireName`: compound index for player lookup
- `systems.gameId, systems.coordinates`: compound index for system lookup
- `ships.gameId, ships.owner`: compound index for ship queries
- `messages.playerId, messages.flag, messages.type`: compound index for message queries
- `history.gameId, history.updateNo`: compound index for history queries

### Text Indexes
- `messages.text`: text index for message search
- `history.info`: text index for event search

## Migration Strategy

1. **Data Export**: Export MySQL data to JSON format
2. **Transform**: Convert MySQL schema to MongoDB documents
3. **Import**: Bulk insert into MongoDB collections
4. **Validation**: Verify data integrity and relationships
5. **Indexing**: Create performance indexes
6. **Testing**: Run comprehensive tests on migrated data

## Data Relationships

- **Games → Players**: One-to-many (game contains multiple players)
- **Games → Systems**: One-to-many (game contains multiple systems)
- **Players → Ships**: One-to-many (player owns multiple ships)
- **Players → Fleets**: One-to-many (player controls multiple fleets)
- **Systems → Ships**: One-to-many (system contains multiple ships)
- **Fleets → Ships**: One-to-many (fleet contains multiple ships)
- **Games → Diplomacies**: One-to-many (game has multiple diplomatic relations)
- **Players → Scouting Reports**: One-to-many (player has multiple scouting reports)
- **Players → Explored**: One-to-many (player has explored multiple systems)