FROM php:8.4-cli

RUN apt-get update \
    && apt-get install -y --no-install-recommends git unzip libpq-dev libzip-dev \
    && docker-php-ext-install pdo_mysql pdo_pgsql zip \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts

COPY . .

RUN composer dump-autoload --optimize \
    && chmod -R 775 storage bootstrap/cache

CMD ["sh", "-c", "php artisan optimize:clear && php artisan storage:link || true && php artisan migrate --force && php artisan db:seed --force && php -S 0.0.0.0:${PORT:-8000} -t public public/index.php"]
