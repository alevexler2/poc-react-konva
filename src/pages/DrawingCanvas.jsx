import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Circle, Arrow, Text, Transformer } from 'react-konva';

const DrawingCanvas = () => {
  // Estados para manejar la imagen, los elementos, el historial y la herramienta seleccionada
  const [image, setImage] = useState(null);  // Imagen de fondo
  const [elements, setElements] = useState([]); // Elementos dibujados en el canvas
  const [history, setHistory] = useState([]); // Historial para deshacer/rehacer
  const [redoStack, setRedoStack] = useState([]); // Pila para rehacer cambios
  const [drawing, setDrawing] = useState(false);  // Estado que indica si estamos dibujando
  const [currentElement, setCurrentElement] = useState(null); // Elemento actual que estamos dibujando
  const [selectedElementIndex, setSelectedElementIndex] = useState(null); // Índice del elemento seleccionado
  const [tool, setTool] = useState('rect');  // Herramienta seleccionada (rectángulo, círculo, etc.)
  const stageRef = useRef(null); // Referencia al escenario (Stage) para obtener la posición del puntero
  const transformerRef = useRef(null); // Referencia al transformer para aplicar transformaciones (escalar, rotar, etc.)

   // Carga la imagen de fondo cuando el componente se monta
  useEffect(() => {
    const img = new Image();
    img.src = 'https://via.placeholder.com/600x400'; // Imagen de ejemplo
    img.onload = () => setImage(img); // Cuando la imagen se carga, se guarda en el estado
  }, []);

    // Función para simular la carga de widgets desde una base de datos
  const loadSavedWidgets = () => {
    const savedWidgets = [
      { type: 'rect', x: 50, y: 50, width: 100, height: 80, stroke: 'red', strokeWidth: 2, fill: 'transparent', draggable: true },
      { type: 'circle', x: 200, y: 200, radius: 50, stroke: 'green', strokeWidth: 2, fill: 'transparent', draggable: true },
      { type: 'arrow', points: [300, 300, 400, 400], stroke: 'blue', strokeWidth: 2, draggable: true },
      { type: 'text', x: 400, y: 100, text: 'Sample Text', fontSize: 20, fill: 'black', draggable: true },
    ];
    setElements(savedWidgets); // Carga los widgets guardados en el estado
  };

  // Función para guardar el historial de elementos
  const saveHistory = (newElements) => {
    setHistory((prevHistory) => [...prevHistory, elements]); // Guarda el estado actual en el historial
    setRedoStack([]); // Limpia el stack de redo cuando se realiza un cambio
    setElements(newElements); // Actualiza los elementos actuales
  };

  // Función para deshacer el último cambio
  const handleUndo = () => {
    if (history.length > 0) {
      const previousState = history[history.length - 1];// Obtiene el último estado del historial
      setHistory((prevHistory) => prevHistory.slice(0, -1));// Elimina el último estado del historial
      setRedoStack((prevRedo) => [elements, ...prevRedo]); // Añade el estado actual al stack de redo
      setElements(previousState);  // Restaura el estado anterior
      setSelectedElementIndex(null); // Deselecciona cualquier elemento
    }
  };

  // Función para rehacer el último cambio deshecho
  const handleRedo = () => {
    if (redoStack.length > 0) {
      const nextState = redoStack[0];  // Obtiene el primer estado en el stack de redo
      setRedoStack((prevRedo) => prevRedo.slice(1)); // Elimina el primer estado del stack de redo
      setHistory((prevHistory) => [...prevHistory, elements]); // Guarda el estado actual en el historial
      setElements(nextState); // Restaura el estado siguiente
      setSelectedElementIndex(null); // Deselecciona cualquier elemento
    }
  };

  // Función que se ejecuta cuando se empieza a dibujar un nuevo elemento
  const handleMouseDown = (e) => {
    if (selectedElementIndex !== null) return; // Si hay un elemento seleccionado, no dibujar

    const { x, y } = e.target.getStage().getPointerPosition(); // Obtiene la posición del puntero
    let newElement;

    // Crea un nuevo elemento según la herramienta seleccionada
    if (tool === 'rect') {
      newElement = { type: 'rect', x, y, width: 0, height: 0, stroke: 'red', strokeWidth: 2, fill: 'transparent', draggable: true };
    } else if (tool === 'circle') {
      newElement = { type: 'circle', x, y, radius: 0, stroke: 'green', strokeWidth: 2, fill: 'transparent', draggable: true };
    } else if (tool === 'arrow') {
      newElement = { type: 'arrow', points: [x, y, x, y], stroke: 'blue', strokeWidth: 2, draggable: true };
    } else if (tool === 'text') {
      newElement = { type: 'text', x, y, text: 'New Text', fontSize: 20, fill: 'black', draggable: true };
    }

    setDrawing(true); // Indica que se está dibujando
    setCurrentElement(newElement); // Guarda el nuevo elemento
  };

  // Función que se ejecuta mientras se mueve el puntero para actualizar el tamaño o posición del elemento
  const handleMouseMove = (e) => {
    if (!drawing || !currentElement) return; // Si no se está dibujando, no hacer nada

    const { x, y } = e.target.getStage().getPointerPosition();// Obtiene la posición del puntero
    const updatedElement = { ...currentElement }; // Copia el elemento actual

    // Actualiza el tamaño o la posición según la herramienta seleccionada
    if (tool === 'rect') {
      updatedElement.width = x - currentElement.x;
      updatedElement.height = y - currentElement.y;
    } else if (tool === 'circle') {
      const radius = Math.sqrt(Math.pow(x - currentElement.x, 2) + Math.pow(y - currentElement.y, 2));
      updatedElement.radius = radius;
    } else if (tool === 'arrow') {
      updatedElement.points = [currentElement.points[0], currentElement.points[1], x, y];
    }

    setCurrentElement(updatedElement); // Actualiza el elemento actual
  };

  // Función que se ejecuta cuando se termina de dibujar el elemento
  const handleMouseUp = () => {
    if (drawing && currentElement) {
      saveHistory([...elements, currentElement]); // Guarda el nuevo elemento en el historial
      setDrawing(false); // Finaliza el proceso de dibujo
      setCurrentElement(null); // Resetea el elemento actual
    }
  };

  // Función para seleccionar un elemento al hacer clic en él
  const handleSelectElement = (index) => {
    setSelectedElementIndex(index); // Establece el índice del elemento seleccionado
    console.log("Elemento seleccionado:", elements[index]); // Muestra el elemento seleccionado en consola
  };
  // Función para eliminar el elemento seleccionado
  const handleDeleteElement = () => {
    if (selectedElementIndex !== null) {
      const updatedElements = elements.filter((_, index) => index !== selectedElementIndex); // Filtra el elemento seleccionado
      saveHistory(updatedElements); // Guarda los cambios en el historial
      setSelectedElementIndex(null); // Deselecciona el elemento
    }
  };

  // Función para mover un elemento arrastrado
  const handleDragMove = (index, e) => {
    const updatedElements = elements.slice(); // Crea una copia de los elementos
    updatedElements[index] = { ...updatedElements[index], x: e.target.x(), y: e.target.y() }; // Actualiza la posición del elemento
    saveHistory(updatedElements);// Guarda los cambios en el historial
  };

// Función para aplicar transformaciones (como escalar) a un elemento
const handleTransform = (index, node) => {
  const updatedElements = elements.slice(); // Crea una copia de los elementos
  const element = updatedElements[index];

  // Para un rectángulo
  if (element.type === 'rect') {
    element.width = node.width() * node.scaleX(); // Ajusta el tamaño del rectángulo
    element.height = node.height() * node.scaleY(); // Ajusta la altura del rectángulo
    node.scaleX(1); // Restaura la escala
    node.scaleY(1); // Restaura la escala
  } 
  // Para un círculo
  else if (element.type === 'circle') {
    element.radius = Math.max(node.width(), node.height()) / 2; // Ajusta el radio del círculo
    node.scaleX(1); // Restaura la escala
    node.scaleY(1); // Restaura la escala
  }
  // Para una flecha
  else if (element.type === 'arrow') {
    element.points = node.points();
  }

  saveHistory(updatedElements); // Guarda los cambios en el historial
};


useEffect(() => {
  if (selectedElementIndex !== null && transformerRef.current) {
    const node = stageRef.current.findOne(`#element-${selectedElementIndex}`);
    if (node) {
      transformerRef.current.nodes([node]);
      transformerRef.current.getLayer().batchDraw(); // Redibuja la capa para reflejar los cambios
    }
  } else {
    transformerRef.current.nodes([]); // Elimina la referencia del Transformer cuando no hay selección
  }
}, [selectedElementIndex, elements]);

  return (
    <div>
      <div>
        <button onClick={() => setTool('rect')}>Rectangle</button>
        <button onClick={() => setTool('circle')}>Circle</button>
        <button onClick={() => setTool('arrow')}>Arrow</button>
        <button onClick={() => setTool('text')}>Text</button>
        <button onClick={handleUndo} disabled={history.length === 0}>
          Undo
        </button>
        <button onClick={handleRedo} disabled={redoStack.length === 0}>
          Redo
        </button>
        <button onClick={loadSavedWidgets}>Load Saved Widgets</button>
        {selectedElementIndex !== null && (
          <button onClick={handleDeleteElement}>Delete Selected</button>
        )}
      </div>
      <Stage
        width={600}
        height={400}
        ref={stageRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <Layer>
          {image && <KonvaImage image={image} width={600} height={400} />}
          {elements.map((element, index) => {
            const isSelected = index === selectedElementIndex;

            if (element.type === 'rect') {
              return (
                <Rect
                  key={index}
                  id={`element-${index}`}
                  {...element}
                  onClick={() => handleSelectElement(index)}
                  onDragMove={(e) => handleDragMove(index, e)}
                  onTransformEnd={(e) => handleTransform(index, e.target)}
                  fill={isSelected ? 'yellow' : element.fill}
                />
              );
            } else if (element.type === 'circle') {
              return (
                <Circle
                  key={index}
                  id={`element-${index}`}
                  {...element}
                  onClick={() => handleSelectElement(index)}
                  onDragMove={(e) => handleDragMove(index, e)}
                  onTransformEnd={(e) => handleTransform(index, e.target)}
                  fill={isSelected ? 'yellow' : element.fill}
                />
              );
            } else if (element.type === 'arrow') {
              return (
                <Arrow
                  key={index}
                  id={`element-${index}`}
                  {...element}
                  onClick={() => handleSelectElement(index)}
                  onDragMove={(e) => handleDragMove(index, e)}
                  onTransformEnd={(e) => handleTransform(index, e.target)}
                  fill={isSelected ? 'yellow' : element.stroke}
                  stroke={isSelected ? 'yellow' : element.stroke}
                />
              );
            } else if (element.type === 'text') {
              return (
                <Text
                  key={index}
                  id={`element-${index}`}
                  {...element}
                  onClick={() => handleSelectElement(index)}
                  onDragMove={(e) => handleDragMove(index, e)}
                  onTransformEnd={(e) => handleTransform(index, e.target)}
                  fill={isSelected ? 'yellow' : element.fill}
                />
              );
            }
            return null;
          })}
          <Transformer ref={transformerRef} />
        </Layer>
      </Stage>
    </div>
  );
};

export default DrawingCanvas;
