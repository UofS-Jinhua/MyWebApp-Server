FROM node:latest

# create app directory
WORKDIR /usr/src/app

# copy package.json and package-lock.json
COPY package*.json ./

# install app dependencies
RUN npm install

# copy app source code
COPY . .

# expose port and start application
EXPOSE 3000

# start the application
CMD ["node", "server.js"]