FROM node:18.12.1-alpine3.16
WORKDIR /usr/src/app

# Installing & caching node dependencies
COPY package.json .
COPY package-lock.json* .
RUN npm install

# Copying all other files & launching
COPY . .
CMD ["npm", "start"]