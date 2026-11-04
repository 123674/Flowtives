'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
            const res = await fetch(`${process.env.NEXT_PUBLIC_FASTAPI_URL}/auth/signin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.detail || 'Sign in failed')
                return
            }

            localStorage.setItem('access_token', data.access_token)
            router.push('/calendar')
        } catch {
            setError('Something went wrong. Try again.')
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