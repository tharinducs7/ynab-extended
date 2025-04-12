<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\YNABAuthController;
use App\Http\Controllers\YNABController;
use App\Http\Controllers\AnalyticsController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

// Route::middleware(['auth', 'verified'])->group(function () {
//     Route::get('dashboard', function () {
//         return Inertia::render('dashboard');
//     })->name('dashboard');
// });

Route::get('/login', fn() => inertia('Login'))->name('login');
Route::get('/ynab-callback', fn() => inertia('YnabCallback'))->name('ynab.callback');

Route::post('/ynab/auth', [YNABAuthController::class, 'authenticate'])->name('ynab.auth');
Route::post('/api/ynab/{budgetId}/age-of-money', [YNABController::class, 'fetchAgeOfMoney']);
Route::post('/api/ynab/{budgetId}/scheduled-transactions', [YNABController::class, 'fetchScheduledTransactions']);
Route::post('/api/ynab/{budgetId}/fetch-categories', [YNABController::class, 'fetchCategories']);
Route::post('/api/ynab/{budgetId}/categories/{categoryId}/transactions', [YNABController::class, 'fetchCategoryTransactions']);
Route::get('/api/ynab/monthly-analytics/{budgetId}/transactions/{month?}', [AnalyticsController::class, 'fetchMonthlyTransactionsChart']);
Route::post('/api/ynab/{budgetId}/accounts/{accountId}/transactions', [YNABController::class, 'fetchTransactionsByAccount']);
Route::post('/api/ynab/{budgetId}/payees', [YNABController::class, 'fetchPayees']);

// Route::middleware(['throttle:ynab'])->group(function () {
//     Route::post('/ynab/auth', [YNABAuthController::class, 'authenticate'])->name('ynab.auth');
//     Route::post('/api/ynab/{budgetId}/age-of-money', [YNABController::class, 'fetchAgeOfMoney']);
// });

Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', fn() => inertia('dashboard'))->name('dashboard');
    Route::get('/category-overview', fn() => inertia('categoryOverview'))->name('category-overview');
    Route::get('/daily-stats', fn() => inertia('daily-stats'))->name('daily-stats');
    Route::get('/account-transactions', fn() => inertia('accountTransactions'))->name('account-transactions');
    Route::get('/payee-overview', fn() => inertia('payeeOverview'))->name('payee-overview');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
