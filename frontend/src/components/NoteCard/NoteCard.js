import React, { useState } from 'react';
import { postData } from '../../../../backend/api';
import './NoteCard.css';

export default function NoteCard({ note, refreshNotes }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(note.title);

  const handleDelete = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete this note?");
    if (!confirmDelete) return;

    try {
      const data = await postData('/api/deletenote', { id: note._id });
      if (data.success) {
        refreshNotes();
      } else {
        alert("Failed to delete note");
      }
    } catch (error) {
      alert("Error deleting note");
      console.error(error);
    }
  };

  const handleTitleClick = () => setIsEditing(true);

  const handleTitleChange = (e) => setTitle(e.target.value);

  const handleTitleBlur = async () => {
    setIsEditing(false);
    if (title !== note.title) {
      try {
        const data = await postData('/api/updatenote', {
          id: note._id,
          title,
          desc: note.desc,
        });
        if (data.success) {
          refreshNotes();
        } else {
          alert("Failed to update title");
        }
      } catch (error) {
        alert("Error updating title");
        console.error(error);
      }
    }
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  };

  return (
    <div className="note-card card mx-2 my-2" style={{ width: '18rem' }}>
      <div 
        className="card-body"
        onClick={() => window.location.href = `./notes?id=${note._id}`}
        style={{ cursor: 'pointer' }}
      >
        {isEditing ? (
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            autoFocus
            className="form-control mb-2"
          />
        ) : (
          <h5 className="card-title py-2" onClick={(e) => {
            e.stopPropagation();
            handleTitleClick();
          }}
          style={{ cursor: 'pointer' }}>
            {title}
          </h5>
        )}
        <p className="card-text text-muted">{note.desc}</p>
        <button onClick={(e) => {
            e.stopPropagation(); // prevent navigation
            handleDelete();
          }} 
          className="btn btn-danger btn-sm">
            Delete
          </button>
      </div>
    </div>
  );
}