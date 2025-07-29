import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar/NavBar';
import HomePage from './pages/HomePage';
import NotesPage from './pages/NotesPage/NotesPage';
import AccountPage from './pages/AccountPage';
import PublicNotePage from './pages/PublicNotePage/PublicNotePage';
import ProtectedRoute from './components/ProtectedRoute';
import './styles/variables.css' // Global stylesheet

// Main application
export default function App() {
  return (
    <Router>
      <NavBar />
      <Routes>
        <Route
          path="/"
          element={
            <HomePage />
          }
        />
        <Route
          path="/notes"
          element={
            <ProtectedRoute>
              <NotesPage />
            </ProtectedRoute>
          }
        />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/public/note/:linkId" element={<PublicNotePage />} />
      </Routes>
    </Router>
  );
}