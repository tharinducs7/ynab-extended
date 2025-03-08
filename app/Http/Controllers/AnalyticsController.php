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

        // If no month is provided, default to the current month (first day of current month)
        if (!$month) {
            $month = Carbon::now()->startOfMonth()->toDateString(); // Format: YYYY-MM-DD
        }

        // Build the YNAB API URL for fetching transactions for the month
        $url = "https://api.ynab.com/v1/budgets/{$budgetId}/months/{$month}/transactions";
        $response = Http::withToken($token)->get($url);

        if ($response->failed()) {
            \Log::error('YNAB API Error', [
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);
            return response()->json(['error' => 'Failed to fetch YNAB transactions for the month'], 500);
        }

        $data = $response->json();
        $transactions = $data['data']['transactions'] ?? [];

        // Determine the start and end dates of the month
        $startOfMonth = Carbon::parse($month)->startOfMonth();
        $endOfMonth   = Carbon::parse($month)->endOfMonth();

        // Create a period for each day in the month.
        $period = CarbonPeriod::create($startOfMonth, $endOfMonth);

        // Initialize an array to hold chart data for each day.
        $chartData = [];
        foreach ($period as $date) {
            $chartData[$date->toDateString()] = [
                'date'    => $date->toDateString(),
                'income'  => 0,
                'expense' => 0,
            ];
        }

        // Aggregate income and expense for each day.
        foreach ($transactions as $txn) {
            $txnDate = Carbon::parse($txn['date'])->toDateString();
            if (!isset($chartData[$txnDate])) {
                continue; // Skip if the transaction falls outside the month
            }

            // If the transaction's category_id is null, skip it for aggregation
            if (!isset($txn['category_id']) || $txn['category_id'] === null) {
                continue;
            }

            // Convert from minor units to major units
            $amount = $txn['amount'] / 1000.0;
            if ($amount > 0) {
                $chartData[$txnDate]['income'] += $amount;
            } elseif ($amount < 0) {
                // Sum the absolute value for expenses
                $chartData[$txnDate]['expense'] += abs($amount);
            }
        }

        // Convert the associative array into an indexed array sorted by date.
        $chartDataArr = array_values($chartData);

        // Round income and expense values to two decimal places.
        $chartDataArr = array_map(function ($dataItem) {
            $dataItem['income'] = round($dataItem['income'], 2);
            $dataItem['expense'] = round($dataItem['expense'], 2);
            return $dataItem;
        }, $chartDataArr);

        return response()->json([
            'transactions' => $transactions,
            'chart_data'   => $chartDataArr,
        ]);
    }
}
