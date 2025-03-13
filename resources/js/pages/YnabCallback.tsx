import { useEffect } from 'react';
import axios from 'axios';
import { useYnabStore } from '@/stores/useYnabStore';

export default function YnabCallback() {
    const {
        setToken,
        setAuthenticated,
        setBudgets,
        setDefaultBudgetId,
        reset
    } = useYnabStore();

    useEffect(() => {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');

        if (accessToken) {
            setToken(accessToken);
            // Store the token in sessionStorage
            sessionStorage.setItem('ynab_access_token', accessToken);

            axios.post(route('ynab.auth'), { token: accessToken })
                .then(({ data }) => {
                    console.log('YNAB Authentication Success:', data);
                    // You can also store any other data if needed, e.g., user data or budgets
                    sessionStorage.setItem('ynab_authenticated', 'true');
                    setAuthenticated(true);
                    setBudgets(data.data.budgetsArrayWithAccounts);
                    setDefaultBudgetId(data.data.defaultBudgetId ?? null);

                    window.location.href = data.data.defaultBudgetId ? route('dashboard') : route('ynab.setup');
                })
                .catch(error => {
                    console.error('YNAB Authentication Error:', error);
                    sessionStorage.removeItem('ynab_access_token');
                    reset();
                    // Display error to user
                    alert('Failed to authenticate with YNAB. Please try again.');
                });
        } else {
            console.error('No access token found in URL hash.');
            alert('No access token found. Please try connecting again.');
        }
    }, []);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <p>Connecting to YNAB...</p>
            <div className="mt-4">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        </div>
    );
}
