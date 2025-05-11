FROM ghcr.io/qtvhao/chrome:main

COPY package.json yarn.lock ./
RUN yarn --ignore-scripts

COPY . .

RUN yarn
RUN yarn global add tsx

EXPOSE 3061

CMD ["tsx", "src/startServices.ts"]
