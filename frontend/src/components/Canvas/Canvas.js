import { postData } from '../../../../backend/api';
import React, { useRef, useState, useEffect } from 'react';
import { Image, Stage, Layer, Line, Text, Transformer, Rect } from 'react-konva';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, ImageRun } from 'docx';
import { saveAs } from 'file-saver';

// Receive parameters from parent NoteEditor
export default function Canvas({ lines, setLines, textBoxes, setTextBoxes, images, setImages }) {
  // Selected canvas elements
  const [selectedId, setSelectedId] = useState(null);

  const fileInputRef = useRef(null);
  
  const isDrawing = useRef(false);
  const stageRef = useRef(null);
  const trRef = useRef(null);

  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontSize, setFontSize] = useState(20);
  const [isBold, setIsBold] = useState(false);
  const [fontColor, setFontColor] = useState("#000000");
  const [isErasing, setIsErasing] = useState(false);
  const [summary, setSummary] = useState('')

  // Drawing
  const handleMouseDown = (e) => {
    if (e.target === e.target.getStage()) {
      isDrawing.current = true;
      const pos = e.target.getStage().getPointerPosition();
      setLines([...lines, {
        isErasing,
        points: [pos.x, pos.y],
      }]);
      setSelectedId(null);
    } else {
      setSelectedId(e.target.id());
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing.current) return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();

    let lastLine = lines[lines.length - 1];
    if (!lastLine) return;
    lastLine.points = lastLine.points.concat([point.x, point.y]);
    lines.splice(lines.length - 1, 1, lastLine);
    setLines(lines.concat());
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  const addTextBox = () => {
    const newText = {
      id: `text-${textBoxes.length + 1}`,
      x: 100,
      y: 100,
      text: 'Double-click to edit',
      fontSize: fontSize,
      fontFamily: fontFamily,
      fontStyle: isBold ? 'bold' : 'normal',
      fill: fontColor,
      draggable: true,
    };
    setTextBoxes([...textBoxes, newText]);
  };

  const handleTextDblClick = (e, id) => {
    const absPos = e.target.getAbsolutePosition();
    const stageBox = stageRef.current.container().getBoundingClientRect();

    const textarea = document.createElement('textarea');
    textarea.value = textBoxes.find(t => t.id === id).text;

    Object.assign(textarea.style, {
      position: 'absolute',
      top: `${absPos.y + stageBox.top}px`,
      left: `${absPos.x + stageBox.left}px`,
      fontSize: '20px',
      padding: '4px',
      border: '1px solid gray',
      background: 'white',
      zIndex: 1000,
    });

    document.body.appendChild(textarea);
    textarea.focus();

    const removeTextarea = () => {
      setTextBoxes(textBoxes.map(t =>
        t.id === id ? { ...t, text: textarea.value } : t
      ));
      document.body.removeChild(textarea);
    };

    textarea.addEventListener('blur', removeTextarea);
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        removeTextarea();
      }
    });
  };

  // Images
  const createImageFromBlob = (blob) => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => resolve(img);
      img.src = URL.createObjectURL(blob);
    });
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const img = await createImageFromBlob(file);

    const id = `image-${images.length + 1}`;
    setImages(prev => [
      ...prev,
      {
        id,
        x: window.innerWidth / 2 - img.width / 2,
        y: (window.innerHeight - 60) / 2 - img.height / 2,
        image: img,
        width: img.width,
        height: img.height,
        src: imageToBase64(img),
      }
    ]);

    e.target.value = null;
  };
  
  const imageToBase64 = (img) => {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL();
  };

  // Summary
  const handleSummariseCanvas = async () => {
    if (!stageRef.current) return;

    try {
      setSummary('');

      const imageData = stageRef.current.toDataURL();
      const data = await postData('/api/summariseimage', { image: imageData });

      if (data.success) {
        setSummary(data.summary);
      } else {
        alert(data.message || 'Failed to generate summary.');
      }
    } catch (err) {
      console.error('Error summarising canvas:', err);
      alert('An error occurred while summarising the canvas.');
    }
  };

  // Exports
  const handleExport = () => {
    const uri = stageRef.current.toDataURL();
    const link = document.createElement('a');
    link.download = 'drawing.png';
    link.href = uri;
    link.click();
  };
  
  const handleExportPDF = async () => {
    const stage = stageRef.current;
    const dataUrl = stage.toDataURL({ pixelRatio: 2 });

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [stage.width(), stage.height()]
    });

    pdf.addImage(dataUrl, 'PNG', 0, 0, stage.width(), stage.height());
    pdf.save('canvas.pdf');
  };

  const handleExportDocx = async () => {
    const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const buffer = await blob.arrayBuffer();

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({
            children: [
              new ImageRun({
                data: buffer,
                transformation: {
                  width: stageRef.current.width(),
                  height: stageRef.current.height(),
                },
              }),
            ],
          }),
        ],
      }],
    });

    const pack = await Packer.toBlob(doc);
    saveAs(pack, 'canvas.docx');
  };

  // Update Contents
  useEffect(() => {
    const tr = trRef.current;
    if (!tr) return;

    if (selectedId) {
      const stage = stageRef.current;
      const selectedNode = stage.findOne(`#${selectedId}`);
      if (selectedNode) {
        tr.nodes([selectedNode]);
      } else {
        tr.nodes([]);
      }
    } else {
      tr.nodes([]);
    }
    tr.getLayer()?.batchDraw();
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    setTextBoxes((prev) =>
      prev.map((t) =>
        t.id === selectedId
          ? {
              ...t,
              fontSize,
              fontFamily,
              fontStyle: isBold ? "bold" : "normal",
              fill: fontColor,
            }
          : t
      )
    );
  }, [fontSize, fontFamily, isBold, fontColor]);

  useEffect(() => {
    const handlePaste = async (e) => {
      const clipboardItems = e.clipboardData.items;
      for (let i = 0; i < clipboardItems.length; i++) {
        const item = clipboardItems[i];
        if (item.type.indexOf("image") !== -1) {
          e.preventDefault();

          const blob = item.getAsFile();
          const img = await createImageFromBlob(blob);

          const id = `image-${images.length + 1}`;
          setImages(prev => [
            ...prev,
            {
              id,
              x: window.innerWidth / 2 - img.width / 2,
              y: (window.innerHeight - 60) / 2 - img.height / 2,
              image: img,
              width: img.width,
              height: img.height,
              src: imageToBase64(img),
            }
          ]);
        }
      }
    };

    window.addEventListener("paste", handlePaste);
      return () => window.removeEventListener("paste", handlePaste);
    }, [images]);

    useEffect(() => {
      const tr = trRef.current;
      if (!tr || !selectedId) return;

      const stage = stageRef.current;
      const selectedNode = stage.findOne(`#${selectedId}`);
      if (selectedNode) {
        tr.nodes([selectedNode]);
      } else {
        tr.nodes([]);
      }
      tr.getLayer()?.batchDraw();
    }, [selectedId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) {
          setImages(prev => prev.filter(img => img.id !== selectedId));
          setTextBoxes(prev => prev.filter(t => t.id !== selectedId));
          setSelectedId(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId]);

  return (
    <div>
      <textarea
      value={summary}
      readOnly
      style={{
        width: '100%',
        minHeight: '50px',
        resize: 'vertical',
        padding: '8px',
        fontSize: '16px',
        fontFamily: 'Arial, sans-serif',
        border: '1px solid #ccc',
        borderRadius: '4px',
      }}
    />
      <button onClick={addTextBox}>Add Text Box</button>
      <button onClick={handleExport}>Export as Image</button>
      <button onClick={handleExportPDF}>Export as PDF</button>
      <button onClick={handleExportDocx}>Export as DOCX</button>
      <button onClick={handleSummariseCanvas}>Summarise Canvas</button>
      <input
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        ref={fileInputRef}
        onChange={handleImageFileChange}
      />
      <button onClick={() => fileInputRef.current.click()}>
        Upload Image
      </button>
      <div>
        <label>Font:
          <select value={fontFamily} onChange={e => setFontFamily(e.target.value)}>
            <option value="Arial">Arial</option>
            <option value="Courier">Courier</option>
            <option value="Georgia">Georgia</option>
            <option value="Times New Roman">Times New Roman</option>
          </select>
        </label>

        <button onClick={() => setIsErasing(prev => !prev)}>
          {isErasing ? "Pen" : "Eraser"}
        </button>

        <label>Size:
          <input type="number" value={fontSize} onChange={e => setFontSize(+e.target.value)} />
        </label>

        <label>Bold:
          <input type="checkbox" checked={isBold} onChange={e => setIsBold(e.target.checked)} />
        </label>

        <label>Color:
          <input type="color" value={fontColor} onChange={e => setFontColor(e.target.value)} />
        </label>
      </div>
      <Stage
        width={window.innerWidth}
        height={window.innerHeight - 60}
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
        ref={stageRef}
        style={{ background: '#fff', border: '1px solid #ccc' }}
      >
        <Layer>
          <Rect // Background
            x={0}
            y={0}
            width={window.innerWidth}
            height={window.innerHeight - 60}
            fill="white"
            listening={false}
          />

          {lines.map((line, i) => ( // Lines
            <Line
              key={i}
              points={line.points}
              stroke={line.isErasing ? "white" : "black"}
              strokeWidth={line.isErasing ? 20 : 2}
              tension={0.5}
              lineCap="round"
              globalCompositeOperation={
                line.isErasing ? "destination-out" : "source-over"
              }
            />
          ))}

          {textBoxes.map((t) => ( // Text Boxes
            <Text
              key={t.id}
              id={t.id}
              {...t}
              onClick={() => setSelectedId(t.id)}
              onDblClick={(e) => handleTextDblClick(e, t.id)}
              onDragEnd={(e) => {
                const { x, y } = e.target.position();
                setTextBoxes(prev =>
                  prev.map(txt =>
                    txt.id === t.id ? { ...txt, x, y } : txt
                  )
                );
              }}
            />
          ))}

          {images.map(imgObj => ( // Images
            <Image
              key={imgObj.id}
              id={imgObj.id}
              image={imgObj.image}
              x={imgObj.x}
              y={imgObj.y}
              width={imgObj.width}
              height={imgObj.height}
              draggable
              onClick={() => {
                setSelectedId(imgObj.id);
              }}
              onDragEnd={e => {
                const { x, y } = e.target.position();
                setImages(prev => prev.map(img => img.id === imgObj.id ? { ...img, x, y } : img));
              }}
            />
          ))}
          <Transformer ref={trRef} />
        </Layer>
      </Stage>
    </div>
  );
}
