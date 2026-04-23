FROM docker.io/node:22-alpine
ENV NODE_ENV=production

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force
COPY . .

# run as non-root user for security
USER node
EXPOSE 3000

# using node directly instead of npm to avoid extra process overhead
CMD ["node", "server.js"]
