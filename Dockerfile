FROM node:18-alpine

WORKDIR /app

# Copy package configurations
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy codebase
COPY . .

# Generate Prisma client and build Next.js app
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

# Set environment variables
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Run startup script
CMD ["npm", "run", "start"]
