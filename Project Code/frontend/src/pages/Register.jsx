import "../css/Register.css";
import { useState } from "react";
import { useNavigate } from 'react-router-dom';

function Login() {
    // to redirect after register
    const nav = useNavigate();

    // toast for succes/fail
    const [toast, setToast] = useState(null);

    // user input states
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password_one, setPassword_One] = useState("");
    const [password_two, setPassword_Two] = useState("");
    const [school, setSchool] = useState("");
    const [org, setOrg] = useState("");

    const showToast = (msg, type) => {
        setToast({msg, type});
        setTimeout(() => setToast(null), 2000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch("http://localhost:8000/api/users/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    username, 
                    email, 
                    password_one, 
                    password_two, 
                    schools: school ? [school] : [],   
                    orgs: org ? [org] : []             
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Register failed");
            }

            console.log("Register successful:", data);
            showToast("Registration Successful!", "success");
            setTimeout(() => nav("/login"), 1000);            
            
        } 
        catch (err) {
            console.log(err);
            showToast("Registration Failed!", "failure");
        } 
    };

    return (
        <main className="register">
            <div className="register-container">
                {toast && (
                    <div className={`toast toast-${toast.type}`}>
                        {toast.msg}
                    </div>
                )}
                <h1><b>Sign up</b></h1>
                <div className="register-form-container">
                    <form onSubmit={handleSubmit}>
                        <div className="form-field-container">
                            <p>Username <i>* Username can contains only alphanumeric characters.</i> <br/></p> 
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
                            <p>Enter your email</p>
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
                            <p>Enter your password</p>
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
                            <p>Re-enter your password</p>
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
                        <div className="form-field-container">
                            <p>Enter your school (optional)</p>
                            <input  
                                className="input-container"
                                id="school"
                                type="text"
                                placeholder=" school"
                                value={school}
                                onChange={(e) => setSchool(e.target.value)}
                            />
                        </div>
                        <div className="form-field-container">
                            <p>Enter your organization (optional)</p>
                            <input  
                                className="input-container"
                                id="org"
                                type="text"
                                placeholder=" organization"
                                value={org}
                                onChange={(e) => setOrg(e.target.value)}
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
            </div>
            
        </main>
    );
}

export default Login;