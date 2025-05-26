import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { postData } from '../../../../backend/api';

export default function NoteEditor({ refreshNotes }) {
  const [desc, setDesc] = useState('');

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const noteId = queryParams.get('id');

  useEffect(() => {
    const fetchNote = async () => {
      if (!noteId) return;

      const data = await postData('/api/getnote', { id: noteId });
      if (data.success) {
        setDesc(data.note.desc);
      } else {
        alert('Note not found');
      }
    };

    fetchNote();
  }, [noteId]);

   const handleSubmit = async () => {
    const email = JSON.parse(localStorage.getItem('user'))?.email;
    let data;

    data = await postData('/api/updatenote', { id: noteId, desc });

    if (data.success) {
      refreshNotes();
    } else {
      alert('Failed to save note');
    }
  };

  return (
    <>
      <div className="mb-3">
        <label htmlFor="desc" className="form-label">Description</label>
        <textarea className="form-control" id="desc" value={desc} onChange={e => setDesc(e.target.value)} />
      </div>
      <button onClick={handleSubmit} className="btn btn-primary">Submit</button>
    </>
  );
}