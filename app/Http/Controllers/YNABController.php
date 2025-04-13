<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;

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

        // Generate a unique cache key using the budget ID and a hash of the token.
        $cacheKey = "ynab_categories_{$budgetId}_" . md5($token);

        // Cache the result for 2 hours (instead of 1 hour).
        $result = Cache::remember($cacheKey, now()->addHours(2), function () use ($token, $budgetId) {
            $response = Http::withToken($token)
                ->get("https://api.ynab.com/v1/budgets/{$budgetId}/categories");

            if ($response->failed()) {
                \Log::error('YNAB API Error - Fetch Categories', [
                    'status' => $response->status(),
                    'body'   => $response->body(),
                ]);
                return null;
            }

            $data = $response->json();

            // Optionally transform/filter categories as needed
            return $data;
        });

        // If the cache callback returned null, the API call failed
        if ($result === null) {
            return response()->json(['error' => 'Failed to fetch YNAB categories'], 500);
        }

        return response()->json($result);
    }

    public function fetchCategoryTransactions(Request $request, $budgetId, $categoryId)
    {
        $token = $request->input('token');

        if (!$token) {
            return response()->json(['error' => 'YNAB token is required'], 400);
        }

        $response = Http::withToken($token)
            ->get("https://api.ynab.com/v1/budgets/{$budgetId}/categories/{$categoryId}/transactions");

        if ($response->failed()) {
            \Log::error('YNAB API Error', [
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);
            return response()->json(['error' => 'Failed to fetch YNAB category transactions'], 500);
        }

        $data = $response->json();
        $transactions = $data['data']['transactions'];

        // Define period: from 13 months ago (starting at the beginning of that month)
        // until the end of the current month.
        $now = \Carbon\Carbon::now();
        $endMonth = $now->copy()->endOfMonth();
        $startMonth = $now->copy()->subMonths(13)->startOfMonth();

        // --------------------------
        // 1. Compute payee chart data for a pie chart:
        //    - Filter transactions within the period.
        //    - Group transactions by payee and sum spending (using absolute values).
        //    - Sort descending and pick the top 5 payees.
        //    - Build an array for the pie chart and a legend array.
        // --------------------------
        $filteredTransactions = [];
        foreach ($transactions as $txn) {
            $txnDate = \Carbon\Carbon::parse($txn['date']);
            if ($txnDate->between($startMonth, $endMonth, true)) {
                $filteredTransactions[] = $txn;
            }
        }

        $payeeChartData = [];
        foreach ($filteredTransactions as $txn) {
            $payee = $txn['payee_name'] ?? 'Unknown';
            // Convert from minor units to major units and use absolute value.
            $amount = abs($txn['amount'] / 1000.0);

            if (isset($payeeChartData[$payee])) {
                $payeeChartData[$payee] += $amount;
            } else {
                $payeeChartData[$payee] = $amount;
            }
        }

        // Sort by spending (highest first) and take top 5.
        arsort($payeeChartData);
        $topPayees = array_slice($payeeChartData, 0, 5, true);

        $payeeChartDataArr = [];
        $legend = [];
        foreach ($topPayees as $payee => $activity) {
            $payeeChartDataArr[] = [
                'payee'    => $payee,
                'activity' => $activity,
            ];
            $legend[] = $payee;
        }

        // --------------------------
        // 2. Compute monthly spending chart data:
        //    - Initialize a month-by-month array for the period.
        //    - Sum raw amounts for each month (using raw values so that income offsets spending).
        //    - Post-process: if the net is negative (net expense), use its absolute value; if positive, set spending to 0.
        // --------------------------
        $monthlyChartDataAssoc = [];
        $period = new \DatePeriod($startMonth, new \DateInterval('P1M'), $endMonth->copy()->addMonth()->startOfMonth());
        foreach ($period as $dt) {
            $label = $dt->format('y M'); // e.g. "24 Jan"
            $monthlyChartDataAssoc[$dt->format('Y-m')] = [
                'month'    => $label,
                'spending' => 0,
            ];
        }

        foreach ($transactions as $txn) {
            $txnDate = \Carbon\Carbon::parse($txn['date']);
            if ($txnDate->between($startMonth, $endMonth, true)) {
                $monthKey = $txnDate->format('Y-m');
                $amount = $txn['amount'] / 1000.0; // raw value: negative for expenses, positive for income
                if (isset($monthlyChartDataAssoc[$monthKey])) {
                    $monthlyChartDataAssoc[$monthKey]['spending'] += $amount;
                }
            }
        }

        foreach ($monthlyChartDataAssoc as $key => $data) {
            if ($data['spending'] < 0) {
                $monthlyChartDataAssoc[$key]['spending'] = abs($data['spending']);
            } else {
                $monthlyChartDataAssoc[$key]['spending'] = 0;
            }
        }
        $monthlyChartDataArr = array_values($monthlyChartDataAssoc);

        return response()->json([
            'transactions'     => $transactions,
            'payeeChartData'   => $payeeChartDataArr,
            'legend'           => $legend,
            'monthlyChartData' => $monthlyChartDataArr,
        ]);
    }

    public function fetchPayees(Request $request, $budgetId)
    {
        $token = $request->input('token');

        if (!$token) {
            return response()->json(['error' => 'YNAB token is required'], 400);
        }

        // Generate a unique cache key using the budget ID and a hash of the token.
        $cacheKey = "ynab_payees_{$budgetId}_" . md5($token);

        // Cache the result for 1 hour.
        $result = Cache::remember($cacheKey, now()->addHour(), function () use ($token, $budgetId) {
            $response = Http::withToken($token)
                ->get("https://api.ynab.com/v1/budgets/{$budgetId}/payees");

            if ($response->failed()) {
                \Log::error('YNAB API Error - Fetch Payees', [
                    'status' => $response->status(),
                    'body'   => $response->body(),
                ]);
                return null;
            }

            $data = $response->json();

            // Optional: transform or filter data as needed.
            $payees = collect($data['data']['payees'])->map(function ($payee) {
                return [
                    'id'      => $payee['id'],
                    'name'    => $payee['name'],
                    'deleted' => $payee['deleted'],
                ];
            })->values();

            return ['payees' => $payees];
        });

        if ($result === null) {
            return response()->json(['error' => 'Failed to fetch YNAB payees'], 500);
        }

        return response()->json($result);
    }

    public function fetchTransactionsByAccount(Request $request, $budgetId, $accountId)
    {
        $token = $request->input('token');
        if (!$token) {
            return response()->json(['error' => 'YNAB token is required'], 400);
        }

        // Generate a unique cache key. We use md5 to safely include the token.
        $cacheKey = "ynab_transactions_{$budgetId}_{$accountId}_" . md5($token);

        // Cache the result for 5 minutes
        $result = Cache::remember($cacheKey, now()->addMinutes(5), function () use ($token, $budgetId, $accountId) {
            $response = Http::withToken($token)
                ->get("https://api.ynab.com/v1/budgets/{$budgetId}/accounts/{$accountId}/transactions");

            if ($response->failed()) {
                \Log::error('YNAB API Error - Fetch Transactions by Account', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                // Return null if the API call failed so we can handle it outside of the cache closure.
                return null;
            }

            $data = $response->json();
            $transactions = $data['data']['transactions'] ?? [];

            // Sort transactions by date descending (latest first)
            usort($transactions, function ($a, $b) {
                return strtotime($b['date']) - strtotime($a['date']);
            });

            // Group transactions by month using the "Y-m" format (e.g., "2025-04")
            $groupedTransactions = [];
            foreach ($transactions as $transaction) {
                $monthKey = date('Y-m', strtotime($transaction['date']));
                $groupedTransactions[$monthKey][] = $transaction;
            }

            // Sort groups by month key in descending order
            krsort($groupedTransactions);

            return ['transactions' => $groupedTransactions];
        });

        // If the cache callback returned null, then the API call failed.
        if ($result === null) {
            return response()->json(['error' => 'Failed to fetch YNAB transactions for account'], 500);
        }

        return response()->json($result);
    }

    public function fetchTransactionsByPayee(Request $request, $budgetId, $payeeId)
    {
        $token = $request->input('token');
        if (!$token) {
            return response()->json(['error' => 'YNAB token is required'], 400);
        }

        // Generate a cache key
        $cacheKey = "ynab_transactions_payee_{$budgetId}_{$payeeId}_" . md5($token);

        $result = Cache::remember($cacheKey, now()->addMinutes(5), function () use ($token, $budgetId, $payeeId) {
            // Fetch the raw transactions + subtransactions from YNAB
            $response = Http::withToken($token)
                ->get("https://api.ynab.com/v1/budgets/{$budgetId}/payees/{$payeeId}/transactions");

            if ($response->failed()) {
                \Log::error('YNAB API Error - Fetch Transactions by Payee', [
                    'status' => $response->status(),
                    'body'   => $response->body(),
                ]);
                return null;
            }

            // The API returns both parent transactions and subtransactions in a flattened array
            $data = $response->json();
            $items = $data['data']['transactions'] ?? [];

            // Step 1: Separate them into parents and children
            $parents = [];
            $childrenMap = []; // key: parent_transaction_id => array of subtransactions

            foreach ($items as $item) {
                // Convert from milliunits to normal currency
                $item['amount'] = $item['amount'] / 1000.0;

                if ($item['type'] === 'transaction') {
                    // This is a parent-level transaction
                    $parents[$item['id']] = $item;
                } elseif ($item['type'] === 'subtransaction') {
                    // This is a subtransaction, belongs to a parent
                    $pId = $item['parent_transaction_id'];
                    if (!isset($childrenMap[$pId])) {
                        $childrenMap[$pId] = [];
                    }
                    $childrenMap[$pId][] = $item;
                }
            }

            // Step 2: Attach subtransactions to their parent, if they exist
            //         and sort everything by date descending
            // We need a single unified array that has:
            //   [ [parent + subtransactions], [parent + subtransactions], ...]
            $unifiedTransactions = [];

            foreach ($parents as $parentId => $parentTx) {
                // If this parent has subtransactions, attach them
                if (isset($childrenMap[$parentId])) {
                    $parentTx['subtransactions'] = $childrenMap[$parentId];
                } else {
                    $parentTx['subtransactions'] = [];
                }
                $unifiedTransactions[] = $parentTx;
            }

            // In some YNAB data sets, there might be subtransactions whose parent wasn't
            // in $parents. This is rare, but let's handle it anyway.
            // We can treat each orphan subtransaction as a standalone "transaction".
            // Usually won't happen, but just in case:
            foreach ($childrenMap as $pId => $subs) {
                if (!isset($parents[$pId])) {
                    // Make a dummy parent with these subtransactions
                    $dummyParent = [
                        'id' => $pId,
                        'date' => $subs[0]['date'] ?? '2025-01-01', // fallback
                        'amount' => 0, // no parent amount
                        'memo' => 'Orphaned subtransaction(s)',
                        'type' => 'transaction',
                        'category_name' => 'Unknown Category',
                        'subtransactions' => $subs,
                    ];
                    $unifiedTransactions[] = $dummyParent;
                }
            }

            // Sort the unifiedTransactions by date DESC
            usort($unifiedTransactions, function ($a, $b) {
                // parse the date. If missing date, fallback
                return strtotime($b['date'] ?? '1900-01-01') - strtotime($a['date'] ?? '1900-01-01');
            });

            // Step 3: Calculate analytics
            $totalSpent = 0.0;
            $totalReceived = 0.0;
            $categoryBreakdown = [];

            // For each parent, if subtransactions exist, sum them. Otherwise sum parent.
            foreach ($unifiedTransactions as &$parentTx) {
                $hasSubtransactions = !empty($parentTx['subtransactions']);

                if ($hasSubtransactions) {
                    // We IGNORE the parent's `amount` to avoid double-counting,
                    // and sum all subtransactions instead.
                    foreach ($parentTx['subtransactions'] as &$sub) {
                        $catName = $sub['category_name'] ?? 'Unknown Category';
                        $amt = $sub['amount'];

                        if ($amt < 0) {
                            $totalSpent += abs($amt);
                        } else {
                            $totalReceived += $amt;
                        }

                        if (!isset($categoryBreakdown[$catName])) {
                            $categoryBreakdown[$catName] = [
                                'spent' => 0.0,
                                'received' => 0.0,
                            ];
                        }

                        if ($amt < 0) {
                            $categoryBreakdown[$catName]['spent'] += abs($amt);
                        } else {
                            $categoryBreakdown[$catName]['received'] += $amt;
                        }
                    }
                } else {
                    // No subtransactions => just sum the parent
                    $catName = $parentTx['category_name'] ?? 'Unknown Category';
                    $amt = $parentTx['amount'];

                    if ($amt < 0) {
                        $totalSpent += abs($amt);
                    } else {
                        $totalReceived += $amt;
                    }

                    if (!isset($categoryBreakdown[$catName])) {
                        $categoryBreakdown[$catName] = [
                            'spent' => 0.0,
                            'received' => 0.0,
                        ];
                    }

                    if ($amt < 0) {
                        $categoryBreakdown[$catName]['spent'] += abs($amt);
                    } else {
                        $categoryBreakdown[$catName]['received'] += $amt;
                    }
                }
            }

            // Return everything
            return [
                // We’ll return the unified list of parent + subtransactions
                // so the frontend can see them easily
                'transactions' => $unifiedTransactions,
                'analytics' => [
                    'totalSpent' => round($totalSpent, 2),
                    'totalReceived' => round($totalReceived, 2),
                    'categoryBreakdown' => $categoryBreakdown,
                ],
            ];
        });

        if ($result === null) {
            return response()->json(['error' => 'Failed to fetch YNAB transactions for payee'], 500);
        }

        return response()->json($result);
    }

    public function fetchMonths(Request $request, $budgetId)
    {
        $token = $request->input('token');

        if (!$token) {
            return response()->json(['error' => 'YNAB token is required'], 400);
        }

        // Generate a cache key
        $cacheKey = "ynab_months_{$budgetId}_" . md5($token);

        // Cache the result for 2 hours
        $result = Cache::remember($cacheKey, now()->addHours(2), function () use ($token, $budgetId) {
            $response = Http::withToken($token)
                ->get("https://api.ynab.com/v1/budgets/{$budgetId}/months");

            if ($response->failed()) {
                \Log::error('YNAB API Error - Fetch Months', [
                    'status' => $response->status(),
                    'body'   => $response->body(),
                ]);
                // Return null so we can handle it below
                return null;
            }

            // Return the full response JSON (or transform it if you wish)
            return $response->json();
        });

        // If the cache callback returned null, the API call failed.
        if ($result === null) {
            return response()->json(['error' => 'Failed to fetch YNAB months'], 500);
        }

        return response()->json($result);
    }

}
