
# Vendora

## Introduction

Vendora is a full-stack second-hand marketplace web application that allows users to buy, sell, save, and communicate about used items. The platform is designed for people who want to give good products a second life by posting items for sale, browsing available listings, saving favorite products, and messaging sellers directly.

The project includes a React frontend for the user interface and a Laravel backend API for authentication, product management, messaging, favorites, image uploads, and admin controls.

## Problem

Many people have second-hand items that are still useful but no longer needed. At the same time, other people want affordable products but may not have a simple and organized platform to find them. Without a dedicated marketplace, buying and selling used items can become inconvenient, unorganized, and difficult to manage.

There is also a need for features such as product images, seller contact information, saved favorites, direct messaging, and admin management to make the selling process smoother and more trustworthy.

## Solution

Vendora provides an online marketplace where users can post second-hand items, upload product photos, browse available products, and contact sellers. Buyers can search and filter products by category, condition, and price, while sellers can manage their own listings.

The application also includes user authentication, wishlist functionality, buyer-seller messaging, multilingual support, light/dark mode, and an admin dashboard for managing marketplace data.

## Features

- User registration and login
- Browse second-hand product listings
- Search products by name, category, or seller
- Filter products by category, condition, and price range
- Sort products by newest, most liked, and price
- Post items for sale with uploaded photos
- Preview and crop product images before posting
- View detailed product information
- View seller contact information
- Save favorite products to a wishlist
- Message sellers directly about products
- View personal listings
- Edit own product listings
- Admin dashboard for managing users, products, categories, and activity
- Light and dark mode
- Multi-language support: English, Khmer, and Chinese
- Responsive design for desktop and mobile devices
- Demo support using browser storage when the backend is unavailable

## Technologies Used

### Frontend

**React**  
Used to build the main user interface, including the marketplace dashboard, authentication page, product cards, product detail page, messaging view, post item form, and admin page.

**Vite**  
Used as the frontend development and build tool. It provides fast development loading and creates the production build for deployment.

**JavaScript JSX**  
Used to create interactive frontend components and handle application logic such as filtering, sorting, posting items, favorites, messages, and user interactions.

**CSS**  
Used for custom styling, responsive layout, light/dark mode, dashboard design, product cards, forms, buttons, and mobile-friendly pages.

**Local Storage**  
Used to store demo data such as theme preference, language preference, user session, and local product listings when the backend is not available.

### Backend

**Laravel**  
Used to build the backend API for authentication, product listings, image uploads, favorites, conversations, messages, and admin management.

**PHP**  
Used as the backend programming language for controllers, models, routes, validation, and database interaction.

**Laravel Sanctum**  
Used for API token authentication so users can securely log in, post products, save favorites, and send messages.

**Laravel Socialite**  
Used to support social login providers such as Google, Facebook, and Apple.

**MySQL**  
Used to store application data such as users, products, favorites, conversations, messages, and access tokens.

## Database

The database stores the main marketplace information, including:

- User accounts
- User roles
- Product listings
- Product image URLs
- Favorite products
- Conversations
- Messages
- Authentication tokens

The database connection is configured in the Laravel `.env` file.

## How to Use

1. Open the Vendora website.
2. Browse second-hand items on the marketplace page.
3. Use search, category, condition, and price filters to find products.
4. Register or log in to access seller and buyer features.
5. Post an item by filling in the product form and uploading photos.
6. View product details to see more information and seller contact details.
7. Save products to the wishlist.
8. Message sellers directly about products.
9. Use the admin dashboard to manage users, products, categories, and marketplace activity.

## Project Structure

```text
Vendora/
  frontend/ - React and Vite frontend application
  backend/ - Laravel backend API
  README.md - Project overview and setup notes

frontend/src/api/ - Frontend API request files
frontend/src/components/ - Reusable frontend components
frontend/src/pages/ - Main pages such as Marketplace, Auth, and Admin
frontend/src/sections/ - Page sections such as product detail, messages, and post item form
frontend/src/data/ - Sample product data
frontend/src/i18n.js - Language translation data
backend/routes/api.php - Backend API routes
backend/app/Http/Controllers/Api/ - Backend API controllers
backend/app/Models/ - Laravel database models
backend/database/migrations/ - Database table structure files
```

## Deployment Note

The React frontend can be hosted on Vercel. Use these settings:

```text
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
Environment Variable: VITE_API_URL=https://your-backend-domain.com/api
```

For a real online marketplace where all users can register, upload products, send messages, and see shared data, the Laravel backend, MySQL database, and image storage must also be deployed to a server.

## Conclusion

Vendora demonstrates how a full-stack web application can be used to support second-hand buying and selling. By combining a React frontend, Laravel backend, SQL database, authentication, image uploads, messaging, favorites, and admin tools, the project provides a practical marketplace system for managing used item sales.
