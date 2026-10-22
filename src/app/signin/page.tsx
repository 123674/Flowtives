
'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import './signin.css'

type EyeIconProps = {
    visible: boolean
}

function EyeIcon({ visible }: EyeIconProps) {
    return (
        <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {visible ? (
                <>
                    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                    <path d="m3 3 18 18" />
                </>
            ) : (
                <>
                    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                </>
            )}
        </svg>
    )
}

export default function SignInPage() {
    const [showPassword, setShowPassword] = useState<boolean>(false)
    const [email, setEmail] = useState<string>('')
    const [password, setPassword] = useState<string>('')
    const [remember, setRemember] = useState<boolean>(false)
    const [error, setError] = useState<string>('')

    function handleSubmit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault()
        setError('')

        if (!email.trim() || !password) {
            setError('Please enter your email and password.')
            return
        }

        // TODO: Connect your authentication API here.
        setError('Authentication is not connected yet.')
    }

    return (
        <main className="signin-page">
            <header className="signin-header">
                <Link
                    href="/"
                    className="signin-brand"
                    aria-label="Flowtives home"
                >
                    Flowtives
                </Link>

                <span className="header-note">
                    Your time, in balance.
                </span>
            </header>

            <section
                className="signin-content"
                aria-labelledby="signin-title"
            >
                <div className="signin-panel">
                    <div className="signin-intro">
                        <div className="signin-eyebrow">
                            YOUR SPACE, YOUR PACE
                        </div>

                        <h1 id="signin-title">Welcome back.</h1>

                        <p className="signin-description">
                            Sign in to pick up where you left off.
                        </p>
                    </div>

                    <form
                        className="signin-form"
                        onSubmit={handleSubmit}
                    >
                        <div className="signin-field">
                            <label htmlFor="email">
                                Email address
                            </label>

                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(event) => {
                                    setEmail(event.target.value)
                                    setError('')
                                }}
                                required
                            />
                        </div>

                        <div className="signin-field">
                            <div className="signin-password-label">
                                <label htmlFor="password">
                                    Password
                                </label>

                                <Link
                                    href="/forgot-password"
                                    className="signin-text-link"
                                >
                                    Forgot password?
                                </Link>
                            </div>

                            <div className="password-input-wrap">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(event) => {
                                        setPassword(event.target.value)
                                        setError('')
                                    }}
                                    required
                                />

                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() =>
                                        setShowPassword((previous) => !previous)
                                    }
                                    aria-label={
                                        showPassword
                                            ? 'Hide password'
                                            : 'Show password'
                                    }
                                    aria-pressed={showPassword}
                                >
                                    <EyeIcon visible={showPassword} />
                                </button>
                            </div>
                        </div>

                        <label className="signin-remember">
                            <input
                                type="checkbox"
                                name="remember"
                                checked={remember}
                                onChange={(event) =>
                                    setRemember(event.target.checked)
                                }
                            />
                            <span>Remember Me</span>
                        </label>

                        {error && (
                            <p className="signin-error" role="alert">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            className="signin-submit"
                        >
                            Sign in
                            <span aria-hidden="true">↗</span>
                        </button>

                        <p className="signin-terms">
                            Keep your account secure and make every day count.
                        </p>
                    </form>

                    <div className="signin-divider">
                        <span />
                        <span>NEW TO FLOWTIVES?</span>
                        <span />
                    </div>

                    <p className="signin-signup">
                        Don&apos;t have an account?{' '}
                        <Link href="/signup">
                            Create an account
                        </Link>
                    </p>
                </div>

                <div className="signin-bottom-note">
                    <span className="status-dot" />
                    A little more focus. A little less rush.
                </div>
            </section>

            <footer className="signin-footer">
                <span>
                    © {new Date().getFullYear()} Flowtives
                </span>

                <Link href="/">Back to home</Link>
            </footer>
        </main>
    )
}
