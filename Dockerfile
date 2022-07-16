FROM phpswoole/swoole:php8.1-alpine

RUN docker-php-ext-install mysqli

WORKDIR /var/www

RUN mkdir public &&\
    mkdir app
COPY /server/server.php ./
COPY /public ./public
COPY /app ./app

CMD [ "php", "server.php"]