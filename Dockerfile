FROM node:23.11

WORKDIR /usr/src/app

COPY package.json yarn.lock ./
RUN corepack enable && yarn install

COPY . .

RUN yarn global add tsx

EXPOSE 3061

CMD ["tsx", "src/startServices.ts"]
