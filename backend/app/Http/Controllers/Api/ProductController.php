<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
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
                ->get()
                ->map(fn (Product $product) => $this->withPublicImageUrls($product)),
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
            'product' => $this->withPublicImageUrls($product->load('seller')->loadCount('favoritedBy')),
        ], 201);
    }

    public function show(Product $product): JsonResponse
    {
        return response()->json([
            'product' => $this->withPublicImageUrls($product->load('seller')->loadCount('favoritedBy')),
        ]);
    }

    public function image(Product $product, int $index)
    {
        $images = $product->images ?? [];
        $imageUrl = $images[$index] ?? null;

        abort_unless($imageUrl, 404);

        $localPath = $this->localStoragePath($imageUrl);

        if ($localPath && Storage::disk('public')->exists($localPath)) {
            return response()->file(Storage::disk('public')->path($localPath));
        }

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
            'product' => $this->withPublicImageUrls($product->load('seller')->loadCount('favoritedBy')),
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
        return filled($this->cloudinaryEnv('CLOUDINARY_CLOUD_NAME'))
            && filled($this->cloudinaryEnv('CLOUDINARY_API_KEY'))
            && filled($this->cloudinaryEnv('CLOUDINARY_API_SECRET'));
    }

    private function storeCloudinaryImage($image): string
    {
        $timestamp = time();
        $folder = $this->cloudinaryEnv('CLOUDINARY_FOLDER', 'vendora/products');
        $apiSecret = $this->cloudinaryEnv('CLOUDINARY_API_SECRET');
        $signature = sha1("folder={$folder}&timestamp={$timestamp}{$apiSecret}");

        $response = Http::attach(
            'file',
            fopen($image->getRealPath(), 'r'),
            Str::uuid().'.'.$image->getClientOriginalExtension()
        )->post('https://api.cloudinary.com/v1_1/'.$this->cloudinaryEnv('CLOUDINARY_CLOUD_NAME').'/image/upload', [
            'api_key' => $this->cloudinaryEnv('CLOUDINARY_API_KEY'),
            'folder' => $folder,
            'timestamp' => $timestamp,
            'signature' => $signature,
        ]);

        if (! $response->successful()) {
            Log::warning('Cloudinary product image upload failed.', [
                'status' => $response->status(),
                'body' => $response->json() ?: $response->body(),
            ]);

            abort(502, $response->json('error.message') ?: 'Could not upload product image.');
        }

        return $response->json('secure_url');
    }

    private function cloudinaryEnv(string $key, ?string $default = null): ?string
    {
        $value = env($key, $default);

        return is_string($value) ? trim($value) : $value;
    }

    private function withPublicImageUrls(Product $product): Product
    {
        $images = $product->images ?? [];

        $product->setAttribute('images', collect($images)
            ->keys()
            ->map(fn ($index) => $this->productImageUrl($product, $index))
            ->all());

        return $product;
    }

    private function productImageUrl(Product $product, int $index): string
    {
        $request = request();
        $scheme = $request->headers->get('x-forwarded-proto', $request->getScheme());
        $host = $request->getHost();

        if (str_ends_with($host, '.onrender.com')) {
            $scheme = 'https';
        }

        return "{$scheme}://{$host}/api/products/{$product->id}/images/{$index}";
    }

    private function localStoragePath(string $imageUrl): ?string
    {
        $path = parse_url($imageUrl, PHP_URL_PATH) ?: $imageUrl;
        $storagePrefix = '/storage/';

        if (!str_contains($path, $storagePrefix)) {
            return null;
        }

        return ltrim(Str::after($path, $storagePrefix), '/');
    }
}
