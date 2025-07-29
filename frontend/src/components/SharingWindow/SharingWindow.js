import React, { useState, useEffect } from 'react';
import { postData } from '../../../../backend/api';
import './SharingWindow.css';

export default function SharingWindow({ noteId, isOpen, onClose }) {
    const [isPublic, setIsPublic] = useState(false);
    const [publicLink, setPublicLink] = useState('');
    const [loading, setLoading] = useState(false);
    const [publicPermission, setPublicPermission] = useState('viewer');

    const [emailToShare, setEmailToShare] = useState('');
    const [emailValidationMessage, setEmailValidationMessage] = useState('');
    const [autoSaveTriggered, setAutoSaveTriggered] = useState(false);

    const [addedViewers, setAddedViewers] = useState([]);
    const currentUserEmail = JSON.parse(localStorage.getItem('user'))?.email || '';

    useEffect(() => {
    if (autoSaveTriggered) {
        handleSaveSharingSettings();
        setAutoSaveTriggered(false);
    }
    }, [addedViewers, autoSaveTriggered]);

    useEffect(() => {
        const fetchSharingSettings = async () => {
            if (!noteId || !isOpen) return;

            setLoading(true);
            try {
            const data = await postData('/api/getnote', { id: noteId });
            if (data.success && data.note) {
                const note = data.note;
                setIsPublic(note.publicAccess?.enabled || false);
                setPublicPermission(note.publicAccess?.permission || 'viewer');
                if (note.linkId) {
                    setPublicLink(`${window.location.origin}/public/note/${note.linkId}`);
                }
  
                setAddedViewers(note.sharedAccess?.users || []);
            }
            } catch (err) {
            console.error('Failed to load sharing settings:', err);
            alert('Could not load sharing settings.');
            } finally {
            setLoading(false);
            }
        };

        if (isOpen) {
            document.body.style.overflow = 'hidden';
            fetchSharingSettings();
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen, noteId]);
    
    if (!isOpen) return null;

    const handleTogglePublic = async () => {
        setLoading(true);
        try {
        const data = await postData('/api/setPublic', {
            id: noteId,
            makePublic: !isPublic,
        });

        if (data.success) {
            setIsPublic(!isPublic);
            if (data.publicId) {
                setPublicLink(`${window.location.origin}/public/note/${data.publicId}`);
            }
        }
        } catch (err) {
        alert("Error updating share status");
        } finally {
        setLoading(false);
        }
    };

    const handleChangePublicPermission = (permission) => {
        setPublicPermission(permission);
        setAutoSaveTriggered(true);
    };

    const handleAddUser = async () => {
        if (!emailToShare.includes('@')) {
            setEmailValidationMessage('Invalid email address');
            return;
        }

        if (emailToShare === currentUserEmail) {
            setEmailValidationMessage('You cannot add yourself');
            return;
        }

        if (addedViewers.some(user => user.email === emailToShare)) {
            setEmailValidationMessage('User already added');
            return;
        }

        setLoading(true);

        try {
            const res = await postData('/api/checkemail', { email: emailToShare });

            if (res.success && res.exists) {
            setAddedViewers(prev => [
                ...prev,
                { email: emailToShare, role: 'viewer' }
            ]);
            setEmailValidationMessage('User added as viewer');
            setEmailToShare('');
            setAutoSaveTriggered(true);
            } else {
            setEmailValidationMessage('Email not found');
            }
        } catch (err) {
            console.error('Email check error:', err);
            setEmailValidationMessage('Error checking email');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSharingSettings = async () => {
        setLoading(true);
        try {
            const response = await postData('/api/updatesharing', {
            noteId,
            publicAccess: {
                enabled: isPublic,
                permission: publicPermission
            },
            sharedAccess: {
                users: addedViewers
            }
            });

            if (!response.success) {
            alert('Failed to save sharing settings');
            }
        } catch (err) {
            console.error('Failed to update sharing settings:', err);
            alert('An error occurred while saving sharing settings');
        } finally {
            setLoading(false);
        }
    };    

    return (
        <div className="sharing-absolute-overlay">
        <div className="sharing-absolute-window">
            <h3>Share</h3>
            <label>
            <input
                type="checkbox"
                checked={isPublic}
                onChange={handleTogglePublic}
                disabled={loading}
            />
            {' '}Make this note public
            </label>

            <div className="public-access-section">
                {/* Public Permission (only if public is enabled) */}
                {isPublic && (
                    <div style={{ marginTop: '10px' }}>
                    <label>
                        Public Permission:&nbsp;
                        <select
                        value={publicPermission}
                        onChange={e => handleChangePublicPermission(e.target.value)}
                        disabled={loading}
                        >
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                        </select>
                    </label>
                    </div>
                )}
                
                {/* Shareable Public Link */}
                {publicLink && (
                    <div className="share-link">
                    <input type="text" readOnly value={publicLink} />
                    <button onClick={() => navigator.clipboard.writeText(publicLink)}>Copy</button>
                    </div>
                )}

                {/* Add User by Email */}
                <div className="add-user-section" style={{ marginTop: '20px' }}>
                    <label>
                    Share with someone:
                    <div style={{ display: 'flex', marginTop: '6px', gap: '8px' }}>
                        <input
                        type="email"
                        placeholder="Enter email"
                        value={emailToShare}
                        onChange={e => {
                            setEmailToShare(e.target.value);
                            setEmailValidationMessage('');
                        }}
                        style={{ flex: 1 }}
                        />
                        <button onClick={handleAddUser} disabled={loading || !emailToShare}>
                        Add
                        </button>
                    </div>
                    </label>

                    {emailValidationMessage && (
                    <div style={{ marginTop: '6px', color: emailValidationMessage.includes('not') ? 'red' : 'green' }}>
                        {emailValidationMessage}
                    </div>
                    )}
                </div>
                {/* List of Shared Users */}
                {addedViewers.length > 0 && (
                <div className="shared-users-list" style={{ marginTop: '20px' }}>
                    <h4>Shared with:</h4>
                    <ul>
                    {addedViewers.map((user, idx) => (
                        <li key={idx} style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: '10px' }}>{user.email}</span>

                        {/* Role Dropdown */}
                        <select
                            value={user.role || 'viewer'}
                            onChange={async (e) => {
                                const newRole = e.target.value;
                                try {
                                    const json = await postData(`/api/notes/${noteId}/updaterole`, { email: user.email, role: newRole });
                                    if (json.success) {
                                        const updated = addedViewers.map((u, i) =>
                                        i === idx ? { ...u, role: newRole } : u
                                        );
                                        setAddedViewers(updated);
                                        setAutoSaveTriggered(true);
                                    } else {
                                        console.error("Update role failed:", json.message);
                                    }
                                    } catch (err) {
                                    console.error("Failed to update role:", err);
                                    }
                            }}
                            style={{ marginRight: '10px' }}
                        >
                            <option value="viewer">Viewer</option>
                            <option value="editor">Editor</option>
                        </select>

                        {/* Remove Button */}
                        <button
                            onClick={async () => {
                                try {
                                    const json = await postData(`/api/notes/${noteId}/removeaccess`, { email: user.email });
                                    if (json.success) {
                                        setAddedViewers(prev => prev.filter(u => u.email !== user.email));
                                        setAutoSaveTriggered(true);
                                    } else {
                                        console.error("Remove access failed:", json.message);
                                    }
                                    } catch (err) {
                                    console.error("Failed to remove viewer:", err);
                                    }
                            }}
                            style={{ background: 'red', color: 'white', border: 'none', padding: '5px 8px', cursor: 'pointer' }}
                        >
                            Remove
                        </button>
                        </li>
                    ))}
                    </ul>
                </div>
                )}
                </div>
            <button onClick={onClose} className="close-btn">Close</button>
        </div>
        </div>
    );
}