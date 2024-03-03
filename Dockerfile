FROM node:18.12.1-alpine3.16
WORKDIR /usr/src/app

ARG UID
ARG GID

# Installing & caching node dependencies
COPY package.json .
COPY package-lock.json* .
RUN npm install


# Create a non-root user, and grant password-less sudo permissions
RUN addgroup --gid $GID spatulas && \
    adduser --uid $UID --gid $GID --disabled-password spatulas

RUN chown spatulas:spatulas /usr/src/app

# Set the non-root user as the default user
USER spatulas

# Copying all other files & launching
COPY . .
CMD ["npm", "start"]
