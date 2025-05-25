import React, { useEffect, useState } from 'react';
import NoteCard from '../../components/NoteCard/NoteCard';
import NoteEditor from '../../components/NoteEditor/NoteEditor';
import CustomisationBar from '../../components/CustomisationBar/CustomisationBar';
import { postData } from '../../../../backend/api';

export default function NotesPage() {
  const [notes, setNotes] = useState([]);

  const fetchNotes = async () => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user?.email) return alert('Please login first');

  try {
    const data = await postData('/api/getnotes', { email: user.email });
    if (data.success) setNotes(data.notes);
  } catch (error) {
    console.error('Failed to fetch notes:', error);
  }
};

  useEffect(() => {
    fetchNotes();
  }, []);

  return (
    <div className="container-fluid">
      <CustomisationBar />
      <div className="row">
        <div className="col-2" style={{ backgroundColor: '#9ecadb' }}>
          <h1 className="my-4">Your Notes</h1>
          {notes.map(note => (
            <NoteCard key={note._id} note={note} refreshNotes={fetchNotes} />
          ))}
        </div>
        <div className="col-10 p-4" style={{ backgroundColor: '#cce4ed' }}>
          <NoteEditor refreshNotes={fetchNotes} />
        </div>
      </div>
    </div>
  );
}