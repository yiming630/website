FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# For development, use dev mode
# For production, you would uncomment the build line and use start
# RUN npm run build
# CMD ["npm", "run", "start"]

# Development mode
CMD ["npm", "run", "dev"]