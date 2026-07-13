<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'products' => Product::with('seller')->latest()->paginate(12),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:180'],
            'category' => ['required', 'string', 'max:80'],
            'condition' => ['required', 'in:New,Like New,Good,Fair,Poor'],
            'price' => ['required', 'numeric', 'min:0'],
            'description' => ['required', 'string'],
            'usage_duration' => ['nullable', 'string', 'max:120'],
            'location' => ['required', 'string', 'max:120'],
            'status' => ['required', 'in:Available,Reserved,Sold'],
            'images' => ['array'],
            'images.*' => ['url'],
        ]);

        $product = $request->user()->products()->create($validated);

        return response()->json([
            'product' => $product,
        ], 201);
    }

    public function show(Product $product): JsonResponse
    {
        return response()->json([
            'product' => $product->load('seller'),
        ]);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        abort_unless($product->user_id === $request->user()->id, 403);

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:180'],
            'category' => ['sometimes', 'string', 'max:80'],
            'condition' => ['sometimes', 'in:New,Like New,Good,Fair,Poor'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'description' => ['sometimes', 'string'],
            'usage_duration' => ['nullable', 'string', 'max:120'],
            'location' => ['sometimes', 'string', 'max:120'],
            'status' => ['sometimes', 'in:Available,Reserved,Sold'],
            'images' => ['sometimes', 'array'],
            'images.*' => ['url'],
        ]);

        $product->update($validated);

        return response()->json([
            'product' => $product,
        ]);
    }

    public function destroy(Request $request, Product $product): JsonResponse
    {
        abort_unless($product->user_id === $request->user()->id, 403);

        $product->delete();

        return response()->json([
            'message' => 'Product deleted successfully.',
        ]);
    }
}
