import Link from 'next/link'

export default function SignUpPage() {
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

                    <form className="signup-form">
                        <label htmlFor="email">Email address</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            required
                        />

                        <div className="signup-password-label">
                            <label htmlFor="password">Create Password</label>
                            
                        </div>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="Enter your password"
                            required
                        />

                        

                        <button type="button" className="signup-submit">Sign up</button>
                    </form>

                    
                </div>
            </section>

            <footer className="signup-footer">
                <Link href="/signin">Already have an account?</Link>
            </footer>
        </main>
    )
}