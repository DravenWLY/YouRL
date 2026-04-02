# YouRL Frontend

A React TypeScript frontend for the YouRL URL shortener service.

## Features

- URL shortening with real-time feedback
- URL statistics and analytics
- Recent URLs browsing
- Responsive design with Tailwind CSS
- Type-safe development with TypeScript
- API integration with the Spring Boot backend

## Tech Stack

- **React 19** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Router DOM** for routing
- **Bun** for package management and development server

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed on your system
- Backend service running (see backend README)

### Installation

```bash
cd frontend
bun install
```

### Development

Start the development server:

```bash
bun run dev
```

The frontend will be available at `http://localhost:3000`

### Building for Production

```bash
bun run build
```

Preview the production build:

```bash
bun run preview
```

### Other Commands

- `bun run lint` - Run ESLint
- `bun run typecheck` - Run TypeScript type checking

## Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable React components
│   ├── pages/         # Page components
│   ├── services/      # API service layer
│   ├── types/         # TypeScript type definitions
│   ├── styles/        # Global styles and Tailwind
│   ├── hooks/         # Custom React hooks
│   ├── App.tsx        # Main application component
│   └── index.tsx      # Application entry point
├── public/            # Static assets
└── index.html         # HTML template
```

## API Integration

The frontend communicates with the backend via a proxy configured in `vite.config.ts`. API calls are routed through `/api` to `http://localhost:8080`.

### Available Endpoints

- `POST /api/shorten` - Shorten a URL
- `GET /api/{shortCode}/stats` - Get URL statistics
- `GET /api/recent` - Get recent URLs

## Development Notes

- The application uses a modern React setup with functional components and hooks
- TypeScript provides type safety throughout the codebase
- Tailwind CSS enables rapid UI development with utility classes
- The Vite development server includes hot module replacement for fast development

## Environment Setup

For local development, ensure the backend service is running on `http://localhost:8080`. The proxy in `vite.config.ts` will forward API requests to the backend.

## License

MIT
