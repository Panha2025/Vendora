<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Firebase\JWT\JWT;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Facades\Socialite;
use Symfony\Component\HttpFoundation\RedirectResponse;

class AuthController extends Controller
{
    private array $oauthProviders = ['google', 'facebook', 'apple'];

    public function oauthProviders(): JsonResponse
    {
        return response()->json([
            'providers' => collect($this->oauthProviders)
                ->mapWithKeys(fn (string $provider) => [
                    $provider => $this->isProviderAvailable($provider),
                ]),
        ]);
    }

    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'phone' => ['required', 'string', 'max:40'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', 'min:8'],
            'avatar' => ['required', 'image', 'mimes:png,jpg,jpeg,webp', 'max:5120'],
        ]);

        $validated['name'] = trim($validated['name']);
        $validated['phone'] = trim($validated['phone']);

        $duplicateProfile = User::where('name', $validated['name'])
            ->where('phone', $validated['phone'])
            ->exists();

        if ($duplicateProfile) {
            throw ValidationException::withMessages([
                'phone' => ['An account already exists with this name and phone number.'],
            ]);
        }

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'password' => Hash::make($validated['password']),
            'role' => 'buyer',
            'avatar' => $this->storeAvatar($request->file('avatar')),
        ]);

        return response()->json([
            'token' => $user->createToken('marketplace-token')->plainTextToken,
            'user' => $user,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'email' => ['No account found with this email. Please create an account first.'],
            ]);
        }

        if (! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'password' => ['Incorrect password. Please try again.'],
            ]);
        }

        return response()->json([
            'token' => $user->createToken('marketplace-token')->plainTextToken,
            'user' => $user,
        ]);
    }

    public function user(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user(),
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'phone' => ['required', 'string', 'max:40'],
            'avatar' => ['sometimes', 'image', 'mimes:png,jpg,jpeg,webp', 'max:5120'],
        ]);

        $validated['name'] = trim($validated['name']);
        $validated['phone'] = trim($validated['phone']);

        $duplicateProfile = User::where('name', $validated['name'])
            ->where('phone', $validated['phone'])
            ->whereKeyNot($user->id)
            ->exists();

        if ($duplicateProfile) {
            throw ValidationException::withMessages([
                'phone' => ['An account already exists with this name and phone number.'],
            ]);
        }

        $updates = [
            'name' => $validated['name'],
            'phone' => $validated['phone'],
        ];

        if ($request->hasFile('avatar')) {
            $updates['avatar'] = $this->storeAvatar($request->file('avatar'));
        }

        $user->forceFill($updates)->save();

        return response()->json([
            'user' => $user->fresh(),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    public function oauthRedirect(Request $request, string $provider): JsonResponse
    {
        $provider = strtolower($provider);
        abort_unless(in_array($provider, $this->oauthProviders, true), 404);

        if ($provider === 'apple') {
            if (! $this->isProviderConfigured($provider)) {
                if ($this->isDemoOAuthEnabled()) {
                    return $this->demoOAuthRedirect($provider);
                }

                return response()->json([
                    'message' => 'Apple OAuth is not configured yet.',
                ], 422);
            }

            return response()->json([
                'url' => $this->appleAuthorizationUrl(),
            ]);
        }

        if (! $this->isProviderConfigured($provider)) {
            if ($this->isDemoOAuthEnabled()) {
                return $this->demoOAuthRedirect($provider);
            }

            return response()->json([
                'message' => ucfirst($provider).' OAuth is not configured yet.',
            ], 422);
        }

        return response()->json([
            'url' => Socialite::driver($provider)->stateless()->redirect()->getTargetUrl(),
        ]);
    }

    public function oauthCallback(Request $request, string $provider): RedirectResponse
    {
        $provider = strtolower($provider);
        abort_unless(in_array($provider, $this->oauthProviders, true), 404);

        $user = $provider === 'apple'
            ? $this->resolveAppleUser($request)
            : $this->resolveSocialiteUser($provider);

        $token = $user->createToken('marketplace-token')->plainTextToken;
        $payload = rawurlencode(base64_encode(json_encode($user)));
        $frontendUrl = rtrim(env('FRONTEND_URL', 'http://127.0.0.1:5180'), '/');

        return redirect()->away("$frontendUrl?oauth_token=$token&oauth_user=$payload");
    }

    private function resolveSocialiteUser(string $provider): User
    {
        $socialUser = Socialite::driver($provider)->stateless()->user();
        $email = $socialUser->getEmail();

        abort_unless($email, 422, ucfirst($provider).' did not provide an email address.');

        return $this->findOrCreateOAuthUser(
            provider: $provider,
            providerId: (string) $socialUser->getId(),
            name: $socialUser->getName() ?: $socialUser->getNickname() ?: Str::before($email, '@'),
            email: $email,
            avatar: $socialUser->getAvatar(),
        );
    }

    private function appleAuthorizationUrl(): string
    {
        abort_unless($this->isProviderConfigured('apple'), 422, 'Apple OAuth is not configured yet.');

        return 'https://appleid.apple.com/auth/authorize?'.http_build_query([
            'client_id' => config('services.apple.client_id'),
            'redirect_uri' => config('services.apple.redirect'),
            'response_type' => 'code',
            'scope' => 'name email',
            'response_mode' => 'form_post',
        ]);
    }

    private function resolveAppleUser(Request $request): User
    {
        $request->validate([
            'code' => ['required', 'string'],
        ]);

        $tokenResponse = Http::asForm()->post('https://appleid.apple.com/auth/token', [
            'client_id' => config('services.apple.client_id'),
            'client_secret' => $this->appleClientSecret(),
            'code' => $request->input('code'),
            'grant_type' => 'authorization_code',
            'redirect_uri' => config('services.apple.redirect'),
        ]);

        abort_unless($tokenResponse->successful(), 422, 'Apple login failed.');

        $idToken = $tokenResponse->json('id_token');
        $claims = $this->decodeJwtPayload($idToken);
        $email = $claims['email'] ?? null;
        $providerId = $claims['sub'] ?? null;
        $submittedUser = json_decode($request->input('user', '{}'), true) ?: [];
        $fullName = trim(implode(' ', array_filter([
            $submittedUser['name']['firstName'] ?? null,
            $submittedUser['name']['lastName'] ?? null,
        ])));

        abort_unless($email && $providerId, 422, 'Apple did not provide account details.');

        return $this->findOrCreateOAuthUser(
            provider: 'apple',
            providerId: (string) $providerId,
            name: $fullName ?: Str::before($email, '@'),
            email: $email,
        );
    }

    private function appleClientSecret(): string
    {
        $privateKey = str_replace('\n', "\n", (string) config('services.apple.private_key'));

        return JWT::encode([
            'iss' => config('services.apple.team_id'),
            'iat' => time(),
            'exp' => time() + 60 * 60,
            'aud' => 'https://appleid.apple.com',
            'sub' => config('services.apple.client_id'),
        ], $privateKey, 'ES256', config('services.apple.key_id'));
    }

    private function decodeJwtPayload(string $jwt): array
    {
        $parts = explode('.', $jwt);
        $payload = $parts[1] ?? '';
        $payload .= str_repeat('=', (4 - strlen($payload) % 4) % 4);

        return json_decode(base64_decode(strtr($payload, '-_', '+/')), true) ?: [];
    }

    private function isProviderConfigured(string $provider): bool
    {
        if ($provider === 'apple') {
            return (bool) (
                config('services.apple.client_id')
                && config('services.apple.team_id')
                && config('services.apple.key_id')
                && config('services.apple.private_key')
                && config('services.apple.redirect')
            );
        }

        return (bool) (
            config("services.$provider.client_id")
            && config("services.$provider.client_secret")
            && config("services.$provider.redirect")
        );
    }

    private function isProviderAvailable(string $provider): bool
    {
        return $this->isProviderConfigured($provider) || $this->isDemoOAuthEnabled();
    }

    private function isDemoOAuthEnabled(): bool
    {
        return app()->environment('local') || (bool) env('OAUTH_DEMO_ENABLED', false);
    }

    private function demoOAuthRedirect(string $provider): JsonResponse
    {
        $user = User::firstOrCreate(
            [
                'provider' => $provider,
                'provider_id' => "demo-$provider",
            ],
            [
                'name' => ucfirst($provider).' Demo User',
                'email' => "$provider.demo@vendora.local",
                'email_verified_at' => now(),
                'password' => null,
                'role' => 'buyer',
            ],
        );

        $token = $user->createToken('marketplace-token')->plainTextToken;
        $payload = rawurlencode(base64_encode(json_encode($user)));
        $frontendUrl = rtrim(env('FRONTEND_URL', 'http://127.0.0.1:5180'), '/');

        return response()->json([
            'url' => "$frontendUrl?oauth_token=$token&oauth_user=$payload",
        ]);
    }

    private function findOrCreateOAuthUser(
        string $provider,
        string $providerId,
        string $name,
        string $email,
        ?string $avatar = null,
    ): User {
        $user = User::where('provider', $provider)
            ->where('provider_id', $providerId)
            ->first()
            ?: User::where('email', $email)->first();

        if ($user) {
            $user->forceFill([
                'name' => $user->name ?: $name,
                'email_verified_at' => $user->email_verified_at ?: now(),
                'provider' => $provider,
                'provider_id' => $providerId,
                'avatar' => $avatar ?: $user->avatar,
            ])->save();

            return $user;
        }

        return User::create([
            'name' => $name,
            'email' => $email,
            'email_verified_at' => now(),
            'password' => null,
            'role' => 'buyer',
            'provider' => $provider,
            'provider_id' => $providerId,
            'avatar' => $avatar,
        ]);
    }

    private function storeAvatar($image): string
    {
        if (env('PRODUCT_IMAGE_STORAGE') === 'cloudinary' && $this->hasCloudinaryConfig()) {
            return $this->storeCloudinaryAvatar($image);
        }

        $path = $image->storePublicly('avatars', [
            'disk' => env('PRODUCT_IMAGE_DISK', 'public'),
        ]);

        return Storage::disk(env('PRODUCT_IMAGE_DISK', 'public'))->url($path);
    }

    private function storeCloudinaryAvatar($image): string
    {
        $credentials = $this->cloudinaryCredentials();
        $timestamp = time();
        $folder = $this->cloudinaryEnv('CLOUDINARY_AVATAR_FOLDER', 'vendora/avatars');
        $signature = sha1("folder={$folder}&timestamp={$timestamp}{$credentials['api_secret']}");

        $response = Http::attach(
            'file',
            fopen($image->getRealPath(), 'r'),
            Str::uuid().'.'.$image->getClientOriginalExtension()
        )->post('https://api.cloudinary.com/v1_1/'.$credentials['cloud_name'].'/image/upload', [
            'api_key' => $credentials['api_key'],
            'folder' => $folder,
            'timestamp' => $timestamp,
            'signature' => $signature,
        ]);

        if (! $response->successful()) {
            Log::warning('Cloudinary avatar upload failed.', [
                'status' => $response->status(),
                'body' => $response->json() ?: $response->body(),
            ]);

            abort(502, $response->json('error.message') ?: 'Could not upload profile picture.');
        }

        return $response->json('secure_url');
    }

    private function hasCloudinaryConfig(): bool
    {
        $credentials = $this->cloudinaryCredentials();

        return filled($credentials['cloud_name'])
            && filled($credentials['api_key'])
            && filled($credentials['api_secret']);
    }

    private function cloudinaryEnv(string $key, ?string $default = null): ?string
    {
        $value = env($key, $default);

        return is_string($value) ? trim($value) : $value;
    }

    private function cloudinaryCredentials(): array
    {
        $cloudinaryUrl = $this->cloudinaryEnv('CLOUDINARY_URL');

        if ($cloudinaryUrl) {
            $parts = parse_url($cloudinaryUrl);

            if ($parts && isset($parts['host'], $parts['user'], $parts['pass'])) {
                return [
                    'cloud_name' => trim($parts['host']),
                    'api_key' => trim($parts['user']),
                    'api_secret' => trim($parts['pass']),
                ];
            }
        }

        return [
            'cloud_name' => $this->cloudinaryEnv('CLOUDINARY_CLOUD_NAME'),
            'api_key' => $this->cloudinaryEnv('CLOUDINARY_API_KEY'),
            'api_secret' => $this->cloudinaryEnv('CLOUDINARY_API_SECRET'),
        ];
    }
}
