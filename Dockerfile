FROM phpswoole/swoole:php8.1

RUN docker-php-ext-install mysqli

WORKDIR /var/www

COPY /server/server.php ./
RUN mkdir public
RUN mkdir app
COPY /public ./public
COPY /app ./app

CMD [ "php", "server.php"]