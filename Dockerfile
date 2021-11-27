FROM node:16.11.1
RUN mkdir /hppl-code
COPY . /hppl-code
WORKDIR /hppl-code
RUN npm install