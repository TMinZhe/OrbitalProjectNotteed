import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { postData } from '../../../../backend/api';
import NoteEditor from '../../components/NoteEditor/NoteEditor';

// Page to access others' notes through link 
export default function PublicNotePage() {
  const { linkId } = useParams();
  const [note, setNote] = useState(null);
  const [permission, setPermission] = useState('viewer');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const email = JSON.parse(localStorage.getItem('user'))?.email || '';
        const res = await postData('/api/accessnote', { linkId, userEmail: email });

        if (res.success) {
          setNote(res.note);
          setPermission(res.permission);
        } else {
          setError(res.message);
        }
      } catch (err) {
        setError(err.message);
      }
    };

    fetchNote();
  }, [linkId]);

  if (error) return <div>{error}</div>;
  if (!note) return <div>Loading note...</div>;

  return (
    <div style={{ padding: '2rem' }}>
      <h2>{note.title}</h2>
      <NoteEditor
        note={note}
        refreshNotes={() => {
          const email = JSON.parse(localStorage.getItem('user'))?.email || '';
          postData('/api/accessnote', { linkId, userEmail: email }).then((res) => {
            if (res.success) {
              setNote(res.note);
              setPermission(res.permission);
            }
          });
        }}
        editable={permission === 'editor'}
      />
    </div>
  );
}
