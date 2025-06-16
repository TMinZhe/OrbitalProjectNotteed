import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { postData } from '../../../../backend/api';
import Canvas from '../Canvas/Canvas';

export default function NoteEditor({ refreshNotes }) {
  const [desc, setDesc] = useState('');
  const [imageFile, setImageFile] = useState('');
  const [newImageFile, setNewImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');

  // Canvas
  const [lines, setLines] = useState([]);
  const [textBoxes, setTextBoxes] = useState([]);

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const noteId = queryParams.get('id');

  const fetchNote = async () => {
    if (!noteId) return;

    try {
      const data = await postData('/api/getnote', { id: noteId });
      if (data.success) {
        setDesc(data.note.desc);
        setImageFile(data.note.imagePath);

        const canvas = data.note.canvasData || {};
        setLines(canvas.lines || []);
        setTextBoxes(canvas.textBoxes || []);
      } else {
        alert('Note not found');
      }
    } catch (err) {
      alert('Error fetching note: ' + err.message);
    }
  };

  useEffect(() => {
    fetchNote();
  }, [noteId]);

  useEffect(() => {
    if (newImageFile) {
      const url = URL.createObjectURL(newImageFile);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } 
    else if (imageFile) {
      const fullUrl = `http://localhost:5073${imageFile}?t=${Date.now()}`;
      
      fetch(fullUrl)
        .then(response => {
          return response.blob();
        })
        .then(blob => {
          setImageUrl(fullUrl);
        })
        .catch(err => console.error("Image test failed:", err));
    }
  }, [newImageFile, imageFile]);

  const handleSubmit = async () => {
    const email = JSON.parse(localStorage.getItem('user'))?.email;

    let data;

    const formData = new FormData();
    formData.append('id', noteId);
    formData.append('desc', desc);
    formData.append('email', email);
    if (newImageFile) {
      formData.append('image', newImageFile);
    }
    formData.append('canvasData', JSON.stringify({ lines, textBoxes }));
    
    data = await postData('/api/updatenote', formData);

    if (data.success) {
      fetchNote();
      refreshNotes();
    } else {
      alert('Failed to save note');
    }
  };

  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerateSummary = async () => {
    if (!desc) return alert('Please enter some text to summarise.');

    setLoading(true);
    setSummary('');

    try {
      const data = await postData('/api/summarise', { text: desc });

      if (data.success) {
        setSummary(data.summary);
      } else {
        alert('Failed to generate summary.');
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      alert('Error while summarizing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-3">
        <label htmlFor="desc" className="form-label">Description</label>
        <textarea className="form-control" id="desc" value={desc} onChange={e => setDesc(e.target.value)} />
      </div>
      <div className="mb-3">
      {(imageUrl) && (
        <div className="mb-3">
          <img
            src={imageUrl}
            style={{ minWidth: '20%', maxWidth: '20%', height: 'auto' }}
          />
        </div>
      )}
      <input
        type="file"
        className="form-control"
        id="image"
        onChange={e => {
          const file = e.target.files[0];
          if (file) {
            setNewImageFile(file);
          }
        }}
      />
      </div>
      <button onClick={handleSubmit} className="btn btn-primary">Save</button>
      <div className="summary-section mt-2">
        <textarea readOnly className="form-control" value={summary} />
        <button onClick={handleGenerateSummary} id="summary-btn" className="btn btn-secondary mt-3">Generate Summary</button>
      </div>
      <Canvas 
        lines={lines}
        setLines={setLines}
        textBoxes={textBoxes}
        setTextBoxes={setTextBoxes}
      />
    </>
  );
}