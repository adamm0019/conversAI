# Use Node.js LTS version
FROM node:18-slim

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps
RUN npm install --legacy-peer-deps

# Copy app source
COPY . .

# Create .env file from environment variable
RUN echo "VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY" > .env

# Build the app
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Start the application using the static server
CMD ["node", "static-server.js"]
