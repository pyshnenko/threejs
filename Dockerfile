FROM node:12

WORKDIR home/spamigor/node/threejs

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 4014

CMD [ "node", "app5.js" ]
