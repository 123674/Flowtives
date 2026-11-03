'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SignUpPage() {
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
            const res = await fetch(`${process.env.NEXT_PUBLIC_FASTAPI_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.detail || 'Sign up failed')
                return
            }

            router.push('/signin')
        } catch {
            setError('Something went wrong. Try again.')
        } finally {
            setLoading(false)
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

                        {error && <p style={{ color: 'red', fontSize: '0.875rem' }}>{error}</p>}

                        <button type="submit" className="signup-submit" disabled={loading}>
                            {loading ? 'Creating account…' : 'Sign up'}
                        </button>
                    </form>
                </div>
            </section>

            <footer className="signup-footer">
                <Link href="/signin">Already have an account?</Link>
            </footer>
        </main>
    )
}