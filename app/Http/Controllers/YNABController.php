<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Carbon\Carbon;

class YNABController extends Controller
{
    public function fetchAgeOfMoney(Request $request, $budgetId)
    {
        $token = $request->input('token');

        if (!$token) {
            return response()->json(['error' => 'YNAB token is required'], 400);
        }

        $response = Http::withToken($token)
            ->get("https://api.ynab.com/v1/budgets/{$budgetId}/months");

        if ($response->failed()) {
            \Log::error('YNAB API Error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            return response()->json(['error' => 'Failed to fetch YNAB data'], 500);
        }

        $data = $response->json();

        $currentMonth = Carbon::now()->startOfMonth();
        $earliestMonth = $currentMonth->copy()->subMonths(5); // Last 6 months including current

        $months = collect($data['data']['months'])
            ->filter(function ($month) use ($earliestMonth, $currentMonth) {
                $monthDate = Carbon::parse($month['month']);
                return $monthDate->between($earliestMonth, $currentMonth);
            })
            ->sortBy('month') // Ensure chronological order
            ->values();

        // Transform to chart data
        $ageOfMoneyData = $months->map(function ($month) {
            return [
                'month' => date('F', strtotime($month['month'])),
                'age_of_money' => $month['age_of_money']
            ];
        })->values()->toArray();

        // Calculate trend - current month vs previous month
        $currentMonthData = $months->last();
        $previousMonthData = $months->count() > 1 ? $months[$months->count() - 2] : null;

        $currentAgeOfMoney = $currentMonthData['age_of_money'] ?? null;
        $previousAgeOfMoney = $previousMonthData['age_of_money'] ?? null;

        $trendPercentage = null;
        $trendDirection = null;

        if ($previousAgeOfMoney !== null && $currentAgeOfMoney !== null) {
            $trendPercentage = round((($currentAgeOfMoney - $previousAgeOfMoney) / $previousAgeOfMoney) * 100, 2);

            if ($trendPercentage > 0) {
                $trendDirection = 'up';
            } elseif ($trendPercentage < 0) {
                $trendDirection = 'down';
            } else {
                $trendDirection = 'neutral';
            }
        }

        return response()->json([
            'chart_data' => $ageOfMoneyData,
            'current_age_of_money' => $currentAgeOfMoney,
            'trend_percentage' => $trendPercentage,
            'trend_direction' => $trendDirection,
        ]);
    }

    public function fetchScheduledTransactions(Request $request, $budgetId)
    {
        $token = $request->input('token');

        if (!$token) {
            return response()->json(['error' => 'YNAB token is required'], 400);
        }

        try {
            $today = Carbon::now();
            $currentMonth = $today->format('Y-m');
            $nextMonth = $today->copy()->addMonth()->format('Y-m');

            // Fetch all accounts
            $accountsResponse = Http::withToken($token)
                ->get("https://api.ynab.com/v1/budgets/{$budgetId}/accounts");

            $accounts = $accountsResponse->json('data.accounts', []);
            $accountDict = [];
            foreach ($accounts as $account) {
                $accountDict[$account['id']] = [
                    'account_name' => $account['name'] ?? 'Unknown Account',
                    'account_note' => $account['note'] ?? '',
                    'account_type' => $account['type'] ?? 'Unknown'
                ];
            }

            // Fetch scheduled transactions
            $scheduledResponse = Http::withToken($token)
                ->get("https://api.ynab.com/v1/budgets/{$budgetId}/scheduled_transactions");

            $scheduledTransactions = $scheduledResponse->json('data.scheduled_transactions', []);

            // Fetch actual transactions for the current month
            $transactionsResponse = Http::withToken($token)
                ->get("https://api.ynab.com/v1/budgets/{$budgetId}/months/{$currentMonth}-01/transactions");

            $transactions = $transactionsResponse->json('data.transactions', []);

            // Process actual transactions
            $paidTransactions = [];
            foreach ($transactions as $txn) {
                $acctDetails = $accountDict[$txn['account_id']] ?? [];
                $paidTransactions[] = [
                    'id' => $txn['id'],
                    'date' => $txn['date'],
                    'amount' => $txn['amount'] / 1000.0,
                    'memo' => $txn['memo'] ?? '',
                    'category_name' => $txn['category_name'] ?? 'Uncategorized',
                    'payee_name' => $txn['payee_name'] ?? 'Unknown Payee',
                    'account_name' => $acctDetails['account_name'] ?? 'Unknown Account',
                    'account_note' => $acctDetails['account_note'] ?? '',
                    'account_type' => $acctDetails['account_type'] ?? 'Unknown',
                ];
            }

            $totalScheduled = 0;
            $totalPaid = 0;
            $scheduledList = [];
            $todayStr = $today->format('Y-m-d');

            $nextMonthTransactions = [];

            // Process scheduled transactions
            foreach ($scheduledTransactions as $sTxn) {
                $amt = $sTxn['amount'] / 1000.0;
                $schedDate = $sTxn['date_next'];
                $schedMonth = substr($schedDate, 0, 7);
                $acctDetails = $accountDict[$sTxn['account_id']] ?? [];

                if ($schedMonth === $nextMonth) {
                    $nextMonthTransactions[] = [
                        'id' => $sTxn['id'],
                        'date' => $schedDate,
                        'amount' => $amt,
                        'memo' => $sTxn['memo'] ?? '',
                        'category_name' => $sTxn['category_name'] ?? 'Uncategorized',
                        'payee_name' => $sTxn['payee_name'] ?? 'Unknown Payee',
                        'account_name' => $acctDetails['account_name'] ?? 'Unknown Account',
                        'account_note' => $acctDetails['account_note'] ?? '',
                        'account_type' => $acctDetails['account_type'] ?? 'Unknown',
                    ];
                    continue;
                }

                if ($schedMonth === $currentMonth && $schedDate >= $todayStr) {
                    $totalScheduled += $amt;
                    $scheduledList[] = [
                        'id' => $sTxn['id'],
                        'date' => $schedDate,
                        'amount' => $amt,
                        'memo' => $sTxn['memo'] ?? '',
                        'category_name' => $sTxn['category_name'] ?? 'Uncategorized',
                        'payee_name' => $sTxn['payee_name'] ?? 'Unknown Payee',
                        'account_name' => $acctDetails['account_name'] ?? 'Unknown Account',
                        'account_note' => $acctDetails['account_note'] ?? '',
                        'account_type' => $acctDetails['account_type'] ?? 'Unknown',
                        'status' => 'To Be Paid',
                    ];
                }
            }

            // Match next month's scheduled transactions to paid transactions
            foreach ($nextMonthTransactions as $nTxn) {
                foreach ($paidTransactions as $pTxn) {
                    $amountMatch = abs($pTxn['amount'] - $nTxn['amount']) <= 1;
                    similar_text($pTxn['payee_name'], $nTxn['payee_name'], $payeeMatchPercentage);
                    $payeeMatch = $payeeMatchPercentage > 80;
                    $categoryMatch = $pTxn['category_name'] === $nTxn['category_name'];

                    if ($amountMatch && $payeeMatch && $categoryMatch) {
                        $totalPaid += $nTxn['amount'];
                        $scheduledList[] = [
                            'id' => $nTxn['id'],
                            'date' => $pTxn['date'],  // Paid date
                            'amount' => $nTxn['amount'],
                            'memo' => $nTxn['memo'] ?? '',
                            'category_name' => $nTxn['category_name'] ?? 'Uncategorized',
                            'payee_name' => $nTxn['payee_name'] ?? 'Unknown Payee',
                            'account_name' => $pTxn['account_name'],
                            'account_note' => $pTxn['account_note'],
                            'account_type' => $pTxn['account_type'],
                            'status' => 'Paid',
                        ];
                        break;
                    }
                }
            }

            // Sort: unpaid transactions first, then by date
            usort($scheduledList, function ($a, $b) {
                return $a['status'] === 'Paid' ? 1 : ($a['date'] <=> $b['date']);
            });

            $toBePaid = $totalScheduled - $totalPaid;

            // Calculate percentage paid (avoid division by zero)
            $percentagePaid = $totalScheduled > 0 ? round(($totalPaid / $totalScheduled) * 100, 2) : 0;

            return response()->json([
                'overview' => [
                    'month' => $currentMonth,
                    'totalScheduled' => round($totalScheduled, 2),
                    'totalPaid' => round($totalPaid, 2),
                    'toBePaid' => round($toBePaid, 2),
                    'remainingBalance' => round($toBePaid, 2),
                    'percentagePaid' => $percentagePaid,
                ],
                'scheduledTransactions' => $scheduledList
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch scheduled transactions',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function fetchCategories(Request $request, $budgetId)
    {
        $token = $request->input('token');

        if (!$token) {
            return response()->json(['error' => 'YNAB token is required'], 400);
        }

        $response = Http::withToken($token)
            ->get("https://api.ynab.com/v1/budgets/{$budgetId}/categories");

        if ($response->failed()) {
            \Log::error('YNAB API Error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            return response()->json(['error' => 'Failed to fetch YNAB categories'], 500);
        }

        $data = $response->json();

        return response()->json($data);
    }

}
