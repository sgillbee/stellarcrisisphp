# Space Blitz Architecture

## Overview

Space Blitz is a modern web-based strategy game built as a migration from the legacy PHP-based Stellar Crisis game. The architecture follows a full-stack JavaScript/TypeScript approach with real-time capabilities.

## Project Structure

```
space-blitz/
├── client/              # React frontend application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── test/        # Test utilities and setup
│   │   └── *.test.tsx   # Component tests
│   ├── package.json
│   └── vite.config.ts
├── server/              # Express backend application
│   ├── src/
│   │   ├── server.ts    # Main server file
│   │   ├── *.test.ts    # Server tests
│   │   └── ...
│   ├── package.json
│   └── vitest.config.ts
├── docs/                # Documentation
├── package.json         # Root workspace configuration
└── README.md
```

## Technology Stack

### Frontend (Client)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Testing**: Vitest with React Testing Library
- **Real-time**: Socket.IO Client
- **Styling**: CSS3 (future: consider CSS-in-JS or styled-components)

### Backend (Server)
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Real-time**: Socket.IO
- **Testing**: Vitest with Supertest
- **Database**: MongoDB (planned for Phase 2)

### Development Tools
- **Package Management**: npm workspaces
- **Testing**: Unified Vitest across client and server
- **Linting**: ESLint with TypeScript rules
- **Process Management**: Concurrently for development

## Architecture Principles

### 1. Real-time First
- **WebSockets**: Primary communication method for game state updates
- **Fallback**: HTTP polling for environments without WebSocket support
- **Pure Data**: All payloads are pure JSON - no HTML/markup in responses
- **Reactive UI**: Client updates automatically based on incoming data changes

### 2. Type Safety
- **TypeScript**: Mandatory for all new code
- **Strict Mode**: Enabled in all TypeScript configurations
- **Interface Definitions**: Shared types between client and server where applicable

### 3. Testing
- **Unified Framework**: Vitest for both client and server
- **Test Coverage**: Unit tests for all components and API endpoints
- **CI/CD Ready**: Tests must pass and exit cleanly
- **Test Structure**: Colocate tests with source files

### 4. Code Organization
- **Feature-based**: Organize code by feature rather than type
- **Separation of Concerns**: Clear boundaries between client and server
- **Modular**: Small, focused modules with single responsibilities

## Client Architecture

### Component Structure
```typescript
// Example component structure
interface GameBoardProps {
  gameState: GameState;
  onMove: (move: Move) => void;
}

function GameBoard({ gameState, onMove }: GameBoardProps) {
  // Component logic
  return <div>{/* JSX */}</div>;
}
```

### State Management
- **Local State**: React useState/useReducer for component state
- **Server State**: Direct updates via WebSocket events
- **Future**: Consider Redux Toolkit or Zustand for complex state

### Communication
```typescript
// WebSocket connection
const socket = io('http://localhost:3001');

// Listen for game updates
socket.on('game-update', (data: GameUpdate) => {
  // Update UI reactively
  updateGameState(data);
});
```

## Server Architecture

### API Structure
```typescript
// Express server with Socket.IO
const app = express();
const server = createServer(app);
const io = new Server(server);

// REST endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server running' });
});

// WebSocket events
io.on('connection', (socket) => {
  socket.on('join-game', (data) => {
    // Handle game joining
  });
});
```

### Middleware Stack
- **Security**: Helmet for security headers
- **CORS**: Configured for client-server communication
- **JSON**: Body parsing for API requests
- **Error Handling**: Centralized error handling

### Environment Configuration
```typescript
// .env file
PORT=3001
CLIENT_URL=http://localhost:3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/space-blitz
```

## Communication Patterns

### WebSocket Events
- **Client → Server**: `join-game`, `make-move`, `leave-game`
- **Server → Client**: `game-update`, `player-joined`, `game-ended`
- **Data Format**: Pure JSON objects with TypeScript interfaces

### HTTP API (Non-real-time)
- **RESTful**: Standard REST endpoints for non-game data
- **Future**: Consider GraphQL for complex queries with subscriptions
- **Authentication**: JWT-based (planned)

## Development Workflow

### Local Development
```bash
# Install dependencies
npm run install-all

# Start development servers
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Testing Strategy
- **Unit Tests**: All components and server endpoints
- **Integration Tests**: API and WebSocket communication
- **E2E Tests**: Future consideration with Playwright or Cypress

### Code Quality
- **Linting**: ESLint with TypeScript and React rules
- **Formatting**: Consistent code formatting (consider Prettier)
- **Type Checking**: Strict TypeScript compilation
- **Pre-commit Hooks**: Future consideration for quality gates

## Constraints and Best Practices

### Code Style
1. **TypeScript**: All new code must be TypeScript
2. **Functional Components**: Prefer React functional components with hooks
3. **Named Exports**: Use named exports over default exports
4. **Interface Definitions**: Define interfaces for all data structures
5. **Error Handling**: Implement proper error boundaries and try-catch blocks

### Performance
1. **Bundle Splitting**: Use Vite's code splitting for large applications
2. **Lazy Loading**: Implement route-based and component lazy loading
3. **Memoization**: Use React.memo, useMemo, and useCallback appropriately
4. **WebSocket Optimization**: Debounce rapid updates if needed

### Security
1. **Input Validation**: Validate all user inputs on server-side
2. **CORS**: Properly configured CORS policies
3. **Environment Variables**: Never commit secrets to version control
4. **HTTPS**: Use HTTPS in production environments

### Scalability
1. **Stateless Server**: Design for horizontal scaling
2. **Database Optimization**: Plan for efficient queries and indexing
3. **Caching**: Implement appropriate caching strategies
4. **Load Balancing**: Design with load balancing in mind

## Migration Considerations

### From Legacy PHP
- **Incremental Migration**: Migrate features incrementally
- **API Compatibility**: Maintain backward compatibility where possible
- **Data Migration**: Plan for database schema migration
- **User Experience**: Preserve familiar UX patterns

### Future Enhancements
- **Progressive Web App**: Service workers and offline support
- **Internationalization**: Multi-language support
- **Accessibility**: WCAG compliance
- **Performance Monitoring**: Real user monitoring and analytics

## File Naming Conventions

### Components
- `ComponentName.tsx` - Component files
- `ComponentName.test.tsx` - Component tests
- `ComponentName.css` - Component styles (if not using CSS-in-JS)

### Server
- `server.ts` - Main server file
- `routes.ts` - API route definitions
- `middleware.ts` - Custom middleware
- `*.test.ts` - Test files

### Shared
- `types.ts` - TypeScript interfaces and types
- `constants.ts` - Application constants
- `utils.ts` - Utility functions

## Version Control

### Branching Strategy
- `main/master`: Production-ready code
- `develop`: Integration branch
- `feature/*`: Feature branches
- `hotfix/*`: Critical bug fixes

### Commit Messages
- **Format**: `Type: Description` (e.g., `feat: add user authentication`)
- **Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- **Body**: Optional detailed description for complex changes

This architecture document should be updated as the project evolves and new patterns emerge.