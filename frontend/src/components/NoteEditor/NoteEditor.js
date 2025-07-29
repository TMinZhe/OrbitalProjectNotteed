import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { postData } from '../../../../backend/api';
import Canvas from '../Canvas/Canvas';
import SharingWindow from '../SharingWindow/SharingWindow';

// UI to edit all components of a note
export default function NoteEditor({ note, refreshNotes, editable }) {
  const [showShare, setShowShare] = useState(false);

  // Owner Verification
  const [localNote, setLocalNote] = useState(null);
  const currentUser = JSON.parse(localStorage.getItem('user'));
  const isOwner = localNote && currentUser?.email === localNote.email;

  // Canvas
  const [lines, setLines] = useState([]);
  const [textBoxes, setTextBoxes] = useState([]);
  const [images, setImages] = useState([]);
  
  // Note ID
  const location = useLocation();
  const urlKeys = new URLSearchParams(location.search);
  const noteId = urlKeys.get('id');

  // Fetches note contents and saves into variables
  const fetchNote = async () => {
    // If note parameter was not passed, search for it in local storage
    if (!noteId || note === null) return;

    try {
      const data = await postData('/api/getnote', { id: noteId });
      if (data.success) {
        setLocalNote(data.note);

        const canvas = data.note.canvasData || {};
        setLines(canvas.lines || []);
        setTextBoxes(canvas.textBoxes || []);
        loadImages(canvas.images || []);
      } else {
        alert('Note not found');
      }
    } catch (err) {
      alert('Error fetching note: ' + err.message);
    }
  };

  const createImageFromSrc = (src) => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.src = src;
    });
  };

  const loadImages = async (images) => {
    const loadedImages = await Promise.all(
      (images || []).map(async (img) => {
        const loadedImage = await createImageFromSrc(img.src);
        return {
          ...img,
          image: loadedImage,
        };
      })
    );
    setImages(loadedImages);
  };

  // If note param was passed in, set variables accordingly
  useEffect(() => {
    if (note) {
      setLocalNote(note);
      const canvas = note.canvasData || {};
      setLines(canvas.lines || []);
      setTextBoxes(canvas.textBoxes || []);
      loadImages(canvas.images || []);
    }
  }, [note]);

  useEffect(() => {
    fetchNote();
  }, [noteId]);

  const handleSubmit = async () => {
    const payload = {
      id: noteId || note?._id,
      email: localNote.email,
      canvasData: JSON.stringify({ lines, textBoxes, images }),
    };

    const data = await postData('/api/updatenote', payload);

    if (data.success) {
      fetchNote();
      refreshNotes();
    } else {
      alert('Failed to save note');
    }
  };

  return (
    <div
      style={{
        maxWidth: '80vw',
        maxHeight: '90vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        margin: '0 auto',
        padding: '1rem',
      }}
    >
      {isOwner && (
        <button onClick={() => setShowShare(true)}>Share</button>
      )}
      <SharingWindow
        noteId={noteId}
        isOpen={showShare}
        onClose={() => setShowShare(false)}
      />
      <button onClick={handleSubmit} className="btn btn-primary" disabled={!editable}>
        {editable ? "Save" : "View Only"}
      </button>
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <Canvas
          lines={lines}
          setLines={setLines}
          textBoxes={textBoxes}
          setTextBoxes={setTextBoxes}
          images={images}
          setImages={setImages}
          style={{ width: '100%', maxWidth: '100%' }}
        />
      </div>
    </div>
  );
}