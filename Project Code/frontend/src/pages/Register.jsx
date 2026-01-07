import "../css/Register.css";
import { useState } from "react";

function Login() {
    // setting up states for user inputs
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password_one, setPassword_One] = useState("");
    const [password_two, setPassword_Two] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch("http://localhost:8000/api/users/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password_one, password_two })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Register failed");
            }

            console.log("Register successful:", data);
            
        } 
        catch (err) {
            console.log(err);
        } 
    };

    return (
        <main className="register">
            <h1><b>Register</b></h1>
            <div className="register-form-container">
                <form onSubmit={handleSubmit}>
                    <div className="form-field-container">
                        <p>Enter your username containing only alphanumeric characters.</p>
                        <input
                            className="input-container"
                            id="username"
                            type="text"
                            required
                            placeholder=" username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div className="form-field-container">
                        <p>Enter your email.</p>
                        <input
                            className="input-container"
                            id="email"
                            type="email"
                            required
                            placeholder=" email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="form-field-container">
                        <p>Enter your password.</p>
                        <input  
                            className="input-container"
                            id="password_one"
                            type="password"
                            required
                            placeholder=" password"
                            value={password_one}
                            onChange={(e) => setPassword_One(e.target.value)}
                        />
                    </div>
                    <div className="form-field-container">
                        <p>Re-enter your password.</p>
                        <input  
                            className="input-container"
                            id="password_two"
                            type="password"
                            required
                            placeholder=" password"
                            value={password_two}
                            onChange={(e) => setPassword_Two(e.target.value)}
                        />
                    </div>
                    <div>
                        <button
                            className="button"
                            id="register-button"
                            type="submit"
                        >
                            Submit
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}

export default Login;