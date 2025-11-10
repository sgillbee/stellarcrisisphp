# Space Blitz

A modern web-based strategy game built with React, TypeScript, Express, and Socket.IO.

## Project Structure

```
space-blitz/
├── client/          # React frontend with Vite
├── server/          # Express backend with TypeScript
├── package.json     # Root package.json with workspaces
└── tsconfig.json    # Root TypeScript configuration
```

## Getting Started

1. Install dependencies:
   ```bash
   npm run install-all
   ```

2. Start development servers:
   ```bash
   npm run dev
   ```
   This will start both the client (port 3000) and server (port 3001).

3. Open http://localhost:3000 in your browser.

## Available Scripts

- `npm run dev` - Start both client and server in development mode
- `npm run build` - Build both client and server for production
- `npm run start` - Start the production server

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Socket.IO Client
- **Backend**: Express.js, TypeScript, Socket.IO, MongoDB (planned)
- **Build Tools**: Vite for frontend, TypeScript compiler for backend
- **Development**: Concurrently for running multiple processes

## Migration from Stellar Crisis

This project is a modernization of the PHP-based Stellar Crisis game, migrating to a modern web stack with real-time capabilities.