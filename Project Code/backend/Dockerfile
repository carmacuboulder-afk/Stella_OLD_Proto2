FROM node:20

WORKDIR /app

#COPY ./package.json ./package.json
COPY ./package-lock.json  ./package-lock.json
COPY package.json ./

RUN npm install

COPY . .

EXPOSE 8000

CMD ["npm", "start"]
