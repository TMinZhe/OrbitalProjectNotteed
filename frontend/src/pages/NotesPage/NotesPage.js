import React, { useEffect, useState } from 'react';
import NoteCard from '../../components/NoteCard/NoteCard';
import NoteEditor from '../../components/NoteEditor/NoteEditor';
import CustomisationBar from '../../components/CustomisationBar/CustomisationBar';
import { postData } from '../../../../backend/api';
import './NotesPage.css'

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

  const handleAddNewNote = async () => {
    const email = JSON.parse(localStorage.getItem('user'))?.email;
    if (!email) return alert('Please login first');

    const existingTitles = notes.map(note => note.title);
    let counter = 1;
    let newTitle = `New Note ${counter}`;
    while (existingTitles.includes(newTitle)) {
      counter++;
      newTitle = `New Note ${counter}`;
    }

    const data = await postData('/api/addnote', {
      title: newTitle,
      desc: '',
      email: email
    });

    if (data.success) {
      fetchNotes();
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  return (
    <div className="notes-page">
      <CustomisationBar />
      <div className="notes-content">
        <div className="note-list" style={{ backgroundColor: '#9ecadb' }}>
          <div style={{display: 'flex', gap: '1rem'}}>
            <h2>Your Notes</h2>
            <button className='add-note-btn' onClick={handleAddNewNote}>+</button>
          </div>
          {notes.map(note => (
            <NoteCard key={note._id} note={note} refreshNotes={fetchNotes} />
          ))}
        </div>
        <div className="note-editor" style={{ backgroundColor: '#cce4ed' }}>
          <NoteEditor refreshNotes={fetchNotes} />
        </div>
      </div>
    </div>
  );
}