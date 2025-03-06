<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\YNABAuthController;
use App\Http\Controllers\YNABController;

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

// Route::middleware(['throttle:ynab'])->group(function () {
//     Route::post('/ynab/auth', [YNABAuthController::class, 'authenticate'])->name('ynab.auth');
//     Route::post('/api/ynab/{budgetId}/age-of-money', [YNABController::class, 'fetchAgeOfMoney']);
// });

Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', fn() => inertia('dashboard'))->name('dashboard');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
