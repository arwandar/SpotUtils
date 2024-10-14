FROM node:latest

ENV NODE_ENV="production"

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
# Don't forget to run the build after installing dependencies
RUN npm run build
EXPOSE 3000
CMD [ "npm", "run", "serve" ]