# SecondLoop Laravel API

This folder contains the Laravel backend source files for authentication and protected marketplace product APIs.

Composer is not installed on this computer yet, so the framework vendor files cannot be generated from here right now.

## Install Laravel When Composer Is Available

From `C:\E-Commerce`:

```bash
composer create-project laravel/laravel backend-app
cd backend-app
composer require laravel/sanctum
php artisan sanctum:install
```

Then copy this folder's `app`, `routes`, and `database/migrations` files into `backend-app`, configure `.env`, and run:

```bash
php artisan key:generate
php artisan migrate
php artisan serve
```

The React frontend expects the API at:

```text
http://127.0.0.1:8000/api
```

## API Routes

- `POST /api/register`
- `POST /api/login`
- `POST /api/logout`
- `GET /api/user`
- `GET /api/products`
- `POST /api/products`
- `GET /api/products/{product}`
- `PUT /api/products/{product}`
- `DELETE /api/products/{product}`
