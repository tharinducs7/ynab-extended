<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class YNABAuthController extends Controller
{
    public function authenticate(Request $request)
    {
        Log::info('YNAB Authentication Started', ['ip' => $request->ip()]);
        try {
            // Validate the token
            Log::info('Validating token input');
            $request->validate(['token' => 'required|string']);
            $token = $request->input('token');
            Log::info('Token received', ['token' => $token]);

            // Fetch YNAB user data
            Log::info('Sending request to YNAB API for user data');
            $response = Http::withToken($token)
                ->timeout(10)
                ->get('https://api.youneedabudget.com/v1/user');

            Log::info('Received response from YNAB API for user data', [
                'status' => $response->status(),
                'body'   => $response->body()
            ]);

            if (!$response->successful()) {
                Log::error('YNAB API Request Failed', [
                    'status' => $response->status(),
                    'body'   => $response->body(),
                ]);
                return response()->json([
                    'error'   => 'Failed to authenticate with YNAB',
                    'details' => $response->body()
                ], 400);
            }

            $responseData = $response->json();
            Log::info('Parsed JSON from YNAB API user response', ['responseData' => $responseData]);

            if (!isset($responseData['data']['user']['id'])) {
                Log::error('Invalid YNAB API Response', [
                    'response' => $responseData
                ]);
                return response()->json([
                    'error'    => 'Received invalid data from YNAB',
                    'response' => $responseData
                ], 400);
            }

            $ynabUser = $responseData['data']['user'];
            Log::info('YNAB user data validated', ['ynabUser' => $ynabUser]);

            // Create or update the user record
            Log::info('Creating or updating user', ['ynab_user_id' => $ynabUser['id']]);
            $user = User::updateOrCreate(
                ['ynab_user_id' => $ynabUser['id']],
                [
                    'name'              => $ynabUser['name'] ?? 'YNAB User',
                    'email'             => $ynabUser['id'] . '@ynab.local',
                    'ynab_access_token' => $token,
                    'password'          => Hash::make(Str::random(40)),
                ]
            );
            Log::info('User created or updated successfully', ['user' => $user]);

            // Update token and save user
            $user->ynab_access_token = $token;
            $user->save();
            Log::info('User token updated and saved');

            // Fetch budgets with accounts
            $budgetsArrayWithAccounts = [];
            $defaultBudget = null;
            Log::info('Sending request to YNAB API for budgets with accounts');
            $budgetsResponse = Http::withToken($token)
                ->timeout(10)
                ->get('https://api.youneedabudget.com/v1/budgets?include_accounts=true');

            Log::info('Received response from YNAB API for budgets', [
                'status' => $budgetsResponse->status(),
                'body'   => $budgetsResponse->body()
            ]);

            if ($budgetsResponse->successful()) {
                $budgetsData = $budgetsResponse->json();
                Log::info('Parsed JSON from YNAB API budgets response', ['budgetsData' => $budgetsData]);
                $budgetsArrayWithAccounts = $budgetsData['data']['budgets'] ?? [];
                $defaultBudget = $budgetsData['data']['default_budget'] ?? null;
                Log::info('Budgets data processed', [
                    'budgetsArrayWithAccounts' => $budgetsArrayWithAccounts,
                    'defaultBudget'            => $defaultBudget
                ]);
            } else {
                Log::error('Failed to fetch budgets from YNAB', [
                    'status' => $budgetsResponse->status(),
                    'body'   => $budgetsResponse->body(),
                ]);
            }

            // Log the user in
            Auth::login($user);
            Log::info('User logged in successfully');

            // Store session data if needed
            session([
                'budgetsArrayWithAccounts' => $budgetsArrayWithAccounts,
                'defaultBudgetId'          => $defaultBudget['id'] ?? null,
            ]);
            Log::info('Session variables set', [
                'budgetsArrayWithAccounts' => session('budgetsArrayWithAccounts'),
                'defaultBudgetId'          => session('defaultBudgetId'),
            ]);

            Log::info('Rendering Dashboard Inertia page');
            return Inertia::render('dashboard', [
                'message'                  => 'Authentication successful!',
                'budgetsArrayWithAccounts' => $budgetsArrayWithAccounts,
                'defaultBudgetId'          => $defaultBudget['id'] ?? null,
            ]);

        } catch (\Exception $e) {
            Log::error('YNAB Authentication Error', [
                'message' => $e->getMessage(),
                'trace'   => $e->getTraceAsString()
            ]);
            return response()->json([
                'error'   => 'An unexpected error occurred',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
