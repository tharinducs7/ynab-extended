<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Carbon\Carbon;
use Carbon\CarbonPeriod;

class AnalyticsController extends Controller
{
    /**
     * Fetches all transactions for a given month and builds daily chart data.
     *
     * If no month is provided, it defaults to the current month.
     *
     * Transactions with a null category_id will be returned but not included in the income/expense aggregation.
     *
     * @param Request $request
     * @param string $budgetId
     * @param string|null $month In ISO format (e.g. "2024-04-01")
     * @return \Illuminate\Http\JsonResponse
     */
    public function fetchMonthlyTransactionsChart(Request $request, $budgetId, $month = null)
    {
        $token = $request->input('token');

        if (!$token) {
            return response()->json(['error' => 'YNAB token is required'], 400);
        }

        // Default to current month (first day) if not provided
        if (!$month) {
            $month = Carbon::now()->startOfMonth()->toDateString();  // format: YYYY-MM-DD
        }

        // Cache for 1 hour
        $cacheKey = "ynab_monthly_transactions_chart_{$budgetId}_{$month}_" . md5($token);
        $result = \Illuminate\Support\Facades\Cache::remember($cacheKey, now()->addHour(), function () use ($token, $budgetId, $month) {
            $url = "https://api.ynab.com/v1/budgets/{$budgetId}/months/{$month}/transactions";
            $response = Http::withToken($token)->get($url);

            if ($response->failed()) {
                \Log::error('YNAB API Error', [
                    'status' => $response->status(),
                    'body'   => $response->body(),
                ]);
                return null;
            }

            $data = $response->json();
            $transactions = $data['data']['transactions'] ?? [];

            // Determine start and end dates of the month.
            $startOfMonth = Carbon::parse($month)->startOfMonth();
            $endOfMonth   = Carbon::parse($month)->endOfMonth();

            // Create a period for each day in the month.
            $period = CarbonPeriod::create($startOfMonth, $endOfMonth);

            // ---------------------------
            // Build chart_data: aggregate income & expense per day.
            // ---------------------------
            $chartData = [];
            foreach ($period as $date) {
                $chartData[$date->toDateString()] = [
                    'date'    => $date->toDateString(),
                    'income'  => 0,
                    'expense' => 0,
                ];
            }

            // For each transaction, if it has subtransactions, iterate those; otherwise use the parent value.
            foreach ($transactions as $txn) {
                $txnDate = Carbon::parse($txn['date'])->toDateString();
                if (!isset($chartData[$txnDate])) {
                    continue; // skip transactions outside the month
                }
                // Only aggregate if category_id is not null.
                // (The parent's category_id may be "Split" so we ignore it if subtransactions exist.)
                if (isset($txn['subtransactions']) && is_array($txn['subtransactions']) && count($txn['subtransactions']) > 0) {
                    foreach ($txn['subtransactions'] as $sub) {
                        // Only aggregate if subtransaction has a non-null category_id.
                        if (!isset($sub['category_id']) || $sub['category_id'] === null) {
                            continue;
                        }
                        $amount = $sub['amount'] / 1000.0;
                        if ($amount > 0) {
                            $chartData[$txnDate]['income'] += $amount;
                        } elseif ($amount < 0) {
                            $chartData[$txnDate]['expense'] += abs($amount);
                        }
                    }
                } else {
                    if (!isset($txn['category_id']) || $txn['category_id'] === null) {
                        continue;
                    }
                    $amount = $txn['amount'] / 1000.0;
                    if ($amount > 0) {
                        $chartData[$txnDate]['income'] += $amount;
                    } elseif ($amount < 0) {
                        $chartData[$txnDate]['expense'] += abs($amount);
                    }
                }
            }

            // Finalize chart_data into an indexed array and round values.
            $chartDataArr = array_map(function ($dataItem) {
                $dataItem['income'] = round($dataItem['income'], 2);
                $dataItem['expense'] = round($dataItem['expense'], 2);
                return $dataItem;
            }, array_values($chartData));

            // ---------------------------
            // Build daily_summary: detailed breakdown per day.
            // ---------------------------
            $dailySummary = [];
            foreach ($period as $date) {
                $dateStr = $date->toDateString();
                $dailySummary[$dateStr] = [
                    'date' => $dateStr,
                    'sum_income' => 0,
                    'sum_expenses' => 0,
                    'net_value' => 0,
                    'active_categories' => [],  // keyed by category_id
                    'active_payees' => [],       // keyed by payee_id
                    'active_accounts' => []      // keyed by account_id
                ];
            }

            // Process each transaction for the daily summary.
            foreach ($transactions as $txn) {
                $txnDate = Carbon::parse($txn['date'])->toDateString();
                if (!isset($dailySummary[$txnDate])) {
                    continue;
                }

                // If transaction has subtransactions, process each subtransaction; otherwise, use parent.
                if (isset($txn['subtransactions']) && is_array($txn['subtransactions']) && count($txn['subtransactions']) > 0) {
                    foreach ($txn['subtransactions'] as $sub) {
                        $amount = $sub['amount'] / 1000.0;
                        // Aggregate income and expense
                        if ($amount > 0) {
                            $dailySummary[$txnDate]['sum_income'] += $amount;
                        } elseif ($amount < 0) {
                            $dailySummary[$txnDate]['sum_expenses'] += abs($amount);
                        }
                        // Active categories
                        if (isset($sub['category_id']) && $sub['category_id'] !== null) {
                            $catId = $sub['category_id'];
                            $catName = $sub['category_name'] ?? 'Uncategorized';
                            if (!isset($dailySummary[$txnDate]['active_categories'][$catId])) {
                                $dailySummary[$txnDate]['active_categories'][$catId] = [
                                    'id' => $catId,
                                    'name' => $catName,
                                    'sum_income' => 0,
                                    'sum_expense' => 0,
                                ];
                            }
                            if ($amount > 0) {
                                $dailySummary[$txnDate]['active_categories'][$catId]['sum_income'] += $amount;
                            } elseif ($amount < 0) {
                                $dailySummary[$txnDate]['active_categories'][$catId]['sum_expense'] += abs($amount);
                            }
                        }
                        // Active payees
                        if (isset($sub['payee_id']) && $sub['payee_id'] !== null) {
                            $payeeId = $sub['payee_id'];
                            $payeeName = $sub['payee_name'] ?? 'Unknown';
                            if (!isset($dailySummary[$txnDate]['active_payees'][$payeeId])) {
                                $dailySummary[$txnDate]['active_payees'][$payeeId] = [
                                    'id' => $payeeId,
                                    'name' => $payeeName,
                                    'sum_income' => 0,
                                    'sum_expense' => 0,
                                ];
                            }
                            if ($amount > 0) {
                                $dailySummary[$txnDate]['active_payees'][$payeeId]['sum_income'] += $amount;
                            } elseif ($amount < 0) {
                                $dailySummary[$txnDate]['active_payees'][$payeeId]['sum_expense'] += abs($amount);
                            }
                        }
                        // Active accounts
                        if (isset($sub['account_id']) && $sub['account_id'] !== null) {
                            $accountId = $sub['account_id'];
                            $accountName = $sub['account_name'] ?? 'Unknown Account';
                            $accountNote = $sub['account_note'] ?? '';
                            if (!isset($dailySummary[$txnDate]['active_accounts'][$accountId])) {
                                $dailySummary[$txnDate]['active_accounts'][$accountId] = [
                                    'id' => $accountId,
                                    'name' => $accountName,
                                    'note' => $accountNote,
                                    'sum_income' => 0,
                                    'sum_expense' => 0,
                                ];
                            }
                            if ($amount > 0) {
                                $dailySummary[$txnDate]['active_accounts'][$accountId]['sum_income'] += $amount;
                            } elseif ($amount < 0) {
                                $dailySummary[$txnDate]['active_accounts'][$accountId]['sum_expense'] += abs($amount);
                            }
                        }
                    }
                } else {
                    // No subtransactions; use parent transaction
                    if (!isset($txn['category_id']) || $txn['category_id'] === null) {
                        continue;
                    }
                    $amount = $txn['amount'] / 1000.0;
                    if ($amount > 0) {
                        $dailySummary[$txnDate]['sum_income'] += $amount;
                    } elseif ($amount < 0) {
                        $dailySummary[$txnDate]['sum_expenses'] += abs($amount);
                    }
                    if (isset($txn['category_id']) && $txn['category_id'] !== null) {
                        $catId = $txn['category_id'];
                        $catName = $txn['category_name'] ?? 'Uncategorized';
                        if (!isset($dailySummary[$txnDate]['active_categories'][$catId])) {
                            $dailySummary[$txnDate]['active_categories'][$catId] = [
                                'id' => $catId,
                                'name' => $catName,
                                'sum_income' => 0,
                                'sum_expense' => 0,
                            ];
                        }
                        if ($amount > 0) {
                            $dailySummary[$txnDate]['active_categories'][$catId]['sum_income'] += $amount;
                        } elseif ($amount < 0) {
                            $dailySummary[$txnDate]['active_categories'][$catId]['sum_expense'] += abs($amount);
                        }
                    }
                    if (isset($txn['payee_id']) && $txn['payee_id'] !== null) {
                        $payeeId = $txn['payee_id'];
                        $payeeName = $txn['payee_name'] ?? 'Unknown';
                        if (!isset($dailySummary[$txnDate]['active_payees'][$payeeId])) {
                            $dailySummary[$txnDate]['active_payees'][$payeeId] = [
                                'id' => $payeeId,
                                'name' => $payeeName,
                                'sum_income' => 0,
                                'sum_expense' => 0,
                            ];
                        }
                        if ($amount > 0) {
                            $dailySummary[$txnDate]['active_payees'][$payeeId]['sum_income'] += $amount;
                        } elseif ($amount < 0) {
                            $dailySummary[$txnDate]['active_payees'][$payeeId]['sum_expense'] += abs($amount);
                        }
                    }
                    if (isset($txn['account_id']) && $txn['account_id'] !== null) {
                        $accountId = $txn['account_id'];
                        $accountName = $txn['account_name'] ?? 'Unknown Account';
                        $accountNote = $txn['account_note'] ?? '';
                        if (!isset($dailySummary[$txnDate]['active_accounts'][$accountId])) {
                            $dailySummary[$txnDate]['active_accounts'][$accountId] = [
                                'id' => $accountId,
                                'name' => $accountName,
                                'note' => $accountNote,
                                'sum_income' => 0,
                                'sum_expense' => 0,
                            ];
                        }
                        if ($amount > 0) {
                            $dailySummary[$txnDate]['active_accounts'][$accountId]['sum_income'] += $amount;
                        } elseif ($amount < 0) {
                            $dailySummary[$txnDate]['active_accounts'][$accountId]['sum_expense'] += abs($amount);
                        }
                    }
                }
             }

             // Finalize each daily summary: compute net and convert grouped arrays to indexed arrays.
             $dailySummaryArr = [];
             foreach ($dailySummary as $date => $summary) {
                  $summary['net_value'] = round($summary['sum_income'] - $summary['sum_expenses'], 2);
                  $summary['sum_income'] = round($summary['sum_income'], 2);
                  $summary['sum_expenses'] = round($summary['sum_expenses'], 2);
                  $summary['active_categories'] = array_values($summary['active_categories']);
                  $summary['active_payees'] = array_values($summary['active_payees']);
                  $summary['active_accounts'] = array_values($summary['active_accounts']);
                  $dailySummaryArr[] = $summary;
             }

             return [
                  'transactions' => $transactions,
                  'chart_data'   => array_map(function ($dataItem) {
                        $dataItem['income'] = round($dataItem['income'], 2);
                        $dataItem['expense'] = round($dataItem['expense'], 2);
                        return $dataItem;
                  }, array_values($chartData)),
                  'daily_summary' => $dailySummaryArr,
             ];
        });

        if ($result === null) {
             return response()->json(['error' => 'Failed to fetch YNAB transactions for the month'], 500);
        }

        return response()->json($result);
    }


}
