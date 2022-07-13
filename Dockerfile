FROM phpswoole/swoole:php8.1

RUN docker-php-ext-install mysqli

WORKDIR /var/www

COPY /server/rootfilesystem/ /
COPY /public /var/www/public
COPY /app /var/www/app

CMD [ "php", "-a" ]