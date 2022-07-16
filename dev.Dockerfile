FROM phpswoole/swoole:php8.1

RUN docker-php-ext-install mysqli

WORKDIR /var/www

RUN mkdir public &&\
    mkdir app
COPY /public ./public