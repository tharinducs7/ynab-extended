import { useEffect } from 'react';
import axios from 'axios';

export default function YnabCallback() {
    useEffect(() => {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');

        if (accessToken) {
            // Store the token in sessionStorage
            sessionStorage.setItem('ynab_access_token', accessToken);

            axios.post(route('ynab.auth'), { token: accessToken })
                .then(response => {
                    console.log('YNAB Authentication Success:', response);
                    // You can also store any other data if needed, e.g., user data or budgets
                    sessionStorage.setItem('ynab_authenticated', 'true');
                    // Redirect to dashboard or wherever you want
                    window.location.href = route('dashboard');
                })
                .catch(error => {
                    console.error('YNAB Authentication Error:', error);
                    sessionStorage.removeItem('ynab_access_token'); // optional, if failed
                });
        } else {
            console.error('No access token found in URL hash.');
        }
    }, []);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <p>Connecting to YNAB...</p>
        </div>
    );
}
