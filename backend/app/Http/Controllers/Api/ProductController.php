<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'products' => Product::with('seller')
                ->withCount('favoritedBy')
                ->latest()
                ->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:180'],
            'category' => ['required', 'string', 'max:80'],
            'condition' => ['required', 'in:New,Used'],
            'price' => ['required', 'numeric', 'min:0'],
            'description' => ['nullable', 'string'],
            'usage_duration' => ['nullable', 'string', 'max:120'],
            'location' => ['required', 'string', 'max:120'],
            'seller_phone' => ['required', 'string', 'max:40'],
            'seller_telegram' => ['required', 'string', 'max:80'],
            'status' => ['required', 'in:Available,Reserved,Sold'],
            'images' => ['array'],
            'images.*' => ['image', 'mimes:png,jpg,jpeg,webp', 'max:5120'],
        ]);

        $validated['description'] = $validated['description'] ?? '';
        $validated['images'] = $this->storeImages($request);

        $product = $request->user()->products()->create($validated);

        return response()->json([
            'product' => $product->load('seller')->loadCount('favoritedBy'),
        ], 201);
    }

    public function show(Product $product): JsonResponse
    {
        return response()->json([
            'product' => $product->load('seller')->loadCount('favoritedBy'),
        ]);
    }

    public function image(Product $product, int $index)
    {
        $images = $product->images ?? [];
        $imageUrl = $images[$index] ?? null;

        abort_unless($imageUrl, 404);

        return redirect()->away($imageUrl);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        abort_unless($product->user_id === $request->user()->id, 403);

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:180'],
            'category' => ['sometimes', 'string', 'max:80'],
            'condition' => ['sometimes', 'in:New,Used'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'description' => ['sometimes', 'nullable', 'string'],
            'usage_duration' => ['nullable', 'string', 'max:120'],
            'location' => ['sometimes', 'string', 'max:120'],
            'seller_phone' => ['sometimes', 'required', 'string', 'max:40'],
            'seller_telegram' => ['sometimes', 'required', 'string', 'max:80'],
            'status' => ['sometimes', 'in:Available,Reserved,Sold'],
            'existing_images' => ['sometimes', 'array'],
            'existing_images.*' => ['string'],
            'images' => ['sometimes', 'array'],
            'images.*' => ['image', 'mimes:png,jpg,jpeg,webp', 'max:5120'],
        ]);

        if (array_key_exists('description', $validated)) {
            $validated['description'] = $validated['description'] ?? '';
        }

        if ($request->hasFile('images') || $request->has('existing_images')) {
            $currentImages = $product->images ?? [];
            $existingImages = collect($validated['existing_images'] ?? [])
                ->filter(fn ($image) => in_array($image, $currentImages, true))
                ->values()
                ->all();

            unset($validated['existing_images']);

            $validated['images'] = array_slice([
                ...$existingImages,
                ...$this->storeImages($request),
            ], 0, 5);
        }

        $product->update($validated);

        return response()->json([
            'product' => $product->load('seller')->loadCount('favoritedBy'),
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

    private function storeImages(Request $request): array
    {
        if (!$request->hasFile('images')) {
            return [];
        }

        return collect($request->file('images'))
            ->take(5)
            ->map(fn ($image) => $this->storeImage($image))
            ->all();
    }

    private function storeImage($image): string
    {
        if (env('PRODUCT_IMAGE_STORAGE') === 'cloudinary' && $this->hasCloudinaryConfig()) {
            return $this->storeCloudinaryImage($image);
        }

        $path = $image->storePublicly('products', [
            'disk' => env('PRODUCT_IMAGE_DISK', 'public'),
        ]);

        return Storage::disk(env('PRODUCT_IMAGE_DISK', 'public'))->url($path);
    }

    private function hasCloudinaryConfig(): bool
    {
        return filled(env('CLOUDINARY_CLOUD_NAME'))
            && filled(env('CLOUDINARY_API_KEY'))
            && filled(env('CLOUDINARY_API_SECRET'));
    }

    private function storeCloudinaryImage($image): string
    {
        $timestamp = time();
        $folder = env('CLOUDINARY_FOLDER', 'vendora/products');
        $signature = sha1("folder={$folder}&timestamp={$timestamp}".env('CLOUDINARY_API_SECRET'));

        $response = Http::attach(
            'file',
            fopen($image->getRealPath(), 'r'),
            Str::uuid().'.'.$image->getClientOriginalExtension()
        )->post('https://api.cloudinary.com/v1_1/'.env('CLOUDINARY_CLOUD_NAME').'/image/upload', [
            'api_key' => env('CLOUDINARY_API_KEY'),
            'folder' => $folder,
            'timestamp' => $timestamp,
            'signature' => $signature,
        ]);

        abort_unless($response->successful(), 502, 'Could not upload product image.');

        return $response->json('secure_url');
    }
}
