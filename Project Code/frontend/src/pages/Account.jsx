import "../css/Account.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Account() {
    const [profile, setProfile] = useState(null);
    const [newSchool, setNewSchool] = useState("");
    const [toast, setToast] = useState(null);

    // Org search state
    const [orgSearch, setOrgSearch] = useState("");
    const [orgResults, setOrgResults] = useState([]);
    const [orgSearched, setOrgSearched] = useState(false);

    const nav = useNavigate();

    const showToast = (msg, type) => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 2000);
    };

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await fetch("https://stella-backend-qg81.onrender.com/api/users/me", {
                    credentials: "include",
                });
                if (!response.ok) { nav("/login"); return; }
                const data = await response.json();
                setProfile(data);
            } catch (err) {
                console.log(err);
                nav("/login");
            }
        };
        fetchProfile();
    }, []);

    const handleRemoveSchool = async (school) => {
        try {
            const response = await fetch("https://stella-backend-qg81.onrender.com/api/users/remove/school", {
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
        } catch (err) {
            showToast(err.message, "failure");
        }
    };

    const handleAddSchool = async (e) => {
        e.preventDefault();
        if (!newSchool.trim()) return;
        try {
            const response = await fetch("https://stella-backend-qg81.onrender.com/api/users/add/school", {
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
        } catch (err) {
            showToast(err.message, "failure");
        }
    };

    const handleOrgSearch = async (e) => {
        e.preventDefault();
        if (!orgSearch.trim()) return;
        try {
            const response = await fetch(
                `https://stella-backend-qg81.onrender.com/api/orgs/search?name=${encodeURIComponent(orgSearch.trim())}`,
                { credentials: "include" }
            );
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Search failed");
            setOrgResults(data);
            setOrgSearched(true);
        } catch (err) {
            showToast(err.message, "failure");
        }
    };

    const handleRequestJoin = async (orgId) => {
        try {
            const response = await fetch(`https://stella-backend-qg81.onrender.com/api/orgs/${orgId}/request`, {
                method: "POST",
                credentials: "include",
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to send request");
            showToast("Join request sent!", "success");
            setOrgResults([]);
            setOrgSearch("");
            setOrgSearched(false);
        } catch (err) {
            showToast(err.message, "failure");
        }
    };

    if (!profile) {
        return <main className="account"><p>Loading...</p></main>;
    }

    return (
        <main className="account">
            {toast && (
                <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
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

                <hr className="divider" />

                {/* Organizations */}
                <div className="account-section">
                    <label>Organizations</label>

                    {/* Current accepted memberships */}
                    <div className="tags-container">
                        {profile.orgs?.length > 0
                            ? profile.orgs.map((o) => (
                                <span className="tag" key={o.id}>{o.name}</span>
                            ))
                            : <span className="tag-empty">No organizations yet</span>
                        }
                    </div>

                    {/* Search & request to join */}
                    <form onSubmit={handleOrgSearch} className="add-field-row" style={{ marginTop: "1rem" }}>
                        <input
                            className="input-container"
                            type="text"
                            placeholder=" search for an organization"
                            value={orgSearch}
                            onChange={(e) => {
                                setOrgSearch(e.target.value);
                                if (orgSearched) setOrgSearched(false);
                            }}
                        />
                        <button className="submitButton" type="submit">Search</button>
                    </form>

                    {orgSearched && orgResults.length === 0 && (
                        <p className="tag-empty">No organizations found.</p>
                    )}

                    {orgResults.length > 0 && (
                        <div className="org-search-results">
                            {orgResults.map((org) => (
                                <div className="org-result-row" key={org.id}>
                                    <div className="org-result-info">
                                        <span className="org-result-name">{org.name}</span>
                                        {org.description && (
                                            <span className="org-result-desc">{org.description}</span>
                                        )}
                                        <span className="org-result-meta">
                                            Owner: {org.owner_username} · {org.member_count} member{org.member_count !== 1 ? "s" : ""}
                                        </span>
                                    </div>
                                    <button className="submitButton" onClick={() => handleRequestJoin(org.id)}>
                                        Request to Join
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </main>
    );
}

export default Account;