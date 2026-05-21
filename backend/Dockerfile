FROM node:20-alpine

WORKDIR /app

# openssl (Prisma) + postgresql-client (pg_dump para respaldos)
RUN apk add --no-cache openssl postgresql-client

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy prisma schema
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy source
COPY . .

COPY scripts/docker-entrypoint-dev.sh /usr/local/bin/docker-entrypoint-dev.sh
# Windows CRLF en el script rompe el shebang (exec: no such file or directory)
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint-dev.sh && chmod +x /usr/local/bin/docker-entrypoint-dev.sh

# Expose port
EXPOSE 3000

ENTRYPOINT ["docker-entrypoint-dev.sh"]
CMD ["npm", "run", "start:dev"]
