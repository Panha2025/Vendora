<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\ConversationController;
use App\Http\Controllers\Api\FavoriteController;
use App\Http\Controllers\Api\ProductController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json([
    'status' => 'ok',
    'app' => config('app.name'),
]));

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/auth/providers', [AuthController::class, 'oauthProviders']);
Route::get('/auth/{provider}/redirect', [AuthController::class, 'oauthRedirect']);
Route::match(['get', 'post'], '/auth/{provider}/callback', [AuthController::class, 'oauthCallback']);
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{product}/images/{index}', [ProductController::class, 'image']);
Route::get('/products/{product}', [ProductController::class, 'show']);


Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/user/profile', [AuthController::class, 'updateProfile']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::apiResource('products', ProductController::class)->except(['index', 'show']);
    Route::get('/favorites', [FavoriteController::class, 'index']);
    Route::post('/favorites/{product}', [FavoriteController::class, 'store']);
    Route::delete('/favorites/{product}', [FavoriteController::class, 'destroy']);

    Route::get('/conversations', [ConversationController::class, 'index']);
    Route::post('/products/{product}/conversations', [ConversationController::class, 'store']);
    Route::post('/conversations/{conversation}/read', [ConversationController::class, 'markRead']);
    Route::post('/conversations/{conversation}/messages', [ConversationController::class, 'sendMessage']);

    Route::get('/admin/overview', [AdminController::class, 'overview']);
    Route::delete('/admin/products/{product}', [AdminController::class, 'destroyProduct']);
    Route::delete('/admin/users/{user}', [AdminController::class, 'destroyUser']);
    Route::put('/admin/categories/{category}', [AdminController::class, 'renameCategory']);
});
