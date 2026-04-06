'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function sanitizeNextPath(path: string | null): string {
    if (!path) return '/dashboard';
    if (!path.startsWith('/') || path.startsWith('//') || path.includes('://')) {
        return '/dashboard';
    }
    return path;
}

export default function LoginPage() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [nextPath, setNextPath] = useState('/dashboard');
    const router = useRouter();
    const supabase = useMemo(() => createClient(), []);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        setNextPath(sanitizeNextPath(params.get('next')));
    }, []);

    useEffect(() => {
        const redirectIfAuthenticated = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                router.replace(nextPath);
            }
        };
        redirectIfAuthenticated();
    }, [nextPath, router, supabase]);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${(process.env.NEXT_PUBLIC_SITE_URL || window.location.origin).replace(/\/$/, '')}/auth/callback`,
                        data: {
                            full_name: fullName,
                        },
                    },
                });
                if (error) throw error;
                setMessage('Check your email for the confirmation link.');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                router.push(nextPath);
                router.refresh();
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : '';
            if (isSignUp) {
                setError(msg.includes('already registered') ? 'Could not create account. Please try a different email.' : msg || 'An error occurred');
            } else {
                setError('Invalid email or password.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-warm-grey px-4">
            <Link href="/" className="absolute top-4 left-4 sm:top-8 sm:left-8 flex items-center gap-2 text-gray-500 hover:text-off-black transition-colors">
                <ArrowLeft size={20} />
                Back to Home
            </Link>

            <div className="w-full max-w-md bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-gray-100">
                <div className="text-center mb-8">
                    <h1 className="font-serif text-3xl sm:text-4xl text-brand-red mb-2">VoiceSOP</h1>
                    <p className="text-gray-500">{isSignUp ? 'Create your account' : 'Welcome back'}</p>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                    {isSignUp && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input
                                type="text"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-red/20 transition-all"
                                placeholder="John Doe"
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-red/20 transition-all"
                            placeholder="you@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-red/20 transition-all"
                            placeholder="••••••••"
                        />
                        {isSignUp && (
                            <p className="text-xs text-gray-400 mt-1">Minimum 6 characters</p>
                        )}
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                            {error}
                        </div>
                    )}

                    {message && (
                        <div className="p-3 bg-green-50 text-green-600 text-sm rounded-lg">
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-off-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : (isSignUp ? 'Sign Up' : 'Log In')}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-500">
                    {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-brand-red font-medium hover:underline"
                    >
                        {isSignUp ? 'Log in' : 'Sign up'}
                    </button>
                </div>
            </div>
        </div>
    );
}
