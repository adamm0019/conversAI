# Use Node.js LTS version
FROM node:18-slim

# Create app directory
WORKDIR /app

# Copy package files
COPY conversAItion/package*.json ./

# Install dependencies
RUN npm install

# Copy app source
COPY conversAItion/ .

# Build the app
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
