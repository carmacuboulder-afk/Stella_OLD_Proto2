import "../css/Login.css";
import { useState } from "react";

function Login() {
    // setting up states for user inputs
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch("http://localhost:8000/api/users/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Login failed");
            }

            console.log("Login successful:", data);
            
        } 
        catch (err) {
            console.log(err);
        } 
    };

    return (
        <main className="login">
            <h1><b>Login</b></h1>
            <div className="login-form-container">
                <form onSubmit={handleSubmit}>
                    <div className="form-field-container">
                        <p>Enter your username or email associated with your account.</p>
                        <input
                            className="input-container"
                            id="username"
                            type="text"
                            required
                            placeholder=" username/email"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div className="form-field-container">
                        <p>Enter your password.</p>
                        <input  
                            className="input-container"
                            id="password"
                            type="password"
                            required
                            placeholder=" password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <div>
                        <button
                            className="button"
                            id="login-button"
                            type="submit"
                        >
                            Submit
                        </button>
                    </div>
                </form>
            </div>
            <div>
                <p>Don't have an account? Register <a href="/register" className="link">here</a>!</p>
            </div>
        </main>
    );
}

export default Login;