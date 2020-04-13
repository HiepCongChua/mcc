FROM node:10.10

LABEL maintainer="cuongtransc@gmail.com"

ENV REFRESHED_AT 2018-02-26
ENV HOME=/home/node

WORKDIR $HOME/app

COPY package.docker.json ${HOME}/app/package.json
# COPY package-lock.docker.json ${HOME}/app/package-lock.json

RUN npm install

COPY . $HOME/app

EXPOSE 3018

CMD ["npm", "start"]
