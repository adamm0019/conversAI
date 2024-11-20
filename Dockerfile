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

# Create a script to handle environment variables
RUN echo '#!/bin/sh\necho "VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY" > .env\nnpm run build\nnode static-server.js' > start.sh && chmod +x start.sh

# Expose the port the app runs on
EXPOSE 3000

# Start the application using the script
CMD ["./start.sh"]
