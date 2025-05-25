import React from 'react';

export default function NoteCard({ note, refreshNotes }) {
  const handleDelete = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete this note?");
    if (!confirmDelete) return;
    const response = await fetch('/api/deletenote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: note._id })
    });
    const data = await response.json();
    if (data.success) {
      alert("Note deleted");
      refreshNotes();
    } else {
      alert("Failed to delete note");
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