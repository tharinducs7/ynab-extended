import { Head } from '@inertiajs/react';
// import { LoaderCircle } from 'lucide-react';
// import { FormEventHandler } from 'react';

// import InputError from '@/components/input-error';
// import TextLink from '@/components/text-link';
// import { Button } from '@/components/ui/button';
// import { Checkbox } from '@/components/ui/checkbox';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

// type LoginForm = {
//     email: string;
//     password: string;
//     remember: boolean;
// };

interface LoginProps {
    status?: string;
}

export default function Login({ status }: LoginProps) {
    // const { data, setData, post, processing, errors, reset } = useForm<Required<LoginForm>>({
    //     email: '',
    //     password: '',
    //     remember: false,
    // });

    // const submit: FormEventHandler = (e) => {
    //     e.preventDefault();
    //     post(route('login'), {
    //         onFinish: () => reset('password'),
    //     });
    // };

    const handleLogin = () => {
        const clientId = import.meta.env.VITE_APP_CLIENT_ID;
        const callback = import.meta.env.VITE_APP_CALLBACK_URL;

        if (!clientId) {
            console.error("Missing Client ID");
            return;
        }

        const redirectUri = encodeURIComponent(callback);
        window.location.href = `https://app.youneedabudget.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token`;
    };

    return (
        <AuthLayout title="Log in to your account" description="Enter your email and password below to log in">
            <Head title="Log in" />

            <button
                onClick={handleLogin}
                className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
                Login with YNAB
            </button>

            {status && <div className="mb-4 text-center text-sm font-medium text-green-600">{status}</div>}
        </AuthLayout>
    );
}
