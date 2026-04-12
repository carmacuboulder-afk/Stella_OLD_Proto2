import "../css/Login.css";
import "../css/Register.css";
import { useState } from "react";
import { useNavigate } from 'react-router-dom';

function Login({refreshUser}) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [toast, setToast] = useState(null);
    const nav = useNavigate();

    const showToast = (msg, type) => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 2000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch("http://localhost:8000/api/users/login", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Login failed");
            }

            await refreshUser();
            nav("/");
        } 
        catch (err) {
            console.log(err);
            showToast("Login Failed!", "failure");
        } 
    };

    return (
        <main className="login">
            {toast && (
                <div className={`toast toast-${toast.type}`}>
                    {toast.msg}
                </div>
            )}
            <h1><b>Login</b></h1>
            <div className="login-form-container">
                <form onSubmit={handleSubmit}>
                    <div className="form-field-container">
                        <p>Enter your username or email address associated with your account</p>
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
                        <p>Enter your password</p>
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
                            className="submitButton"
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