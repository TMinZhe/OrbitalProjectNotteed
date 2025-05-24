import React, { useState } from 'react';

export default function NoteEditor({ refreshNotes }) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');

  const handleSubmit = async () => {
    const email = JSON.parse(localStorage.getItem('user'))?.email;
    const response = await fetch('/addnote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, desc, email })
    });
    const data = await response.json();
    if (data.success) {
      alert('Note created');
      setTitle('');
      setDesc('');
      refreshNotes();
    }
  };

  return (
    <>
      <h1 className="my-4">Add notes</h1>
      <div className="mb-3">
        <label htmlFor="title" className="form-label">Title</label>
        <input type="text" className="form-control" id="title" value={title} onChange={e => setTitle(e.target.value)} />
        <div className="form-text">just add title</div>
      </div>
      <div className="mb-3">
        <label htmlFor="desc" className="form-label">Description</label>
        <textarea className="form-control" id="desc" value={desc} onChange={e => setDesc(e.target.value)} />
      </div>
      <button onClick={handleSubmit} className="btn btn-primary">Submit</button>
    </>
  );
}