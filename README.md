# ConversAItion

A language learning application powered by Eleven Labs AI.

## Deployment to Vercel

### 1. Deploy the Eleven Labs Server

First, deploy the server that handles Eleven Labs API interactions:

```bash
cd eleven-server
vercel
```

After deployment, copy the deployment URL (e.g., https://eleven-server.vercel.app).

### 2. Set up Environment Variables

In Vercel's project settings, add the following environment variables:

```
VITE_ELEVEN_LABS_API_KEY=your_api_key_here
VITE_ELEVEN_SERVER_URL=https://eleven-server.vercel.app
```

### 3. Deploy the Main Application

From the project root:

```bash
vercel
```

## Development Setup

1. Install dependencies:
```bash
npm install
cd eleven-server && npm install
```

2. Create environment files:

`.env` for development:
```
VITE_ELEVEN_LABS_API_KEY=your_api_key_here
VITE_ELEVEN_SERVER_URL=http://localhost:3001
```

`.env.production` for production:
```
VITE_ELEVEN_LABS_API_KEY=your_api_key_here
VITE_ELEVEN_SERVER_URL=https://eleven-server.vercel.app
```

3. Start the development servers:

In one terminal:
```bash
cd eleven-server && npm run dev
```

In another terminal:
```bash
npm run dev
```

## Features

- Real-time voice conversations with AI language tutors
- Multiple conversation modes:
  - Language Tutor: Structured learning with a patient teacher
  - Friendly Chat: Casual conversation with a native speaker
  - Expert Mode: Advanced discussions on specific topics
- Progress tracking and statistics
- Dark/Light mode support
- Responsive design for all devices

## Tech Stack

- React + TypeScript
- Vite
- Mantine UI
- Eleven Labs AI
- Express (server)
- Vercel (deployment)
