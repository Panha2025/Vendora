<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FavoriteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $products = $request->user()
            ->favoriteProducts()
            ->with('seller')
            ->withCount('favoritedBy')
            ->latest('favorites.created_at')
            ->get();

        return response()->json([
            'products' => $products,
        ]);
    }

    public function store(Request $request, Product $product): JsonResponse
    {
        $request->user()->favoriteProducts()->syncWithoutDetaching([$product->id]);
        $favoriteCount = $product->favoritedBy()->count();

        return response()->json([
            'message' => 'Added to wishlist.',
            'favorite_count' => $favoriteCount,
        ], 201);
    }

    public function destroy(Request $request, Product $product): JsonResponse
    {
        $request->user()->favoriteProducts()->detach($product->id);
        $favoriteCount = $product->favoritedBy()->count();

        return response()->json([
            'message' => 'Removed from wishlist.',
            'favorite_count' => $favoriteCount,
        ]);
    }
}
