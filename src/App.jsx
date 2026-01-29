import React, { useState, useMemo, useCallback, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge
} from 'reactflow';
import 'reactflow/dist/style.css';

import rawData from './assets/alice_data.json';
import { processGraphData } from './utils/layoutEngine';
import CharacterNode from './components/CharacterNode';

const nodeTypes = { characterNode: CharacterNode };

function App() {
  // 1. Initialize State (Replacing useMemo)
  // We use useNodesState to handle dragging updates automatically
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // 2. Load Data on Mount
  useEffect(() => {
    const { nodes: initialNodes, edges: initialEdges } = processGraphData(rawData);
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, []);

  const [focusedNodeId, setFocusedNodeId] = useState(null);

  // 3. Dynamic Node Styling (Focus Mode Dimming)
  // We map over the stateful 'nodes' to apply styles without breaking dragging
  const visibleNodes = useMemo(() => {
    return nodes.map(node => ({
      ...node,
      style: {
        ...node.style, // Keep existing drag position styles
        opacity: focusedNodeId ? (node.id === focusedNodeId ? 1 : 0.2) : 1,
        transition: 'opacity 0.3s ease',
      },
    }));
  }, [nodes, focusedNodeId]);

  // 4. Edge Filtering (Focus Mode)
  const visibleEdges = useMemo(() => {
    if (!focusedNodeId) return edges;
    return edges.filter(
      (edge) => edge.source === focusedNodeId || edge.target === focusedNodeId
    );
  }, [edges, focusedNodeId]);

  // 5. Handlers
  const onNodeDoubleClick = useCallback((event, node) => {
    event.stopPropagation();
    setFocusedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setFocusedNodeId(null);
  }, []);
  // ... inside App function ...

  const onResetLayout = useCallback(() => {
    // 1. Re-calculate the original positions from the JSON
    const { nodes: resetNodes, edges: resetEdges } = processGraphData(rawData);

    // 2. Force the state to update
    setNodes(resetNodes);
    setEdges(resetEdges);
  }, [setNodes, setEdges]);

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#0f172a' }}>

      {/* Title Header */}
      <div
        className="absolute top-8 left-0 w-full text-center z-50 pointer-events-none"
        style={{ color: '#ffffff', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}
      >
        <h1 className="text-6xl mb-2 tracking-wide" style={{ fontFamily: '"Cinzel", serif', fontWeight: 700 }}>
          Alice in Wonderland
        </h1>
        <p className="text-2xl font-light tracking-[0.2em] uppercase opacity-80" style={{ fontFamily: '"Playfair Display", serif' }}>
          Lewis Carroll
        </p>
      </div>
      {/* --- Reset Button --- */}
      <button
        onClick={onResetLayout}
        className="absolute bottom-8 right-8 z-50 bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-3 rounded-full font-bold shadow-2xl hover:bg-white/20 transition-all hover:scale-105 active:scale-95"
        style={{
          fontFamily: '"Cinzel", serif',
          textShadow: '0 2px 4px rgba(0,0,0,0.5)'
        }}
      >
        Reset Positions
      </button>

      <ReactFlow
        nodes={visibleNodes}
        edges={visibleEdges}
        onNodesChange={onNodesChange} // <--- CRITICAL: Enables Dragging
        onEdgesChange={onEdgesChange}
        onNodeDoubleClick={onNodeDoubleClick}
        onPaneClick={onPaneClick}
        zoomOnDoubleClick={false}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.4 }}
        minZoom={0.5}
        className="bg-slate-900"
      >
        <Background color="#1e293b" gap={20} size={1} />
        <Controls />
      </ReactFlow>
    </div>
  );
}

export default App;