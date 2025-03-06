<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

class YNABAuthController extends Controller
{
    public function authenticate(Request $request)
    {
        try {
            // Validate the token
            $request->validate(['token' => 'required|string']);

            $token = $request->input('token');

            // Fetch YNAB user data with more robust error handling
            $response = Http::withToken($token)
                ->timeout(10) // Set a timeout
                ->get('https://api.youneedabudget.com/v1/user');

            // Check if the request was successful
            if (!$response->successful()) {
                Log::error('YNAB API Request Failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return response()->json([
                    'error' => 'Failed to authenticate with YNAB',
                    'details' => $response->body()
                ], 400);
            }

            // More robust JSON parsing
            $responseData = $response->json();

            // Validate the response structure
            if (!isset($responseData['data']['user']['id'])) {
                Log::error('Invalid YNAB API Response', [
                    'response' => $responseData
                ]);

                return response()->json([
                    'error' => 'Received invalid data from YNAB',
                    'response' => $responseData
                ], 400);
            }

            $ynabUser = $responseData['data']['user'];

            // Create or update user with password handling
            $user = User::updateOrCreate(
                ['ynab_user_id' => $ynabUser['id']],
                [
                    'name' => $ynabUser['name'] ?? 'YNAB User',
                    'email' => $ynabUser['id'] . '@ynab.local',
                    'ynab_access_token' => $token,
                    // Generate a secure random password
                    'password' => Hash::make(Str::random(40)),
                ]
            );

            // Ensure the token is always updated
            $user->ynab_access_token = $token;
            $user->save();

            // Initialize budgets variables with default values
            $budgetsArrayWithAccounts = [];
            $defaultBudget = null;

            // Fetch budgets with accounts
            $budgetsResponse = Http::withToken($token)
                ->timeout(10)
                ->get('https://api.youneedabudget.com/v1/budgets?include_accounts=true');

            if ($budgetsResponse->successful()) {
                $budgetsData = $budgetsResponse->json();

                $budgetsArrayWithAccounts = $budgetsData['data']['budgets'] ?? [];
                $defaultBudget = $budgetsData['data']['default_budget'] ?? null;

                Log::info('YNAB Budgets Response', ['response' => $budgetsData]);

                if ($defaultBudget) {
                    Log::info('Found Default Budget', ['id' => $defaultBudget['id'], 'name' => $defaultBudget['name']]);
                } else {
                    Log::warning('No Default Budget Found');
                }
            } else {
                Log::error('Failed to fetch budgets from YNAB', [
                    'status' => $budgetsResponse->status(),
                    'body' => $budgetsResponse->body(),
                ]);
            }
            // Log the user in
            Auth::login($user);

            session([
                'budgetsArrayWithAccounts' => $budgetsArrayWithAccounts,
                'defaultBudgetId' => $defaultBudget['id'] ?? null,
            ]);

            Log::info('Session Check After Setting', [
                'budgetsArrayWithAccounts' => session('budgetsArrayWithAccounts'),
                'defaultBudgetId' => session('defaultBudgetId'),
            ]);

            Log::info('Session After YNAB Fetch', session()->all());

            return to_route('dashboard');  // No ->with()

        } catch (\Exception $e) {
            // Catch and log any unexpected errors
            Log::error('YNAB Authentication Error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'error' => 'An unexpected error occurred',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
