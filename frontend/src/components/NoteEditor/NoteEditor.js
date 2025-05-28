import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { postData } from '../../../../backend/api';

export default function NoteEditor({ refreshNotes }) {
  const [desc, setDesc] = useState('');
  const [imageFile, setImageFile] = useState(null);

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const noteId = queryParams.get('id');

  useEffect(() => {
    const fetchNote = async () => {
      if (!noteId) return;

      const data = await postData('/api/getnote', { id: noteId });
      if (data.success) {
        setDesc(data.note.desc);
        setImageFile(data.note.imagePath);
      } else {
        alert('Note not found');
      }
    };

    fetchNote();
  }, [noteId]);

  const handleSubmit = async () => {
    const email = JSON.parse(localStorage.getItem('user'))?.email;
    const imageInput = document.getElementById('image');
    const image = imageInput?.files?.[0];

    let data;

    if (image) {
      const formData = new FormData();
      formData.append('id', noteId);
      formData.append('desc', desc);
      formData.append('email', email);
      formData.append('image', image);

      data = await postData('/api/updatenote', formData);

      document.getElementById('image').value = null;
      setImageFile(null);
    } else {
      data = await postData('/api/updatenote', {
        id: noteId,
        desc,
        email
      });
    }

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
      <div className="mb-3">
        {imageFile && (
          <div className="mb-3">
            <img
              src={
                typeof imageFile === 'string'
                  ? imageFile
                  : URL.createObjectURL(imageFile)
              }
              alt="Note"
              style={{ maxWidth: '20%', height: 'auto' }}
            />
          </div>
        )}
        <input
          type="file"
          className="form-control"
          id="image"
          onChange={e => setImageFile(e.target.files[0])}
        />
      </div>
      <button onClick={handleSubmit} className="btn btn-primary">Submit</button>
    </>
  );
}