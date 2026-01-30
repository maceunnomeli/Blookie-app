import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';

// Import BOTH datasets
import rawData from './assets/alice_data.json';       // The "Summary" Data
import chapterData from './assets/alice_chapters.json'; // The "Story" Data

import { processGraphData, styleEdges } from './utils/layoutEngine';
import CharacterNode from './components/CharacterNode';

const nodeTypes = { characterNode: CharacterNode };

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // STATE: Story vs Summary
  const [viewMode, setViewMode] = useState('story'); // 'story' or 'summary'
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [chapters, setChapters] = useState([]);
  const [focusedNodeId, setFocusedNodeId] = useState(null);

  // 1. Initial Load (Load Chapter Data into State)
  useEffect(() => {
    const { chapters } = processGraphData(chapterData);
    setChapters(chapters);
  }, []);

  // 2. THE BRAIN: Decides what to show based on Mode
  useEffect(() => {
    if (chapters.length === 0) return;

    if (viewMode === 'summary') {
      // --- SUMMARY MODE LOGIC ---
      // Load the "Raw Data" (Global Graph)
      const { nodes: summaryNodes, edges: summaryEdges } = processGraphData(rawData);

      setNodes(summaryNodes.map(node => ({
        ...node,
        style: { ...node.style, opacity: 1, filter: 'none' } // Everyone is visible
      })));
      setEdges(summaryEdges);

    } else {
      // --- STORY MODE LOGIC (The Slider) ---
      const currentChapter = chapters[currentChapterIndex];
      const activeIDs = new Set(currentChapter.activeCharacters);
      const { masterNodes } = processGraphData(chapterData); // Get stable positions

      // Update Nodes (Ghost Mode)
      setNodes(masterNodes.map(node => {
        const isActive = activeIDs.has(node.id);
        let opacity = isActive ? 1 : 0.1;
        if (focusedNodeId && node.id !== focusedNodeId) opacity = 0.05; // Extra dim for focus

        return {
          ...node,
          style: {
            ...node.style,
            opacity,
            filter: isActive ? 'none' : 'grayscale(100%)',
            transition: 'all 0.5s ease',
          }
        };
      }));

      // Update Edges (Chapter Specific)
      const chapterEdges = currentChapter.edges.map(e => ({
        ...e,
        id: `e-${e.source}-${e.target}-${currentChapterIndex}`,
        data: { sentiment: e.sentiment, strength: e.strength }
      }));

      // Apply Styles & Focus Filter
      setNodes(currentNodes => {
        let styledEdges = styleEdges(chapterEdges, currentNodes);
        if (focusedNodeId) {
          styledEdges = styledEdges.filter(e => e.source === focusedNodeId || e.target === focusedNodeId);
        }
        setEdges(styledEdges);
        return currentNodes;
      });
    }
  }, [viewMode, currentChapterIndex, chapters, focusedNodeId, setNodes, setEdges]);

  // Handlers
  const onNodeDoubleClick = useCallback((e, node) => {
    e.stopPropagation();
    setFocusedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => setFocusedNodeId(null), []);

  // Helper to calculate Bubble Position
  const progressPercent = chapters.length > 1
    ? (currentChapterIndex / (chapters.length - 1)) * 100
    : 0;

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#0f172a' }}>

      {/* Header */}
      <div className="absolute top-8 left-0 w-full text-center z-50 pointer-events-none" style={{ color: '#fff', textShadow: '0 4px 12px black' }}>
        <h1 className="text-6xl mb-2 font-bold" style={{ fontFamily: '"Cinzel", serif' }}>
          Alice in Wonderland
        </h1>
        <p className="text-2xl font-light text-yellow-400 mt-2" style={{ fontFamily: '"Playfair Display", serif' }}>
          {viewMode === 'summary' ? "Full Story Summary" : (chapters[currentChapterIndex]?.title || "Loading...")}
        </p>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDoubleClick={onNodeDoubleClick}
        onPaneClick={onPaneClick}
        zoomOnDoubleClick={false}
        nodeTypes={nodeTypes}
        fitView
        className="bg-slate-900"
      >
        <Background color="#1e293b" />
        <Controls />

        {/* --- CONTROL PANEL --- */}
        <Panel position="bottom-center" className="w-full flex justify-center pb-12 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-6 p-6 rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl">

            {/* 1. THE SLIDER CONTAINER */}
            <div className={`relative w-[600px] h-12 flex items-center transition-opacity duration-300 ${viewMode === 'summary' ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>

              {/* Track Line */}
              <div className="absolute w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* The "Bubble Knob" */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-12 h-12 bg-yellow-400 rounded-full shadow-[0_0_20px_rgba(250,204,21,0.6)] border-4 border-slate-900 z-20 flex items-center justify-center transition-all duration-100 ease-out"
                style={{ left: `calc(${progressPercent}% - 24px)` }} // Center the 48px bubble
              >
                <span className="text-slate-900 font-bold text-lg font-mono">
                  {currentChapterIndex + 1}
                </span>
              </div>

              {/* Invisible Input for Interaction */}
              <input
                type="range"
                min="0"
                max={Math.max(0, chapters.length - 1)}
                value={currentChapterIndex}
                onChange={(e) => {
                  setViewMode('story'); // Switch back to story if dragged
                  setCurrentChapterIndex(parseInt(e.target.value));
                }}
                className="absolute w-full h-12 opacity-0 cursor-pointer z-30"
              />
            </div>

            {/* 2. THE SUMMARY BUTTON */}
            <button
              onClick={() => setViewMode(viewMode === 'story' ? 'summary' : 'story')}
              className={`
                px-6 py-3 rounded-xl font-bold text-lg transition-all transform active:scale-95
                ${viewMode === 'summary'
                  ? 'bg-yellow-400 text-slate-900 shadow-[0_0_20px_rgba(250,204,21,0.5)] scale-105'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-600'}
              `}
              style={{ fontFamily: '"Cinzel", serif' }}
            >
              {viewMode === 'summary' ? "Back to Story" : "Summary"}
            </button>

          </div>
        </Panel>

      </ReactFlow>
    </div>
  );
}

export default App;