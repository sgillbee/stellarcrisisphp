import { User, Game, Series, Player, System, Ship, Message } from '../models';

export const resolvers = {
  Query: {
    currentUser: async (_: any, __: any, context: any) => {
      if (!context.user) return null;
      return await User.findById(context.user.userId);
    },

    game: async (_: any, { id }: { id: string }) => {
      return await Game.findById(id).populate('players systems');
    },

    games: async () => {
      return await Game.find({ status: 'active' }).populate('players systems');
    },

    gameList: async () => {
      const series = await Series.find({ halted: false });
      const gameLists = [];

      for (const s of series) {
        const games = await Game.find({
          seriesId: s._id,
          status: 'active',
          playerCount: { $gt: 0 }
        }).sort({ gameNumber: -1 }).limit(5);

        gameLists.push({
          series: s,
          games: games
        });
      }

      return gameLists;
    },

    series: async () => {
      return await Series.find();
    },

    seriesById: async (_: any, { id }: { id: string }) => {
      return await Series.findById(id);
    },

    stats: async () => {
      const [totalUsers, totalGames, activeGames, totalSeries] = await Promise.all([
        User.countDocuments(),
        Game.countDocuments(),
        Game.countDocuments({ status: 'active' }),
        Series.countDocuments()
      ]);

      return {
        totalUsers,
        totalGames,
        activeGames,
        totalSeries
      };
    }
  },

  Mutation: {
    joinGame: async (_: any, { gameId }: { gameId: string }, context: any) => {
      if (!context.user) throw new Error('Not authenticated');

      const game = await Game.findById(gameId);
      if (!game) throw new Error('Game not found');

      // Check if user is already in the game
      const existingPlayer = await Player.findOne({ gameId, name: context.user.name });
      if (existingPlayer) throw new Error('Already in this game');

      // Check if game is full
      const playerCount = await Player.countDocuments({ gameId });
      if (playerCount >= 8) throw new Error('Game is full'); // Default max players

      // Create player record
      const player = new Player({
        gameId,
        name: context.user.name,
        team: playerCount + 1,
      });

      await player.save();

      // Update game player count
      game.playerCount = playerCount + 1;
      game.players.push(player._id);
      await game.save();

      return await Game.findById(gameId).populate('players systems');
    },

    endTurn: async (_: any, { gameId }: { gameId: string }, context: any) => {
      if (!context.user) throw new Error('Not authenticated');

      const player = await Player.findOne({ gameId, name: context.user.name });
      if (!player) throw new Error('Not a player in this game');

      player.endedTurn = true;
      await player.save();

      return true;
    },

    createSeries: async (_: any, args: any, context: any) => {
      if (!context.user?.isAdmin) throw new Error('Admin access required');

      const series = new Series({
        ...args,
        creator: context.user.name,
        custom: true
      });

      await series.save();
      return series;
    },

    haltSeries: async (_: any, { id, halted }: { id: string; halted: boolean }, context: any) => {
      if (!context.user?.isAdmin) throw new Error('Admin access required');

      const series = await Series.findByIdAndUpdate(id, { halted }, { new: true });
      if (!series) throw new Error('Series not found');

      return series;
    }
  },

  Game: {
    players: async (game: any) => {
      return await Player.find({ gameId: game._id });
    },

    systems: async (game: any) => {
      return await System.find({ gameId: game._id });
    },

    ships: async (game: any) => {
      return await Ship.find({ gameId: game._id });
    }
  },

  Subscription: {
    gameUpdated: {
      subscribe: (_: any, { gameId }: { gameId: string }) => {
        // TODO: Implement subscription for game updates
        // This would use a pub/sub system
        return { gameId };
      }
    },

    newMessage: {
      subscribe: (_: any, { gameId }: { gameId: string }) => {
        // TODO: Implement subscription for new messages
        return { gameId };
      }
    }
  }
};