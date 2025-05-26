import React from 'react';
import { postData } from '../../../../backend/api';

export default function NoteCard({ note, refreshNotes }) {
  const handleDelete = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete this note?");
    if (!confirmDelete) return;

    try {
      const data = await postData('/api/deletenote', { id: note._id });
      if (data.success) {
        alert("Note deleted");
        refreshNotes();
      } else {
        alert("Failed to delete note");
      }
    } catch (error) {
      alert("Error deleting note");
      console.error(error);
    }
  };

  return (
    <div className="card mx-2 my-2" style={{ width: '18rem' }}>
      <div className="card-body">
        <h5 className="card-title">{note.title}</h5>
        <h6 className="card-subtitle mb-2 text-muted">Note Description</h6>
        <p className="card-text">{note.desc}</p>
        <a href={`./updateNote.html?id=${note._id}`} className="btn btn-warning btn-sm">Edit</a>
        <button onClick={handleDelete} className="btn btn-danger btn-sm ms-2">Delete</button>
      </div>
    </div>
  );
}