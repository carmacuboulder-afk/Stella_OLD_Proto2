import "../css/Account.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Account() {
    const [profile, setProfile] = useState(null);
    const [newSchool, setNewSchool] = useState("");
    const [newOrg, setNewOrg] = useState("");
    const [toast, setToast] = useState(null);
    const nav = useNavigate();

    const showToast = (msg, type) => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 2000);
    };

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await fetch("http://localhost:8000/api/users/me", {
                    credentials: "include",
                });
                if (!response.ok) {
                    nav("/login");
                    return;
                }
                const data = await response.json();
                setProfile(data);
            } 
            catch (err) {
                console.log(err);
                nav("/login");
            }
        };
        fetchProfile();
    }, []);

    const handleRemoveSchool = async (school) => {
        try {
            const response = await fetch("http://localhost:8000/api/users/remove/school", {
                method: "DELETE",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ school }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to remove school");
            setProfile((prev) => ({
                ...prev,
                schools: prev.schools.filter((s) => s !== school),
            }));
            showToast("School removed.", "success");
        } 
        catch (err) {
            showToast(err.message, "failure");
        }
    };

    const handleRemoveOrg = async (org) => {
        try {
            const response = await fetch("http://localhost:8000/api/users/remove/org", {
                method: "DELETE",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ org }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to remove organization");
            setProfile((prev) => ({
                ...prev,
                orgs: prev.orgs.filter((o) => o !== org),
            }));
            showToast("Organization removed.", "success");
        } 
        catch (err) {
            showToast(err.message, "failure");
        }
    };

    const handleAddSchool = async (e) => {
        e.preventDefault();
        
        if (!newSchool.trim()) {
            return;
        }
        
        try {
            const response = await fetch("http://localhost:8000/api/users/add/school", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ school: newSchool.trim() }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to add school");

            setProfile((prev) => ({
                ...prev,
                schools: [...(prev.schools || []), data.added],
            }));
            setNewSchool("");
            showToast("School added!", "success");
        } 
        catch (err) {
            showToast(err.message, "failure");
        }
    };

    const handleAddOrg = async (e) => {
        e.preventDefault();

        if (!newOrg.trim()) {
            return;
        }

        try {
            const response = await fetch("http://localhost:8000/api/users/add/org", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ org: newOrg.trim() }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to add organization");

            setProfile((prev) => ({
                ...prev,
                orgs: [...(prev.orgs || []), data.added],
            }));
            setNewOrg("");
            showToast("Organization added!", "success");
        } 
        catch (err) {
            showToast(err.message, "failure");
        }
    };

    if (!profile) {
        return <main className="account"><p>Loading...</p></main>;
    }

    return (
        <main className="account">
            {toast && (
                <div className={`toast toast-${toast.type}`}>
                    {toast.msg}
                </div>
            )}
            <h1><b>Account</b></h1>
            <div className="account-container">

                {/* Username */}
                <div className="account-section">
                    <label>Username</label>
                    <div className="account-value">{profile.username}</div>
                </div>

                {/* Email */}
                <div className="account-section">
                    <label>Email</label>
                    <div className="account-value">{profile.email}</div>
                </div>

                <hr className="divider" />

                {/* Schools */}
                <div className="account-section">
                    <label>Schools</label>
                    <div className="tags-container">
                        {profile.schools?.length > 0
                            ? profile.schools.map((s, i) => (
                                <span className="tag" key={i}>
                                    {s}
                                    <button className="tag-remove" onClick={() => handleRemoveSchool(s)}>×</button>
                                </span>
                            ))
                            : <span className="tag-empty">No schools added yet</span>
                        }
                    </div>
                    <form onSubmit={handleAddSchool} className="add-field-row">
                        <input
                            className="input-container"
                            type="text"
                            placeholder=" add a school"
                            value={newSchool}
                            onChange={(e) => setNewSchool(e.target.value)}
                        />
                        <button className="submitButton" type="submit">Add</button>
                    </form>
                </div>

                {/* Organizations */}
                <div className="account-section">
                    <label>Organizations</label>
                    <div className="tags-container">
                        {profile.orgs?.length > 0
                            ? profile.orgs.map((o, i) => (
                                <span className="tag" key={i}>
                                    {o}
                                    <button className="tag-remove" onClick={() => handleRemoveOrg(o)}>×</button>
                                </span>
                            ))
                            : <span className="tag-empty">No organizations added yet</span>
                        }
                    </div>
                    <form onSubmit={handleAddOrg} className="add-field-row">
                        <input
                            className="input-container"
                            type="text"
                            placeholder=" add an organization"
                            value={newOrg}
                            onChange={(e) => setNewOrg(e.target.value)}
                        />
                        <button className="submitButton" type="submit">Add</button>
                    </form>
                </div>
            </div>
        </main>
    );
}

export default Account;