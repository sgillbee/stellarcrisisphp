# Space Blitz Server

Express.js server for the Space Blitz game built with TypeScript and MongoDB.

## Setup

### Prerequisites

- Node.js 18+
- MongoDB

### Quick Setup

Run the automated setup script to install and configure MongoDB:

```bash
npm run setup
```

This script will:
- Check if MongoDB is installed
- Install MongoDB if needed (platform-specific)
- Start the MongoDB service
- Create the database
- Run migrations
- Seed initial data

### Manual Setup

If the automated setup doesn't work for your system:

1. **Install MongoDB:**
   - **Windows:** Download from [mongodb.com](https://www.mongodb.com/try/download/community)
   - **macOS:** `brew install mongodb-community`
   - **Linux:** Follow [official docs](https://docs.mongodb.com/manual/administration/install-on-linux/)

2. **Start MongoDB:**
   - **Windows:** `net start MongoDB` or run `mongod`
   - **macOS/Linux:** `sudo systemctl start mongod`

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Run migrations:**
   ```bash
   npm run migrate
   ```

5. **Seed database:**
   ```bash
   npm run seed
   ```

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Run linter
npm run lint
```

## Environment Variables

Create a `.env` file in the server root:

```env
MONGODB_URI=mongodb://localhost:27017/space-blitz
PORT=3001
NODE_ENV=development
```

## API

The server provides REST endpoints and WebSocket support for the Space Blitz game.

- Health check: `GET /api/health`
- Game endpoints: `/api/games/*`
- User endpoints: `/api/users/*`

## Database

The application uses MongoDB with Mongoose ODM. Database migrations are handled through custom scripts in `src/migration/`.

Collections:
- users
- games
- series
- players
- systems
- ships
- fleets
- invitations