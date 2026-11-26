
'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    createUserWithEmailAndPassword,
    sendEmailVerification,
    signOut,
    GoogleAuthProvider,
    signInWithPopup,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'

export default function SignUpPage() {
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError(null)
        setSuccess(null)
        setLoading(true)

        const form = new FormData(e.currentTarget)
        const email = form.get('email') as string
        const password = form.get('password') as string

        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            )

            await sendEmailVerification(userCredential.user)
            await signOut(auth)

            setSuccess('Account created! Please check your email to verify your account before signing in.')
        } catch (err: unknown) {
            const errorCode = (err as { code?: string }).code

            if (errorCode === 'auth/email-already-in-use') {
                setError('This email is already registered.')
            } else if (errorCode === 'auth/weak-password') {
                setError('Password should be at least 6 characters.')
            } else if (errorCode === 'auth/invalid-email') {
                setError('Please enter a valid email address.')
            } else {
                setError('Something went wrong. Please try again.')
            }
        } finally {
            setLoading(false)
        }
    }

    async function handleGoogleSignUp() {
        setError(null)
        setSuccess(null)
        setLoading(true)

        
async function handleGoogleSignUp() {
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
        const provider = new GoogleAuthProvider()
        await signInWithPopup(auth, provider)
        router.push('/calendar')
    } catch (err: unknown) {
        console.error('Google authentication error:', err)

        const errorCode = (err as { code?: string }).code

        if (errorCode === 'auth/popup-closed-by-user') {
            setError('Google sign-up was cancelled.')
        } else if (errorCode === 'auth/account-exists-with-different-credential') {
            setError('An account already exists with this email using another sign-in method.')
        } else {
            setError(`Google sign-up failed: ${errorCode || 'Unknown error'}`)
        }
    } finally {
        setLoading(false)
    }
}

    }

    return (
        <main className="signup-page">
            <header className="signup-header">
                <Link className="signup-brand" href="/" aria-label="Flowtives home">
                    Flowtives
                </Link>
            </header>

            <section className="signup-content" aria-labelledby="signup-title">
                <div className="signup-panel">
                    <h1 id="signup-title">Welcome</h1>
                    <p className="signup-description">Create an account.</p>

                    <form className="signup-form" onSubmit={handleSubmit}>
                        <label htmlFor="email">Email address</label>
                        <input
                            id="email" name="email" type="email"
                            autoComplete="email" placeholder="you@example.com" required
                        />

                        <div className="signup-password-label">
                            <label htmlFor="password">Create Password</label>
                        </div>
                        <input
                            id="password" name="password" type="password"
                            placeholder="Enter your password" required
                        />

                        {error && (
                            <p style={{ color: 'red', fontSize: '0.875rem' }}>
                                {error}
                            </p>
                        )}

                        {success && (
                            <p style={{ color: 'green', fontSize: '0.875rem' }}>
                                {success}
                            </p>
                        )}

                        <button type="submit" className="signup-submit" disabled={loading}>
                            {loading ? 'Creating account…' : 'Sign up'}
                        </button>
                    </form>

                    <div className="auth-divider">
                        <span>OR</span>
                    </div>

                    <button
                        type="button"
                        className="google-auth-button"
                        onClick={handleGoogleSignUp}
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
                </div>
            </section>

            <footer className="signup-footer">
                <Link href="/signin">Already have an account?</Link>
            </footer>
        </main>
    )
}
