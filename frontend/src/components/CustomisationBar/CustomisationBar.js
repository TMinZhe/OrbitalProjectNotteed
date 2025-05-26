import React from 'react';
import './CustomisationBar.css';

export default function CustomisationBar() {
  return (
    <div style={{ backgroundColor: 'lightgrey' }} className="customisation-bar">
      <select id="fontPicker">
        <option value="Arial">Arial</option>
        <option value="Georgia">Georgia</option>
        <option value="Courier New">Courier New</option>
        <option value="Times New Roman">Times New Roman</option>
        <option value="Verdana">Verdana</option>
        <option value="Comic Sans MS">Comic Sans</option>
      </select>
      <button className="btn">BOLD</button>
      <button className="btn">ITALICS</button>
      <button className="btn">UNDERLINED</button>
    </div>
  );
}