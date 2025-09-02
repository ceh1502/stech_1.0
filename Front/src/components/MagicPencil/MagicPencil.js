import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
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

  // 색상 프리셋
  const colorPresets = [
    '#FF0000', // 빨강
    '#0066FF', // 파랑
    '#FFD700', // 노랑
    '#00FF00', // 초록
    '#FF8C00', // 주황
    '#9400D3', // 보라
    '#000000', // 검정
    '#FFFFFF', // 흰색
  ];

  // 지우개 크기
  const eraserSizes = {
    small: 10,
    medium: 20,
    large: 40,
  };

  // 캔버스 초기화
  useEffect(() => {
    if (!isVisible || !canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: videoElement?.offsetWidth || 800,
      height: videoElement?.offsetHeight || 450,
      backgroundColor: 'transparent',
    });

    fabricRef.current = canvas;

    // 비디오 프레임을 배경으로 캡처
    if (videoElement) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = videoElement.videoWidth;
      tempCanvas.height = videoElement.videoHeight;
      const ctx = tempCanvas.getContext('2d');
      ctx.drawImage(videoElement, 0, 0);

      const dataURL = tempCanvas.toDataURL();
      fabric.Image.fromURL(dataURL, (img) => {
        canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
          scaleX: canvas.width / img.width,
          scaleY: canvas.height / img.height,
        });
      });
    }

    // 히스토리 저장
    canvas.on('path:created', saveHistory);
    canvas.on('object:modified', saveHistory);

    return () => {
      canvas.dispose();
    };
  }, [isVisible, videoElement]);

  // 도구 선택
  const selectTool = (tool) => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    setCurrentTool(tool);
    canvas.isDrawingMode = false;
    canvas.selection = false;

    switch (tool) {
      case 'pencil':
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
        canvas.freeDrawingBrush.width = brushSize;
        canvas.freeDrawingBrush.color = brushColor;
        break;

      case 'highlighter':
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
        canvas.freeDrawingBrush.width = brushSize * 4;
        canvas.freeDrawingBrush.color = brushColor + '60'; // 투명도 추가
        break;

      case 'eraser':
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
        canvas.freeDrawingBrush.width = eraserSizes[eraserSize];
        canvas.freeDrawingBrush.color = '#FFFFFF';
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

  // 색상 변경
  const changeColor = (color) => {
    setBrushColor(color);
    const canvas = fabricRef.current;
    if (canvas && canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color =
        currentTool === 'highlighter' ? color + '60' : color;
    }
  };

  // 브러시 크기 변경
  const changeBrushSize = (size) => {
    setBrushSize(size);
    const canvas = fabricRef.current;
    if (canvas && canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.width =
        currentTool === 'highlighter' ? size * 4 : size;
    }
  };

  // 지우개 크기 변경
  const changeEraserSize = (size) => {
    setEraserSize(size);
    const canvas = fabricRef.current;
    if (canvas && canvas.freeDrawingBrush && currentTool === 'eraser') {
      canvas.freeDrawingBrush.width = eraserSizes[size];
    }
  };

  // 히스토리 저장
  const saveHistory = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const currentState = JSON.stringify(canvas.toJSON());
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(currentState);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  // 실행 취소
  const undo = () => {
    const canvas = fabricRef.current;
    if (!canvas || historyStep <= 0) return;

    const newStep = historyStep - 1;
    canvas.loadFromJSON(history[newStep], () => {
      canvas.renderAll();
      setHistoryStep(newStep);
    });
  };

  // 다시 실행
  const redo = () => {
    const canvas = fabricRef.current;
    if (!canvas || historyStep >= history.length - 1) return;

    const newStep = historyStep + 1;
    canvas.loadFromJSON(history[newStep], () => {
      canvas.renderAll();
      setHistoryStep(newStep);
    });
  };

  // 캔버스 초기화
  const clearCanvas = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    canvas.clear();
    // 비디오 배경 다시 설정
    if (videoElement) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = videoElement.videoWidth;
      tempCanvas.height = videoElement.videoHeight;
      const ctx = tempCanvas.getContext('2d');
      ctx.drawImage(videoElement, 0, 0);

      const dataURL = tempCanvas.toDataURL();
      fabric.Image.fromURL(dataURL, (img) => {
        canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
          scaleX: canvas.width / img.width,
          scaleY: canvas.height / img.height,
        });
      });
    }
    saveHistory();
  };

  // PNG로 저장
  const saveAsPNG = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2, // 고해상도
    });

    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.download = `video-analysis-${timestamp}.png`;
    link.href = dataURL;
    link.click();
  };

  if (!isVisible) return null;

  return (
    <div className="magicPencilOverlay">
      <div className="magicPencilContainer">
        <canvas ref={canvasRef} className="magicPencilCanvas" />

        {/* 도구 패널 */}
        <div className="magicPencilTools">
          {/* 닫기 버튼 */}
          <button className="mpCloseBtn" onClick={onClose}>
            ✕
          </button>

          {/* 도구 선택 */}
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

          {/* 색상 선택 */}
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

          {/* 크기 조절 */}
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

          {/* 지우개 크기 */}
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

          {/* 액션 버튼 */}
          <div className="mpActionGroup">
            <button onClick={undo} title="실행 취소">
              <FaUndo />
            </button>
            <button onClick={redo} title="다시 실행">
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
