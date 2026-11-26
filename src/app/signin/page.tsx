
'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    signInWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    signInWithPopup,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'

export default function SignInPage() {
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError(null)
        setLoading(true)

        const form = new FormData(e.currentTarget)
        const email = form.get('email') as string
        const password = form.get('password') as string

        try {
            const userCredential = await signInWithEmailAndPassword(
                auth,
                email,
                password
            )

            if (!userCredential.user.emailVerified) {
                await signOut(auth)
                setError('Please verify your email before signing in.')
                return
            }

            router.push('/calendar')

        } catch (err: unknown) {
            const errorCode = (err as { code?: string }).code

            if (
                errorCode === 'auth/invalid-credential' ||
                errorCode === 'auth/wrong-password' ||
                errorCode === 'auth/user-not-found'
            ) {
                setError('Invalid email or password.')
            } else if (errorCode === 'auth/invalid-email') {
                setError('Please enter a valid email address.')
            } else if (errorCode === 'auth/too-many-requests') {
                setError('Too many attempts. Please try again later.')
            } else {
                setError('Something went wrong. Please try again.')
            }
        } finally {
            setLoading(false)
        }
    }

    async function handleGoogleSignIn() {
        setError(null)
        setLoading(true)

        try {
            const provider = new GoogleAuthProvider()
            await signInWithPopup(auth, provider)
            router.push('/calendar')
        } catch (err: unknown) {
            const errorCode = (err as { code?: string }).code

            if (errorCode === 'auth/popup-closed-by-user') {
                setError('Google sign-in was cancelled.')
            } else if (errorCode === 'auth/account-exists-with-different-credential') {
                setError('An account already exists with this email using another sign-in method.')
            } else {
                setError('Google sign-in failed. Please try again.')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="signin-page">
            <header className="signin-header">
                <Link className="signin-brand" href="/" aria-label="Flowtives home">
                    Flowtives
                </Link>
            </header>

            <section className="signin-content" aria-labelledby="signin-title">
                <div className="signin-panel">
                    <h1 id="signin-title">Welcome back</h1>
                    <p className="signin-description">Sign in to continue to your account.</p>

                    <form className="signin-form" onSubmit={handleSubmit}>
                        <label htmlFor="email">Email address</label>
                        <input
                            id="email" name="email" type="email"
                            autoComplete="email" placeholder="you@example.com" required
                        />

                        <div className="signin-password-label">
                            <label htmlFor="password">Password</label>
                            <a href="#forgot-password">Forgot password?</a>
                        </div>
                        <input
                            id="password" name="password" type="password"
                            autoComplete="current-password" placeholder="Enter your password" required
                        />

                        <label className="signin-remember">
                            <input type="checkbox" name="remember" />
                            <span>Remember me</span>
                        </label>

                        {error && <p style={{ color: 'red', fontSize: '0.875rem' }}>{error}</p>}

                        <button type="submit" className="signin-submit" disabled={loading}>
                            {loading ? 'Signing in…' : 'Sign in'}
                        </button>
                    </form>

                    <div className="auth-divider">
                        <span>OR</span>
                    </div>

                    <button
                        type="button"
                        className="google-auth-button"
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                    >
                        <svg
    viewBox="0 0 48 48"
    width="18"
    height="18"
    aria-hidden="true"
    style={{
        width: '18px',
        height: '18px',
        minWidth: '18px',
        flexShrink: 0,
        display: 'block'
    }}
>
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"/>
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 37.93 46.98 31.8 46.98 24.55Z"/>
                            <path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19Z"/>
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.89 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"/>
                        </svg>
                        Continue with Google
                    </button>

                    <p className="signin-signup">
                        Don&apos;t have an account? <Link href="/signup">Create an account</Link>
                    </p>
                </div>
            </section>

            <footer className="signin-footer">
                <Link href="/">Back to home</Link>
            </footer>
        </main>
    )
}
