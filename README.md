# Vendora

Vendora is a full-stack second-hand marketplace web application for buying, selling, saving, and messaging about used items. The project combines a React/Vite frontend with a Laravel API backend, giving users a marketplace dashboard where they can browse products, post listings with photos, manage favorites, and communicate with sellers.

The live GitHub Pages version can run as a frontend demo. Full account, database, messaging, and shared image upload features require the Laravel backend, database, and storage to be running.

## Features

- User registration and login with Laravel Sanctum token authentication
- Optional social login flow support for Google, Facebook, and Apple through Laravel Socialite
- Marketplace home page with searchable and filterable second-hand listings
- Category filters for electronics, phones, laptops, home items, furniture, fashion, handmade items, stationery, toys, sports, and general products
- Price range filtering, condition filtering, newest sorting, popularity sorting, and price sorting
- Product detail page with gallery images, seller information, contact details, related products, and safety tips
- Seller listing form with up to 5 uploaded images
- Built-in image preview and cropping before posting
- Edit listing support for the original seller
- Wishlist/favorites system with favorite counts
- Buyer-seller messaging system with conversations, unread counts, read status, and periodic refresh
- My Listings, My Favorites, and My Messages dashboard views
- Admin dashboard for marketplace statistics, users, products, categories, and recent activity
- Admin tools to delete products, remove users, and rename product categories
- Light and dark theme support
- English, Khmer, and Chinese interface translations
- Responsive layout for desktop and mobile screens
- GitHub Pages static demo fallback using browser storage when the backend is not available

## Tech Stack

### Frontend

- React
- Vite
- JavaScript JSX
- CSS
- Browser localStorage for demo-mode persistence

### Backend

- Laravel
- PHP
- Laravel Sanctum
- Laravel Socialite
- MySQL or SQLite through Laravel database configuration
- REST API routes
- File uploads stored under Laravel public uploads

## Project Structure

```text
Vendora/
  README.md
  index.html                  Static GitHub Pages entry file
  assets/                     Built frontend assets for root Pages deployment
  docs/                       Built frontend assets for /docs Pages deployment
  my-react-app/               Main React frontend source
    src/
      api/                    Frontend API clients
      components/             Reusable UI components
      data/                   Sample product data
      pages/                  Marketplace, auth, and admin pages
      sections/               Product, message, post-item, and detail sections
      App.jsx                 Main app routing logic
      App.css                 Application styling
      i18n.js                 Translation strings
  backend-app/                Main Laravel API backend
    app/Http/Controllers/Api/ API controllers
    app/Models/               User, Product, Favorite, Conversation, Message models
    database/migrations/      Database table definitions
    routes/api.php            API route definitions
```

## Main Frontend Pages

### Marketplace Page

The marketplace page is the main user dashboard. It displays available second-hand items, category navigation, search, filtering, sorting, pagination, favorites, messages, and the seller post form.

### Auth Page

The auth page handles login and registration. Registration collects name, phone, email, password, and password confirmation. The page also includes social login buttons for Google, Facebook, and Apple.

### Admin Page

The admin dashboard shows marketplace statistics and management tools. Admin users can review products, users, categories, and conversation activity.

## Backend API Overview

Public API endpoints:

```text
POST /api/register
POST /api/login
GET  /api/auth/{provider}/redirect
GET  /api/products
GET  /api/products/{product}
GET  /api/products/{product}/images/{index}
```

Authenticated API endpoints:

```text
GET    /api/user
POST   /api/logout
POST   /api/products
PUT    /api/products/{product}
DELETE /api/products/{product}
GET    /api/favorites
POST   /api/favorites/{product}
DELETE /api/favorites/{product}
GET    /api/conversations
POST   /api/products/{product}/conversations
POST   /api/conversations/{conversation}/read
POST   /api/conversations/{conversation}/messages
```

Admin API endpoints:

```text
GET    /api/admin/overview
DELETE /api/admin/products/{product}
DELETE /api/admin/users/{user}
PUT    /api/admin/categories/{category}
```

## Database

The Laravel backend stores marketplace data in SQL tables. The main data includes:

- Users and roles
- Product listings
- Product image URLs
- Favorites
- Conversations
- Messages
- Personal access tokens

The database connection is controlled by `backend-app/.env`.

Example MySQL configuration:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=vendora
DB_USERNAME=root
DB_PASSWORD=
```

## Local Setup

### Frontend

```bash
cd my-react-app
npm install
npm run dev
```

The Vite frontend normally runs at:

```text
http://localhost:5173
```

### Backend

```bash
cd backend-app
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

The Laravel API normally runs at:

```text
http://127.0.0.1:8000/api
```

### Frontend API URL

For local development, the frontend defaults to:

```text
http://127.0.0.1:8000/api
```

For a deployed backend, set:

```env
VITE_API_URL=https://your-backend-domain.com/api
```

Then rebuild the frontend.

## Build

Build the React app:

```bash
cd my-react-app
npm run build
```

This project is configured to output the production build into the root `docs` folder for GitHub Pages.

## GitHub Pages Notes

GitHub Pages can host the React frontend, but it cannot run the Laravel backend or store public user uploads by itself.

The GitHub Pages demo can save demo listings and uploaded images in the current browser using localStorage/data URLs. For a real public marketplace where all users can see the same uploaded products and images, the Laravel backend, database, and image storage must be deployed to a server.

## Testing

Frontend lint:

```bash
cd my-react-app
npm run lint
```

Frontend production build:

```bash
cd my-react-app
npm run build
```

Backend tests:

```bash
cd backend-app
php artisan test
```

## Purpose

Vendora was built as a second-hand item selling platform that focuses on practical marketplace workflows: browsing, posting, saving, contacting sellers, and managing marketplace data. It demonstrates full-stack development with a React user interface, a Laravel REST API, SQL database design, authentication, image uploads, and responsive UI design.

