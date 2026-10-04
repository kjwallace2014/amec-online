FROM php:8.3-apache

# Install the PHP extensions your app needs (adjust to your DB)
RUN docker-php-ext-install pdo pdo_mysql mysqli
# For Postgres instead: apt-get install -y libpq-dev && docker-php-ext-install pdo_pgsql

RUN a2enmod rewrite
COPY . /var/www/html/
RUN chown -R www-data:www-data /var/www/html

EXPOSE 80