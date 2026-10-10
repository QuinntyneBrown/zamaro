FROM php:8.3-cli

RUN apt-get update && apt-get install -y --no-install-recommends \
      git unzip curl libpq-dev libicu-dev libzip-dev libpng-dev libjpeg-dev libwebp-dev libavif-dev \
    && docker-php-ext-configure gd --with-jpeg --with-webp --with-avif \
    && docker-php-ext-install pdo_pgsql intl zip gd pcntl bcmath \
    && pecl install redis && docker-php-ext-enable redis \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
