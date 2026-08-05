#!/usr/bin/env sh
set -eu

php artisan optimize:clear
php artisan storage:link || true
php artisan migrate --force
php artisan db:seed --force

echo "Registered API routes:"
php artisan route:list --path=api || true

exec php artisan serve --host=0.0.0.0 --port="${PORT:-8000}"
