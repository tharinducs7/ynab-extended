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
}
