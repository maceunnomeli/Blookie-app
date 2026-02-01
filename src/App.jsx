import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactFlow, {
  Controls,
  useNodesState,
  useEdgesState,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';

import rawData from './assets/alice_data.json';
import chapterData from './assets/alice_chapters.json';

import { processGraphData, styleEdges } from './utils/layoutEngine';
import CharacterNode from './components/CharacterNode';

const nodeTypes = { characterNode: CharacterNode };

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [viewMode, setViewMode] = useState('story');
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [sliderValue, setSliderValue] = useState(0);
  const [chapters, setChapters] = useState([]);
  const [focusedNodeId, setFocusedNodeId] = useState(null);

  useEffect(() => {
    try {
      const processed = processGraphData(chapterData);
      if (processed && processed.chapters) {
        setChapters(processed.chapters);
        setNodes(processed.masterNodes);
      }
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    if (chapters.length === 0 && viewMode === 'story') return;

    if (viewMode === 'summary') {
      const { nodes: summaryNodes, edges: summaryEdges } = processGraphData(rawData);
      setNodes(summaryNodes.map(node => ({
        ...node,
        style: { ...node.style, opacity: 1, filter: 'none', transition: 'transform 1s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.5s ease' }
      })));
      setEdges(summaryEdges);
    } else {
      const currentChapter = chapters[currentChapterIndex];
      if (!currentChapter) return;

      const activeIDs = new Set(currentChapter.activeCharacters);
      const { masterNodes } = processGraphData(chapterData);

      setNodes(masterNodes.map(idealNode => {
        const isActive = activeIDs.has(idealNode.id);
        let opacity = isActive ? 1 : 0.1;
        if (focusedNodeId && idealNode.id !== focusedNodeId) opacity = 0.05;

        return {
          ...idealNode,
          style: {
            ...idealNode.style,
            opacity,
            filter: isActive ? 'none' : 'grayscale(100%) blur(4px)',
            transition: 'transform 1s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.5s ease, filter 0.5s ease',
            zIndex: isActive ? 10 : 0
          }
        };
      }));

      const chapterEdges = currentChapter.edges.map(e => ({
        ...e,
        id: `e-${e.source}-${e.target}-${currentChapterIndex}`,
        data: { sentiment: e.sentiment, strength: e.strength }
      }));

      setNodes(currentNodes => {
        let styledEdges = styleEdges(chapterEdges, currentNodes);
        if (focusedNodeId) styledEdges = styledEdges.filter(e => e.source === focusedNodeId || e.target === focusedNodeId);
        setEdges(styledEdges);
        return currentNodes;
      });
    }
  }, [viewMode, currentChapterIndex, chapters, focusedNodeId, setNodes, setEdges]);

  const handleSliderChange = (e) => {
    const val = parseFloat(e.target.value);
    setSliderValue(val);
    const newIndex = Math.round(val);
    if (newIndex !== currentChapterIndex) {
      setViewMode('story');
      setCurrentChapterIndex(newIndex);
    }
  };

  const handleSummaryToggle = () => {
    if (viewMode === 'story') {
      setViewMode('summary');
    } else {
      setViewMode('story');
      setSliderValue(currentChapterIndex);
    }
  };

  const onNodeDragStart = useCallback((event, node) => {
    setNodes((nds) => nds.map((n) => n.id === node.id ? { ...n, style: { ...n.style, transition: 'none' } } : n));
  }, [setNodes]);

  const onNodeDragStop = useCallback((event, node) => {
    if (viewMode === 'summary') return;
    setNodes((currentNodes) => {
      const updatedNodes = currentNodes.map(n => n.id === node.id ? { ...n, position: node.position } : n);
      const currentChapter = chapters[currentChapterIndex];
      if (!currentChapter) return currentNodes;
      const rawEdges = currentChapter.edges.map(e => ({
        ...e,
        id: `e-${e.source}-${e.target}-${currentChapterIndex}`,
        data: { sentiment: e.sentiment, strength: e.strength }
      }));
      setEdges(styleEdges(rawEdges, updatedNodes));
      return updatedNodes;
    });
  }, [chapters, currentChapterIndex, viewMode, setEdges, setNodes]);

  const onNodeDoubleClick = useCallback((e, node) => { e.stopPropagation(); setFocusedNodeId(node.id); }, []);
  const onPaneClick = useCallback(() => setFocusedNodeId(null), []);

  const maxVal = Math.max(0, chapters.length - 1);
  const progressPercent = maxVal > 0 ? (sliderValue / maxVal) * 100 : 0;

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
        background: 'radial-gradient(circle at center, #1e1b4b 0%, #0f172a 50%, #000000 100%)'
      }}
    >

      {/* HEADER */}
      <div className="absolute top-0 left-0 w-full pt-6 pb-12 z-40 pointer-events-none flex flex-col items-center">
        {/* TITLE FIX: nowrap prevents line breaking */}
        <h1 style={{
          fontFamily: 'serif',
          fontSize: '3.5rem',
          fontWeight: '900',
          color: 'white',
          letterSpacing: '0.1em',
          textShadow: '0 0 20px rgba(255,255,255,0.5)',
          textAlign: 'center',
          whiteSpace: 'nowrap' // <--- THIS FORCES ONE LINE
        }}>
          ALICE IN WONDERLAND
        </h1>
        <p style={{ color: '#fbbf24', fontSize: '1.2rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '5px' }}>
          {viewMode === 'summary' ? "Full Visual Map" : (chapters[currentChapterIndex]?.title || "Loading...")}
        </p>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDoubleClick={onNodeDoubleClick}
        onPaneClick={onPaneClick}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        zoomOnDoubleClick={false}
        nodeTypes={nodeTypes}
        fitView
        // OVERLAP FIX: Increase padding to 0.5 (50%) to push nodes far away from UI
        fitViewOptions={{ padding: 0.5 }}
        proOptions={{ hideAttribution: true }}
        style={{
          zIndex: 10,
          // Mask fades out content at top/bottom edges
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)'
        }}
      >
        <Controls position="top-right" style={{ margin: '20px', borderRadius: '10px', overflow: 'hidden' }} />

        <Panel position="bottom-center" style={{ width: '100%', display: 'flex', justifyContent: 'center', paddingBottom: '30px', pointerEvents: 'none' }}>
          <div style={{
            pointerEvents: 'auto',
            width: '90%',
            maxWidth: '800px',
            background: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid #334155',
            borderRadius: '20px',
            padding: '20px 30px',
            display: 'flex',
            alignItems: 'center',
            gap: '30px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
          }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>
                <span>Start</span>
                <span style={{ color: '#fbbf24' }}>Chapter {currentChapterIndex + 1}</span>
                <span>End</span>
              </div>
              <div style={{ position: 'relative', width: '100%', height: '20px', display: 'flex', alignItems: 'center' }}>
                <div style={{ position: 'absolute', width: '100%', height: '8px', background: '#334155', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progressPercent}%`, background: '#fbbf24' }} />
                </div>
                <div style={{
                  position: 'absolute',
                  left: `${progressPercent}%`,
                  transform: 'translateX(-50%)',
                  width: '24px',
                  height: '24px',
                  background: 'white',
                  border: '4px solid #fbbf24',
                  borderRadius: '50%',
                  boxShadow: '0 0 10px rgba(0,0,0,0.5)',
                  pointerEvents: 'none',
                  zIndex: 10
                }} />
                <input
                  type="range"
                  min="0"
                  max={maxVal}
                  step="0.01"
                  value={sliderValue}
                  onChange={handleSliderChange}
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer',
                    zIndex: 20
                  }}
                />
              </div>
            </div>
            <button
              onClick={handleSummaryToggle}
              style={{
                padding: '12px 30px',
                borderRadius: '12px',
                fontWeight: 'bold',
                fontSize: '14px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                border: viewMode === 'summary' ? 'none' : '1px solid #475569',
                background: viewMode === 'summary' ? '#fbbf24' : '#1e293b',
                color: viewMode === 'summary' ? '#000' : '#cbd5e1',
                boxShadow: viewMode === 'summary' ? '0 0 20px rgba(251,191,36,0.5)' : 'none'
              }}
            >
              {viewMode === 'summary' ? "Resume" : "Summary"}
            </button>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export default App;