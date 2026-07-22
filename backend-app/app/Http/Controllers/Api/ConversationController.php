<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConversationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $conversations = Conversation::query()
            ->where(function (Builder $query) use ($userId) {
                $query
                    ->where('buyer_id', $userId)
                    ->orWhere('seller_id', $userId);
            })
            ->with([
                'buyer',
                'seller',
                'product.seller',
                'messages.sender',
            ])
            ->withCount([
                'messages as unread_count' => fn (Builder $query) => $query
                    ->where('sender_id', '!=', $userId)
                    ->whereNull('read_at'),
            ])
            ->latest('updated_at')
            ->get();

        return response()->json([
            'conversations' => $conversations,
        ]);
    }

    public function markRead(Request $request, Conversation $conversation): JsonResponse
    {
        $userId = $request->user()->id;

        abort_unless(
            $conversation->buyer_id === $userId || $conversation->seller_id === $userId,
            403,
        );

        $conversation->messages()
            ->where('sender_id', '!=', $userId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json([
            'conversation' => $conversation->load([
                'buyer',
                'seller',
                'product.seller',
                'messages.sender',
            ]),
        ]);
    }

    public function store(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'message' => ['nullable', 'string', 'max:2000'],
        ]);

        $conversation = Conversation::firstOrCreate(
            [
                'product_id' => $product->id,
                'buyer_id' => $request->user()->id,
            ],
            [
                'seller_id' => $product->user_id,
            ],
        );

        if ($conversation->wasRecentlyCreated && ! empty($validated['message'])) {
            $conversation->messages()->create([
                'sender_id' => $request->user()->id,
                'body' => $validated['message'],
            ]);
            $conversation->touch();
        }

        return response()->json([
            'conversation' => $conversation->load([
                'buyer',
                'seller',
                'product.seller',
                'messages.sender',
            ])->loadCount([
                'messages as unread_count' => fn (Builder $query) => $query
                    ->where('sender_id', '!=', $request->user()->id)
                    ->whereNull('read_at'),
            ]),
        ], 201);
    }

    public function sendMessage(Request $request, Conversation $conversation): JsonResponse
    {
        $userId = $request->user()->id;

        abort_unless(
            $conversation->buyer_id === $userId || $conversation->seller_id === $userId,
            403,
        );

        $validated = $request->validate([
            'message' => ['required', 'string', 'max:2000'],
        ]);

        $conversation->messages()
            ->where('sender_id', '!=', $userId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        $message = $conversation->messages()->create([
            'sender_id' => $userId,
            'body' => $validated['message'],
        ]);

        $conversation->touch();

        return response()->json([
            'message' => $message->load('sender'),
            'conversation' => $conversation->load([
                'buyer',
                'seller',
                'product.seller',
                'messages.sender',
            ])->loadCount([
                'messages as unread_count' => fn (Builder $query) => $query
                    ->where('sender_id', '!=', $userId)
                    ->whereNull('read_at'),
            ]),
        ], 201);
    }
}
