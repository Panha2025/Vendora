<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Firebase\JWT\JWT;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Facades\Socialite;
use Symfony\Component\HttpFoundation\RedirectResponse;

class AuthController extends Controller
{
    private array $oauthProviders = ['google', 'facebook', 'apple'];

    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'phone' => ['required', 'string', 'max:40'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', 'min:8'],
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
            $configured = config('services.apple.client_id')
                && config('services.apple.team_id')
                && config('services.apple.key_id')
                && config('services.apple.private_key')
                && config('services.apple.redirect');

            if (! $configured) {
                return response()->json([
                    'message' => 'Apple OAuth is not configured yet.',
                ], 422);
            }

            return response()->json([
                'url' => $this->appleAuthorizationUrl(),
            ]);
        }

        $configured = config("services.$provider.client_id")
            && config("services.$provider.client_secret")
            && config("services.$provider.redirect");

        if (! $configured) {
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
        $configured = config('services.apple.client_id')
            && config('services.apple.team_id')
            && config('services.apple.key_id')
            && config('services.apple.private_key')
            && config('services.apple.redirect');

        abort_unless($configured, 422, 'Apple OAuth is not configured yet.');

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
}
