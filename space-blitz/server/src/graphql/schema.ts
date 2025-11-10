import { gql } from 'graphql-tag';

export const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    icon: String
    isAdmin: Boolean!
    createdAt: String!
    lastLogin: String
  }

  type Game {
    id: ID!
    seriesId: ID!
    gameNumber: Int!
    seriesName: String!
    status: String!
    phase: String!
    playerCount: Int!
    maxPlayers: Int
    lastUpdate: String!
    updateCount: Int!
    players: [Player!]!
    systems: [System!]!
    ships: [Ship!]!
  }

  type Player {
    id: ID!
    gameId: ID!
    name: String!
    team: Int!
    endedTurn: Boolean!
    economicPower: Int!
    militaryPower: Int!
    mineral: Float!
    fuel: Float!
    agriculture: Float!
  }

  type System {
    id: ID!
    gameId: ID!
    coordinates: String!
    name: String!
    owner: String
    population: Int!
    mineral: Int!
    fuel: Int!
    agriculture: Int!
  }

  type Ship {
    id: ID!
    gameId: ID!
    owner: String!
    type: String!
    location: String!
    orders: String
    br: Int!
    hp: Int!
    fuel: Int!
  }

  type Series {
    id: ID!
    name: String!
    gameType: String!
    maxPlayers: Int!
    updateTime: Int!
    diplomacy: Int!
    teamGame: Boolean!
    custom: Boolean!
    halted: Boolean!
    gameCount: Int!
  }

  type GameList {
    series: Series!
    games: [Game!]!
  }

  type Query {
    # User queries
    currentUser: User

    # Game queries
    game(id: ID!): Game
    games: [Game!]!
    gameList: [GameList!]!

    # Series queries
    series: [Series!]!
    seriesById(id: ID!): Series

    # Statistics
    stats: Stats!
  }

  type Stats {
    totalUsers: Int!
    totalGames: Int!
    activeGames: Int!
    totalSeries: Int!
  }

  type Mutation {
    # Game actions
    joinGame(gameId: ID!): Game!
    endTurn(gameId: ID!): Boolean!

    # Admin actions
    createSeries(name: String!, maxPlayers: Int!, updateTime: Int!): Series!
    haltSeries(id: ID!, halted: Boolean!): Series!
  }

  type Subscription {
    gameUpdated(gameId: ID!): Game!
    newMessage(gameId: ID!): Message!
  }

  type Message {
    id: ID!
    gameId: ID!
    sender: String!
    text: String!
    type: String!
    time: String!
  }
`;