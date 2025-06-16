import { postData } from '../../../../backend/api';
import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Line, Text, Transformer, Rect } from 'react-konva';

export default function Canvas({ lines, setLines, textBoxes, setTextBoxes }) {
  const [selectedId, setSelectedId] = useState(null);

  const isDrawing = useRef(false);
  const stageRef = useRef(null);
  const trRef = useRef(null);

  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontSize, setFontSize] = useState(20);
  const [isBold, setIsBold] = useState(false);
  const [fontColor, setFontColor] = useState("#000000");

  // === Drawing ===
  const handleMouseDown = (e) => {
    if (e.target === e.target.getStage()) {
      isDrawing.current = true;
      const pos = e.target.getStage().getPointerPosition();
      setLines([...lines, { points: [pos.x, pos.y] }]);
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
    lastLine.points = lastLine.points.concat([point.x, point.y]);
    lines.splice(lines.length - 1, 1, lastLine);
    setLines(lines.concat());
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  const handleExport = () => {
    const uri = stageRef.current.toDataURL();
    const link = document.createElement('a');
    link.download = 'drawing.png';
    link.href = uri;
    link.click();
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

  useEffect(() => {
    const transformer = trRef.current;
    if (!transformer) return;

    if (selectedId) {
      const stage = stageRef.current;
      const selectedNode = stage.findOne(`#${selectedId}`);
      if (selectedNode) {
        transformer.nodes([selectedNode]);
      } else {
        transformer.nodes([]);
      }
    } else {
      transformer.nodes([]);
    }

    transformer.getLayer()?.batchDraw();
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

  return (
    <div>
      <button onClick={addTextBox}>Add Text Box</button>
      <button onClick={handleExport}>Export as Image</button>
      <div>
        <label>Font:
          <select value={fontFamily} onChange={e => setFontFamily(e.target.value)}>
            <option value="Arial">Arial</option>
            <option value="Courier">Courier</option>
            <option value="Georgia">Georgia</option>
            <option value="Times New Roman">Times New Roman</option>
          </select>
        </label>

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

          {lines.map((line, i) => (
            <Line
              key={i}
              points={line.points}
              stroke="black"
              strokeWidth={2}
              tension={0.5}
              lineCap="round"
              globalCompositeOperation="source-over"
            />
          ))}

          {textBoxes.map((t) => (
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

          <Transformer ref={trRef} />
        </Layer>
      </Stage>
    </div>
  );
}
