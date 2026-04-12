import "../css/CreateOrg.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function CreateOrg({ refreshUser }) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [toast, setToast] = useState(null);
    const nav = useNavigate();

    // Redirect away if user already owns an org
    useEffect(() => {
        const checkOwnership = async () => {
            try {
                const response = await fetch("http://localhost:8000/api/users/me", {
                    credentials: "include",
                });
                if (!response.ok) { nav("/login"); return; }
                const data = await response.json();
                if (data.owned_org_id) {
                    nav(`/orgs/${data.owned_org_id}/manage`);
                }
            } catch (err) {
                console.log(err);
            }
        };
        checkOwnership();
    }, []);

    const showToast = (msg, type) => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 2000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch("http://localhost:8000/api/orgs/create", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, description }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to create organization");

            showToast("Organization created!", "success");
            await refreshUser();
            setTimeout(() => nav(`/orgs/${data.id}/manage`), 1000);
        } catch (err) {
            showToast(err.message, "failure");
        }
    };

    return (
        <main className="create-org">
            {toast && (
                <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
            )}
            <h1><b>Create Organization</b></h1>
            <div className="create-org-container">
                <form onSubmit={handleSubmit}>
                    <div className="form-field-container">
                        <p>Organization name <i>* required</i></p>
                        <input
                            className="input-container"
                            type="text"
                            required
                            placeholder=" organization name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div className="form-field-container">
                        <p>Description <i>(optional)</i></p>
                        <textarea
                            className="input-container"
                            placeholder=" describe your organization"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                        />
                    </div>
                    <button className="submitButton" type="submit">Create</button>
                </form>
            </div>
        </main>
    );
}

export default CreateOrg;