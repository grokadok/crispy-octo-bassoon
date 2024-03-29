FROM phpswoole/swoole:php8.1-alpine
WORKDIR /var/www
RUN docker-php-ext-install mysqli
RUN mkdir public &&\
    mkdir app
COPY /server/server.php ./
COPY /public ./public
COPY /app ./app

CMD [ "php", "server.php"]