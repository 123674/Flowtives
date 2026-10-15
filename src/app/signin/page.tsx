import Link from 'next/link'

export default function SignInPage() {
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

                    <form className="signin-form">
                        <label htmlFor="email">Email address</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            required
                        />

                        <div className="signin-password-label">
                            <label htmlFor="password">Password</label>
                            <a href="#forgot-password">Forgot password?</a>
                        </div>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            placeholder="Enter your password"
                            required
                        />

                        <label className="signin-remember">
                            <input type="checkbox" name="remember" />
                            <span>Remember me</span>
                        </label>

                        <button type="button" className="signin-submit">Sign in</button>
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