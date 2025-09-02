// src/components/MagicPencil/MagicPencil.js

import React, { useEffect, useRef, useState } from 'react';
import { Canvas, PencilBrush, FabricImage } from 'fabric';
import {
  FaPencilAlt,
  FaHighlighter,
  FaEraser,
  FaHandPaper,
  FaDownload,
  FaUndo,
  FaRedo,
  FaTrash,
} from 'react-icons/fa';
import './MagicPencil.css';

const MagicPencil = ({ videoElement, isVisible, onClose }) => {
  const canvasRef = useRef(null);
  const fabricRef = useRef(null);
  const [currentTool, setCurrentTool] = useState('pencil');
  const [brushColor, setBrushColor] = useState('#FF0000');
  const [brushSize, setBrushSize] = useState(3);
  const [eraserSize, setEraserSize] = useState('medium');
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);

  const colorPresets = [
    '#FF0000',
    '#0066FF',
    '#FFD700',
    '#00FF00',
    '#FF8C00',
    '#9400D3',
    '#000000',
    '#FFFFFF',
  ];

  const eraserSizes = {
    small: 10,
    medium: 20,
    large: 40,
  };

  // 히스토리 저장 함수를 별도로 정의
  const saveToHistory = (canvas) => {
    const currentState = JSON.stringify(canvas.toJSON());
    setHistory((prev) => {
      const newHistory = [...prev.slice(0, historyStep + 1), currentState];
      return newHistory;
    });
    setHistoryStep((prev) => prev + 1);
  };

  useEffect(() => {
    if (!isVisible || !canvasRef.current) return;

    const canvas = new Canvas(canvasRef.current, {
      width: videoElement?.offsetWidth || 800,
      height: videoElement?.offsetHeight || 450,
      backgroundColor: 'transparent',
    });

    fabricRef.current = canvas;

    if (videoElement) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = videoElement.videoWidth;
      tempCanvas.height = videoElement.videoHeight;
      const ctx = tempCanvas.getContext('2d');
      ctx.drawImage(videoElement, 0, 0);

      const dataURL = tempCanvas.toDataURL();

      FabricImage.fromURL(dataURL).then((img) => {
        img.scaleToWidth(canvas.width);
        img.scaleToHeight(canvas.height);
        canvas.backgroundImage = img;
        canvas.renderAll();

        // 초기 상태 저장
        saveToHistory(canvas);
      });
    }

    // 이벤트 리스너 - path:created 이벤트에서만 히스토리 저장
    const handlePathCreated = () => {
      saveToHistory(canvas);
    };

    const handleObjectModified = () => {
      saveToHistory(canvas);
    };

    canvas.on('path:created', handlePathCreated);
    canvas.on('object:modified', handleObjectModified);

    return () => {
      // 클린업
      canvas.off('path:created', handlePathCreated);
      canvas.off('object:modified', handleObjectModified);
      canvas.dispose();
    };
  }, [isVisible, videoElement]);

  const selectTool = (tool) => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    setCurrentTool(tool);
    canvas.isDrawingMode = false;
    canvas.selection = false;

    // 모든 객체의 선택 가능 여부 초기화
    canvas.forEachObject((obj) => {
      obj.selectable = false;
      obj.evented = false;
    });

    switch (tool) {
      case 'pencil':
        canvas.isDrawingMode = true;
        const pencilBrush = new PencilBrush(canvas);
        pencilBrush.width = brushSize;
        pencilBrush.color = brushColor;
        canvas.freeDrawingBrush = pencilBrush;
        break;

      case 'highlighter':
        canvas.isDrawingMode = true;
        const highlighter = new PencilBrush(canvas);
        highlighter.width = brushSize * 4;
        highlighter.color = brushColor + '60';
        canvas.freeDrawingBrush = highlighter;
        break;

      case 'eraser':
        canvas.isDrawingMode = true;
        const eraser = new PencilBrush(canvas);
        eraser.width = eraserSizes[eraserSize];
        eraser.color = 'rgba(0,0,0,1)';
        canvas.freeDrawingBrush = eraser;
        canvas.freeDrawingBrush.globalCompositeOperation = 'destination-out';
        break;

      case 'select':
        canvas.selection = true;
        canvas.forEachObject((obj) => {
          obj.selectable = true;
          obj.evented = true;
        });
        break;
    }
  };

  const changeColor = (color) => {
    setBrushColor(color);
    const canvas = fabricRef.current;
    if (canvas && canvas.freeDrawingBrush && currentTool !== 'eraser') {
      canvas.freeDrawingBrush.color =
        currentTool === 'highlighter' ? color + '60' : color;
    }
  };

  const changeBrushSize = (size) => {
    setBrushSize(size);
    const canvas = fabricRef.current;
    if (canvas && canvas.freeDrawingBrush && currentTool !== 'eraser') {
      canvas.freeDrawingBrush.width =
        currentTool === 'highlighter' ? size * 4 : size;
    }
  };

  const changeEraserSize = (size) => {
    setEraserSize(size);
    const canvas = fabricRef.current;
    if (canvas && canvas.freeDrawingBrush && currentTool === 'eraser') {
      canvas.freeDrawingBrush.width = eraserSizes[size];
    }
  };

  const undo = () => {
    const canvas = fabricRef.current;
    if (!canvas || historyStep <= 0) return;

    const newStep = historyStep - 1;
    const state = JSON.parse(history[newStep]);

    canvas.loadFromJSON(state).then(() => {
      canvas.renderAll();
      setHistoryStep(newStep);
    });
  };

  const redo = () => {
    const canvas = fabricRef.current;
    if (!canvas || historyStep >= history.length - 1) return;

    const newStep = historyStep + 1;
    const state = JSON.parse(history[newStep]);

    canvas.loadFromJSON(state).then(() => {
      canvas.renderAll();
      setHistoryStep(newStep);
    });
  };

  const clearCanvas = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    // 모든 그려진 객체 제거 (배경 이미지는 유지)
    const objects = canvas.getObjects();
    objects.forEach((obj) => {
      canvas.remove(obj);
    });

    canvas.renderAll();
    saveToHistory(canvas);
  };

  const saveAsPNG = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2,
    });

    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.download = `video-analysis-${timestamp}.png`;
    link.href = dataURL;
    link.click();
  };

  // 초기 도구 설정
  useEffect(() => {
    if (fabricRef.current && isVisible) {
      selectTool('pencil');
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="magicPencilOverlay">
      <div className="magicPencilContainer">
        <canvas ref={canvasRef} className="magicPencilCanvas" />

        <div className="magicPencilTools">
          <button className="mpCloseBtn" onClick={onClose}>
            ✕
          </button>

          <div className="mpToolGroup">
            <button
              className={`mpTool ${currentTool === 'select' ? 'active' : ''}`}
              onClick={() => selectTool('select')}
              title="선택/이동"
            >
              <FaHandPaper />
            </button>
            <button
              className={`mpTool ${currentTool === 'pencil' ? 'active' : ''}`}
              onClick={() => selectTool('pencil')}
              title="펜"
            >
              <FaPencilAlt />
            </button>
            <button
              className={`mpTool ${
                currentTool === 'highlighter' ? 'active' : ''
              }`}
              onClick={() => selectTool('highlighter')}
              title="형광펜"
            >
              <FaHighlighter />
            </button>
            <button
              className={`mpTool ${currentTool === 'eraser' ? 'active' : ''}`}
              onClick={() => selectTool('eraser')}
              title="지우개"
            >
              <FaEraser />
            </button>
          </div>

          <div className="mpColorGroup">
            {colorPresets.map((color) => (
              <button
                key={color}
                className={`mpColor ${brushColor === color ? 'active' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => changeColor(color)}
              />
            ))}
          </div>

          {currentTool !== 'eraser' && (
            <div className="mpSizeGroup">
              <label>굵기:</label>
              <input
                type="range"
                min="1"
                max="20"
                value={brushSize}
                onChange={(e) => changeBrushSize(Number(e.target.value))}
              />
              <span>{brushSize}px</span>
            </div>
          )}

          {currentTool === 'eraser' && (
            <div className="mpEraserSize">
              <button
                className={eraserSize === 'small' ? 'active' : ''}
                onClick={() => changeEraserSize('small')}
              >
                소
              </button>
              <button
                className={eraserSize === 'medium' ? 'active' : ''}
                onClick={() => changeEraserSize('medium')}
              >
                중
              </button>
              <button
                className={eraserSize === 'large' ? 'active' : ''}
                onClick={() => changeEraserSize('large')}
              >
                대
              </button>
            </div>
          )}

          <div className="mpActionGroup">
            <button
              onClick={undo}
              title="실행 취소"
              disabled={historyStep <= 0}
            >
              <FaUndo />
            </button>
            <button
              onClick={redo}
              title="다시 실행"
              disabled={historyStep >= history.length - 1}
            >
              <FaRedo />
            </button>
            <button onClick={clearCanvas} title="전체 지우기">
              <FaTrash />
            </button>
            <button
              onClick={saveAsPNG}
              className="mpSaveBtn"
              title="PNG로 저장"
            >
              <FaDownload /> 저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MagicPencil;
