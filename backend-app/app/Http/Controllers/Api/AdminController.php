<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    public function overview(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);

        $users = User::query()
            ->withCount(['products', 'buyerConversations', 'sellerConversations'])
            ->latest()
            ->get();

        $products = Product::query()
            ->with(['seller'])
            ->withCount('conversations')
            ->latest()
            ->get();

        $categories = Product::query()
            ->select('category', DB::raw('COUNT(*) as products_count'))
            ->groupBy('category')
            ->orderByDesc('products_count')
            ->get();

        $conversations = Conversation::query()
            ->with(['buyer', 'seller', 'product'])
            ->withCount('messages')
            ->latest('updated_at')
            ->limit(40)
            ->get();

        return response()->json([
            'stats' => [
                'users' => User::count(),
                'admins' => User::where('role', 'admin')->count(),
                'products' => Product::count(),
                'available_products' => Product::where('status', 'Available')->count(),
                'conversations' => Conversation::count(),
                'messages' => Message::count(),
                'unread_messages' => Message::whereNull('read_at')->count(),
            ],
            'users' => $users,
            'products' => $products,
            'categories' => $categories,
            'conversations' => $conversations,
        ]);
    }

    public function destroyProduct(Request $request, Product $product): JsonResponse
    {
        $this->authorizeAdmin($request);

        $product->delete();

        return response()->json([
            'message' => 'Product removed by admin.',
        ]);
    }

    public function destroyUser(Request $request, User $user): JsonResponse
    {
        $this->authorizeAdmin($request);

        abort_if($request->user()->id === $user->id, 422, 'You cannot remove your own admin account.');
        abort_if($user->role === 'admin', 422, 'Admin accounts cannot be removed from this page.');

        $user->delete();

        return response()->json([
            'message' => 'User removed by admin.',
        ]);
    }

    public function renameCategory(Request $request, string $category): JsonResponse
    {
        $this->authorizeAdmin($request);

        $validated = $request->validate([
            'new_category' => ['required', 'string', 'max:80'],
        ]);

        $updated = Product::where('category', $category)->update([
            'category' => trim($validated['new_category']),
        ]);

        return response()->json([
            'message' => 'Category renamed.',
            'updated_products' => $updated,
        ]);
    }

    private function authorizeAdmin(Request $request): void
    {
        abort_unless(
            $request->user()?->role === 'admin',
            403,
            'Only admins can use this area.',
        );
    }
}
