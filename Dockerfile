# No dependencies, so no npm install — just copy the stdlib app and run it.
FROM node:24-alpine
WORKDIR /app
COPY . .
EXPOSE 8080
CMD ["node", "server.js"]
