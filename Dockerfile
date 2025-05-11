FROM ghcr.io/qtvhao/chrome:main

COPY package.json yarn.lock tsconfig.json ./
RUN yarn

COPY . .

RUN yarn global add tsx

EXPOSE 3061

CMD ["tsx", "src/startServices.ts"]
