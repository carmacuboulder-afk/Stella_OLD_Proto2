import "../css/OrgManage.css";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

function OrgManage({ refreshUser }) {
    const { id } = useParams();
    const nav = useNavigate();

    const [org, setOrg] = useState(null);
    const [members, setMembers] = useState([]);
    const [pending, setPending] = useState([]);
    const [editName, setEditName] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editMode, setEditMode] = useState(false);
    const [transferUserId, setTransferUserId] = useState("");
    const [toast, setToast] = useState(null);

    const showToast = (msg, type) => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 2500);
    };

    const fetchManageData = async () => {
        try {
            const response = await fetch(`http://localhost:8000/api/orgs/${id}/manage`, {
                credentials: "include",
            });
            if (response.status === 401) { nav("/login"); return; }
            if (response.status === 403) { nav("/"); return; }
            if (!response.ok) throw new Error("Failed to load organization");

            const data = await response.json();
            setOrg(data.org);
            setMembers(data.members);
            setPending(data.pending);
            setEditName(data.org.name);
            setEditDescription(data.org.description || "");
            setTransferUserId("");
        } catch (err) {
            showToast(err.message, "failure");
        }
    };

    useEffect(() => {
        fetchManageData();
    }, [id]);

    const handleAccept = async (userId) => {
        try {
            const response = await fetch(`http://localhost:8000/api/orgs/${id}/accept/${userId}`, {
                method: "POST",
                credentials: "include",
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to accept request");
            showToast("Request accepted!", "success");
            fetchManageData();
        } catch (err) {
            showToast(err.message, "failure");
        }
    };

    const handleDeny = async (userId) => {
        try {
            const response = await fetch(`http://localhost:8000/api/orgs/${id}/deny/${userId}`, {
                method: "POST",
                credentials: "include",
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to deny request");
            showToast("Request denied.", "success");
            fetchManageData();
        } catch (err) {
            showToast(err.message, "failure");
        }
    };

    const handleRemoveMember = async (userId) => {
        try {
            const response = await fetch(`http://localhost:8000/api/orgs/${id}/remove/${userId}`, {
                method: "DELETE",
                credentials: "include",
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to remove member");
            showToast("Member removed.", "success");
            fetchManageData();
        } catch (err) {
            showToast(err.message, "failure");
        }
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`http://localhost:8000/api/orgs/${id}/edit`, {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: editName, description: editDescription }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to update organization");
            showToast("Organization updated!", "success");
            setEditMode(false);
            fetchManageData();
        } catch (err) {
            showToast(err.message, "failure");
        }
    };

    const handleTransfer = async (e) => {
        e.preventDefault();
        if (!transferUserId) return;
        if (!window.confirm("Are you sure you want to transfer ownership? You will lose management access.")) return;
        try {
            const response = await fetch(`http://localhost:8000/api/orgs/${id}/transfer/${transferUserId}`, {
                method: "PUT",
                credentials: "include",
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to transfer ownership");
            showToast("Ownership transferred.", "success");
            await refreshUser();
            setTimeout(() => nav("/"), 1500);
        } catch (err) {
            showToast(err.message, "failure");
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this organization? This cannot be undone.")) return;
        try {
            const response = await fetch(`http://localhost:8000/api/orgs/${id}`, {
                method: "DELETE",
                credentials: "include",
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to delete organization");
            showToast("Organization deleted.", "success");
            await refreshUser();
            setTimeout(() => nav("/"), 1500);
        } catch (err) {
            showToast(err.message, "failure");
        }
    };

    if (!org) return <main className="org-manage"><p>Loading...</p></main>;

    // Exclude the owner from the transfer dropdown
    const transferableMembers = members.filter((m) => m.id !== org.owner_user_id);

    return (
        <main className="org-manage">
            {toast && (
                <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
            )}

            <h1><b>{org.name}</b> — Management</h1>

            <div className="org-manage-container">

                {/* Org Details */}
                <div className="org-section">
                    <label>Organization Details</label>
                    {editMode ? (
                        <form onSubmit={handleEdit} className="edit-form">
                            <input
                                className="input-container"
                                type="text"
                                required
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder=" organization name"
                            />
                            <textarea
                                className="input-container"
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                placeholder=" description"
                                rows={3}
                            />
                            <div className="org-button-row">
                                <button className="submitButton" type="submit">Save</button>
                                <button className="submitButton btn-secondary" type="button" onClick={() => setEditMode(false)}>Cancel</button>
                            </div>
                        </form>
                    ) : (
                        <div className="org-details">
                            <div className="account-value"><b>Name:</b> {org.name}</div>
                            <div className="account-value"><b>Description:</b> {org.description || <i>No description</i>}</div>
                            <div className="account-value"><b>Created:</b> {new Date(org.created_at).toLocaleDateString()}</div>
                            <button className="submitButton" style={{ marginTop: "0.5rem" }} onClick={() => setEditMode(true)}>Edit Details</button>
                        </div>
                    )}
                </div>

                <hr className="divider" />

                {/* Pending Requests */}
                <div className="org-section">
                    <label>
                        Pending Join Requests
                        {pending.length > 0 && <span className="pending-badge">{pending.length}</span>}
                    </label>
                    {pending.length === 0
                        ? <span className="tag-empty">No pending requests</span>
                        : pending.map((user) => (
                            <div className="member-row" key={user.id}>
                                <div className="member-info">
                                    <span className="member-name">{user.username}</span>
                                    <span className="member-meta">{user.email}</span>
                                    <span className="member-meta">Requested: {new Date(user.requested_at).toLocaleDateString()}</span>
                                </div>
                                <div className="org-button-row">
                                    <button className="submitButton btn-accept" onClick={() => handleAccept(user.id)}>Accept</button>
                                    <button className="submitButton btn-danger" onClick={() => handleDeny(user.id)}>Deny</button>
                                </div>
                            </div>
                        ))
                    }
                </div>

                <hr className="divider" />

                {/* Members */}
                <div className="org-section">
                    <label>Members ({members.length})</label>
                    {members.map((user) => (
                        <div className="member-row" key={user.id}>
                            <div className="member-info">
                                <span className="member-name">
                                    {user.username}
                                    {user.id === org.owner_user_id && <span className="owner-tag">owner</span>}
                                </span>
                                <span className="member-meta">{user.email}</span>
                                <span className="member-meta">Joined: {new Date(user.joined_at).toLocaleDateString()}</span>
                            </div>
                            {user.id !== org.owner_user_id && (
                                <button
                                    className="submitButton btn-danger"
                                    onClick={() => handleRemoveMember(user.id)}
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <hr className="divider" />

                {/* Transfer Ownership */}
                <div className="org-section">
                    <label>Transfer Ownership</label>
                    {transferableMembers.length === 0
                        ? <span className="tag-empty">No other members to transfer ownership to</span>
                        : (
                            <form onSubmit={handleTransfer} className="add-field-row">
                                <select
                                    className="input-container"
                                    value={transferUserId}
                                    onChange={(e) => setTransferUserId(e.target.value)}
                                    required
                                >
                                    <option value="">Select a member...</option>
                                    {transferableMembers.map((m) => (
                                        <option key={m.id} value={m.id}>{m.username}</option>
                                    ))}
                                </select>
                                <button className="submitButton btn-danger" type="submit">Transfer</button>
                            </form>
                        )
                    }
                </div>

                <hr className="divider" />

                {/* Delete */}
                <div className="org-section">
                    <button className="submitButton btn-danger" onClick={handleDelete}>
                        Delete Organization
                    </button>
                </div>

            </div>
        </main>
    );
}

export default OrgManage;