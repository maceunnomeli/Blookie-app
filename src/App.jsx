import React, { useState, useEffect, useCallback } from 'react';
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
import BattleEdge from './components/BattleEdge';
import FriendshipEdge from './components/FriendshipEdge';

const nodeTypes = { characterNode: CharacterNode };
const edgeTypes = {
  battleEdge: BattleEdge,
  friendshipEdge: FriendshipEdge
};

// --- EXPANDED CHAPTER DATA ---
// Structured to hold both the badge keyword and the two-sentence narrative summary.
const CHAPTER_DETAILS = [
  {
    theme: "Falling Down",
    summary: "Alice follows a frantic White Rabbit down a hole and finds herself in a hall of locked doors. She shrinks after drinking a mysterious potion but leaves the key to the garden on a table out of reach."
  },
  {
    theme: "Giant Tears",
    summary: "After eating a magic cake, Alice grows to a massive size and weeps a pool of tears out of frustration. She shrinks again and is swept away in the salty water alongside a peculiar group of animals."
  },
  {
    theme: "Dry Race",
    summary: "The soaked animals hold a chaotic, rule-less Caucus Race to dry themselves off. Alice accidentally frightens the birds and mice away by talking fondly about her predatory cat, Dinah."
  },
  {
    theme: "Trapped!",
    summary: "The White Rabbit mistakes Alice for his housemaid and orders her to fetch his gloves and fan. She drinks another potion, grows too large for the room, and escapes only by eating pebbles that turn into cakes."
  },
  {
    theme: "Mushroom Magic",
    summary: "Alice encounters a haughty Caterpillar smoking a hookah on top of a large mushroom. He teaches her that eating from alternating sides of the mushroom will allow her to control her size at will."
  },
  {
    theme: "Mad House",
    summary: "Alice visits the chaotic house of the Duchess, where dishes are thrown and a crying baby transforms into a pig. Outside, the grinning Cheshire Cat directs her toward the March Hare's residence."
  },
  {
    theme: "Tea Time",
    summary: "Alice joins the Mad Hatter, March Hare, and Dormouse in a perpetual, nonsensical tea party. Frustrated by their unanswerable riddles and rudeness, she leaves and finally manages to enter the beautiful garden."
  },
  {
    theme: "Croquet Chaos",
    summary: "Alice meets the tyrannical Queen of Hearts and is forced into a bizarre croquet game using flamingos as mallets and hedgehogs as balls. The Queen constantly disrupts the game by ordering executions for the slightest offenses."
  },
  {
    theme: "Sad Tales",
    summary: "The Duchess attempts to find a moral in every single action while Alice meets the Gryphon. The Gryphon introduces her to the Mock Turtle, who continually sobs while recounting his school days in the sea."
  },
  {
    theme: "Weird Dance",
    summary: "The Mock Turtle and Gryphon demonstrate the Lobster Quadrille, a highly unusual and energetic dance. Their performance is abruptly interrupted by a shout announcing that a royal trial is beginning."
  },
  {
    theme: "The Trial",
    summary: "The Knave of Hearts is placed on trial for stealing the Queen's tarts. Alice watches the highly absurd legal proceedings and realizes she is rapidly beginning to grow back to her normal size."
  },
  {
    theme: "Waking Up",
    summary: "Alice is called as a witness and boldly refuses to be intimidated by the King and Queen's illogical rules. As the entire deck of card soldiers attacks her, she wakes up on the riverbank, realizing it was all a vivid dream."
  }
];

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [viewMode, setViewMode] = useState('summary');
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [sliderValue, setSliderValue] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [chapters, setChapters] = useState([]);
  const [focusedNodeId, setFocusedNodeId] = useState(null);
  const [activeAudioId, setActiveAudioId] = useState(null);

  // --- NEW STATE: Controls the summary text overlay ---
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  useEffect(() => {
    try {
      const processed = processGraphData(chapterData);
      if (processed && processed.chapters) {
        setChapters(processed.chapters);
      }
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    let interval;
    if (isPlaying && viewMode === 'story') {
      interval = setInterval(() => {
        setSliderValue(prev => {
          const next = prev + 0.015;
          if (next >= chapters.length - 1) {
            setIsPlaying(false);
            return chapters.length - 1;
          }
          return next;
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isPlaying, viewMode, chapters.length]);

  useEffect(() => {
    const newIndex = Math.round(sliderValue);
    if (newIndex !== currentChapterIndex && chapters.length > 0) {
      setCurrentChapterIndex(newIndex);
      // Auto-collapse the summary text when transitioning to a new chapter
      setIsSummaryOpen(false);
    }
  }, [sliderValue, chapters.length, currentChapterIndex]);

  useEffect(() => {
    if (chapters.length === 0 && viewMode === 'story') return;

    let targetNodes = [];
    let targetEdges = [];

    if (viewMode === 'summary') {
      const { nodes: summaryNodes, edges: summaryEdges } = processGraphData(rawData, [], true);

      targetNodes = summaryNodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          mood: 'neutral',
          isThinking: false,
          activeAudioId: activeAudioId,
          setActiveAudioId: setActiveAudioId,
          isSummaryMode: true
        },
        style: { ...node.style, opacity: 1, filter: 'none' }
      }));
      targetEdges = styleEdges(summaryEdges, targetNodes, 'summary');
    } else {
      const currentChapter = chapters[currentChapterIndex];
      if (!currentChapter) return;

      const activeInteractionIDs = new Set();
      currentChapter.edges.forEach(e => {
        activeInteractionIDs.add(e.source);
        activeInteractionIDs.add(e.target);
      });

      const { masterNodes } = processGraphData(chapterData, currentChapter.edges, false);

      targetNodes = masterNodes.map(idealNode => {
        let isActive = activeInteractionIDs.has(idealNode.id);

        if (idealNode.id.toLowerCase().includes('alice')) {
          if (currentChapter.activeCharacters && currentChapter.activeCharacters.includes(idealNode.id)) {
            isActive = true;
          }
        }

        const finalThinking = isActive ? idealNode.data.isThinking : false;

        let opacity = isActive ? 1 : 0.1;
        let filter = isActive ? 'none' : 'grayscale(100%) blur(4px)';

        if (focusedNodeId) {
          if (idealNode.id === focusedNodeId) {
            opacity = 1; filter = 'none'; idealNode.style = { ...idealNode.style, zIndex: 100 };
          } else {
            opacity = 0.05; filter = 'grayscale(100%) blur(6px)';
          }
        }

        return {
          ...idealNode,
          data: {
            ...idealNode.data,
            isThinking: finalThinking,
            activeAudioId: activeAudioId,
            setActiveAudioId: setActiveAudioId,
            isSummaryMode: false
          },
          style: {
            ...idealNode.style,
            opacity,
            filter,
            transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease, filter 0.3s ease',
            zIndex: (isActive || idealNode.id === focusedNodeId) ? 10 : 0
          }
        };
      });

      const rawEdges = currentChapter.edges.map(e => ({
        ...e,
        id: `e-${e.source}-${e.target}-${currentChapterIndex}`,
        data: { sentiment: e.sentiment, strength: e.strength }
      }));

      targetEdges = styleEdges(rawEdges, targetNodes, 'story');
    }

    if (focusedNodeId) {
      targetEdges = targetEdges.filter(e => e.source === focusedNodeId || e.target === focusedNodeId);
    }

    setNodes(targetNodes);
    setEdges(targetEdges);

  }, [viewMode, currentChapterIndex, chapters, focusedNodeId, activeAudioId, setNodes, setEdges]);

  const handleSliderChange = (e) => {
    setIsPlaying(false);
    setViewMode('story');
    setSliderValue(parseFloat(e.target.value));
  };

  const togglePlay = () => {
    if (viewMode === 'summary') {
      setViewMode('story');
      setSliderValue(0);
      setIsPlaying(true);
      setActiveAudioId(null);
    } else {
      if (sliderValue >= chapters.length - 1) {
        setSliderValue(0);
      }
      setIsPlaying(!isPlaying);
      setIsSummaryOpen(false); // Close text if user hits play
    }
  };

  const handleSummaryToggle = () => {
    setIsPlaying(false);
    if (viewMode === 'story') {
      setViewMode('summary');
    } else {
      setViewMode('story');
      setSliderValue(currentChapterIndex);
      setActiveAudioId(null);
    }
  };

  const onNodeDoubleClick = useCallback((e, node) => {
    e.stopPropagation();
    setIsPlaying(false);
    setFocusedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setFocusedNodeId(null);
  }, []);

  const maxVal = Math.max(0, chapters.length - 1);
  const progressPercent = maxVal > 0 ? (sliderValue / maxVal) * 100 : 0;

  // Retrieve the current chapter's structured data safely
  const currentChapterData = CHAPTER_DETAILS[currentChapterIndex] || { theme: "Continuing...", summary: "The story continues..." };

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', background: 'radial-gradient(circle at center, #1e1b4b 0%, #0f172a 50%, #000000 100%)' }}>

      <div className="absolute top-0 left-0 w-full pt-6 pb-12 z-40 pointer-events-none flex flex-col items-center">
        <h1 style={{ fontFamily: 'serif', fontSize: '3.5rem', fontWeight: '900', color: 'white', letterSpacing: '0.15em', textShadow: '0 0 20px rgba(255,255,255,0.5)', textAlign: 'center', whiteSpace: 'nowrap', marginBottom: '0' }}>
          ALICE IN WONDERLAND
        </h1>
        <p style={{ color: '#fbbf24', fontSize: '1.2rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '5px' }}>
          {viewMode === 'summary' ? "Full Visual Map" : (chapters[currentChapterIndex]?.title || "Loading...")}
        </p>

        {/* INTERACTIVE BADGE & SUMMARY CONTAINER */}
        {viewMode === 'story' && (
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

            {/* Clickable Theme Badge */}
            <button
              onClick={() => setIsSummaryOpen(!isSummaryOpen)}
              style={{
                background: isSummaryOpen ? 'rgba(251, 191, 36, 0.25)' : 'rgba(251, 191, 36, 0.1)',
                border: '1px solid rgba(251, 191, 36, 0.5)',
                color: '#fbbf24',
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                boxShadow: isSummaryOpen ? '0 0 25px rgba(251,191,36,0.4)' : '0 0 15px rgba(251,191,36,0.2)',
                backdropFilter: 'blur(4px)',
                cursor: 'pointer',
                pointerEvents: 'auto',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {currentChapterData.theme}
              <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                {isSummaryOpen ? '▲' : '▼'}
              </span>
            </button>

            {/* Expandable Summary Overlay */}
            <div style={{
              marginTop: '15px',
              maxWidth: '600px',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid #334155',
              borderRadius: '12px',
              padding: '16px 24px',
              color: '#cbd5e1',
              fontSize: '1rem',
              lineHeight: '1.6',
              textAlign: 'center',
              boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
              backdropFilter: 'blur(8px)',
              pointerEvents: 'auto',
              // Smooth height transition
              maxHeight: isSummaryOpen ? '200px' : '0px',
              opacity: isSummaryOpen ? 1 : 0,
              overflow: 'hidden',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            }}>
              {currentChapterData.summary}
            </div>
          </div>
        )}
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
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        style={{
          zIndex: 10,
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)'
        }}
      >
        <Controls position="top-right" style={{ margin: '20px', borderRadius: '10px', overflow: 'hidden' }} />

        <Panel position="bottom-center" style={{ width: '100%', display: 'flex', justifyContent: 'center', paddingBottom: '30px', pointerEvents: 'none' }}>
          <div style={{ pointerEvents: 'auto', width: '90%', maxWidth: '800px', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid #334155', borderRadius: '20px', padding: '20px 30px', display: 'flex', alignItems: 'center', gap: '30px', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}>

            <button
              onClick={togglePlay}
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: '#fbbf24',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(251,191,36,0.6)',
                transition: 'transform 0.1s'
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {isPlaying ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="black"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="black" style={{ marginLeft: '4px' }}><path d="M5 3l14 9-14 9V3z" /></svg>
              )}
            </button>

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
                <div style={{ position: 'absolute', left: `${progressPercent}%`, transform: 'translateX(-50%)', width: '24px', height: '24px', background: 'white', border: '4px solid #fbbf24', borderRadius: '50%', boxShadow: '0 0 10px rgba(0,0,0,0.5)', pointerEvents: 'none', zIndex: 10 }} />
                <input type="range" min="0" max={Math.max(0, chapters.length - 1)} step="0.01" value={sliderValue} onChange={handleSliderChange} style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 20 }} />
              </div>
            </div>

            <button onClick={handleSummaryToggle} style={{ padding: '12px 30px', borderRadius: '12px', fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase', cursor: 'pointer', border: viewMode === 'summary' ? 'none' : '1px solid #475569', background: viewMode === 'summary' ? '#fbbf24' : '#1e293b', color: viewMode === 'summary' ? '#000' : '#cbd5e1', boxShadow: viewMode === 'summary' ? '0 0 20px rgba(251,191,36,0.5)' : 'none' }}>
              {viewMode === 'summary' ? "Resume" : "Summary"}
            </button>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export default App;