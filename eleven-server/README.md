# Eleven Labs Server

This is the backend server for handling Eleven Labs API interactions.

## Deployment to Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Set up environment variables in Vercel:
```bash
vercel secrets add eleven_labs_api_key "your-api-key-here"
```

4. Deploy the server:
```bash
vercel
```

5. After deployment, update the frontend environment variable:
- Create/update `.env.production` in the root directory:
```
VITE_ELEVEN_LABS_API_KEY=your-api-key-here
VITE_ELEVEN_SERVER_URL=https://your-vercel-deployment-url.vercel.app
```

6. Deploy the frontend to Vercel:
```bash
cd ..  # Go to root directory
vercel
```

## Environment Variables

- `ELEVEN_LABS_API_KEY`: Your Eleven Labs API key
- `ELEVEN_SERVER_PORT`: Port for local development (default: 3001)

## Development

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```
ELEVEN_LABS_API_KEY=your-api-key-here
ELEVEN_SERVER_PORT=3001
```

3. Run the server:
```bash
npm run dev
