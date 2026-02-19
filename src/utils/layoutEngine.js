import { MarkerType } from 'reactflow';

const COLUMN_WIDTH = 800;
const ROW_HEIGHT = 200;

const calculateLayout = (nodes) => {
    if (!nodes || nodes.length === 0) return [];
    const sortedNodes = [...nodes].sort((a, b) => (b.data?.importance || 0.5) - (a.data?.importance || 0.5));
    sortedNodes[0].position = { x: 0, y: 0 };
    for (let i = 1; i < sortedNodes.length; i++) {
        const col = Math.ceil(i / 2);
        const isTop = i % 2 !== 0;
        const x = col * COLUMN_WIDTH;
        const randomY = (Math.random() * 80) - 40;
        const y = (isTop ? -ROW_HEIGHT : ROW_HEIGHT) + randomY;
        sortedNodes[i].position = { x, y };
    }
    return sortedNodes;
};

// --- LOGIC UPDATE: FRIENDSHIP MODE ---
export const styleEdges = (edges, nodes, viewMode = 'story') => {
    if (!edges) return [];
    const nodeMap = new Map(nodes.map(node => [node.id, node]));

    return edges.map(edge => {
        const sourceNode = nodeMap.get(edge.source);
        const targetNode = nodeMap.get(edge.target);
        if (!sourceNode || !targetNode) return { ...edge, hidden: true };

        const sentiment = edge.data?.sentiment || 'neutral';
        const strength = edge.data?.strength || 0.5;

        // Smart Anchors
        const sx = sourceNode.position.x; const sy = sourceNode.position.y;
        const tx = targetNode.position.x; const ty = targetNode.position.y;
        const dx = tx - sx; const dy = ty - sy;

        let sourceHandle = 'right'; let targetHandle = 'left';
        if (Math.abs(dy) > Math.abs(dx)) {
            if (dy > 0) { sourceHandle = 'bottom'; targetHandle = 'top'; }
            else { sourceHandle = 'top'; targetHandle = 'bottom'; }
        } else {
            if (dx > 0) { sourceHandle = 'right'; targetHandle = 'left'; }
            else { sourceHandle = 'left'; targetHandle = 'right'; }
        }

        const isNegative = sentiment === 'negative';

        // 1. NEGATIVE (Battle)
        if (isNegative) {
            if (viewMode === 'story') {
                return {
                    ...edge, sourceHandle, targetHandle,
                    type: 'battleEdge', animated: false,
                    style: { stroke: '#ef4444', strokeWidth: 0 }
                };
            } else {
                return {
                    ...edge, sourceHandle, targetHandle,
                    type: 'default', animated: false,
                    style: { stroke: '#ef4444', strokeWidth: 3 + (strength * 15), opacity: 0.9 }
                };
            }
        }

        // 2. POSITIVE (Friendship / Hug)
        if (viewMode === 'story') {
            return {
                ...edge, sourceHandle, targetHandle,
                // SWAPPED: Love -> Friendship
                type: 'friendshipEdge',
                animated: false,
                style: { stroke: '#10b981', strokeWidth: 0 }
            };
        }

        // 3. POSITIVE SUMMARY
        return {
            ...edge, sourceHandle, targetHandle,
            type: 'default',
            style: {
                stroke: '#10b981', strokeWidth: 3 + (strength * 15), opacity: 0.9,
                strokeDasharray: '8,4'
            },
            animated: false,
        };
    });
};

export const processGraphData = (json, currentChapterEdges = [], isSummary = false) => {
    if (!json) return { nodes: [], edges: [], chapters: [] };

    let rawNodes = [];
    if (json.characters) {
        rawNodes = json.characters.map(char => ({
            id: char.id,
            data: { label: char.name, importance: char.importance || 0.5, imageUrl: char.imageUrl }
        }));
    } else if (json.nodes) {
        rawNodes = json.nodes.map(n => ({ ...n, data: n.data || { label: n.id, importance: 0.5 } }));
    }

    const nodeMoods = {};
    const connectionCounts = {};

    currentChapterEdges.forEach(edge => {
        if (!nodeMoods[edge.source]) nodeMoods[edge.source] = 0;
        if (!nodeMoods[edge.target]) nodeMoods[edge.target] = 0;
        if (!connectionCounts[edge.source]) connectionCounts[edge.source] = 0;
        if (!connectionCounts[edge.target]) connectionCounts[edge.target] = 0;

        connectionCounts[edge.source]++;
        connectionCounts[edge.target]++;

        const score = edge.sentiment === 'positive' ? 1 : (edge.sentiment === 'negative' ? -1 : 0);
        nodeMoods[edge.source] += score;
        nodeMoods[edge.target] += score;
    });

    const formattedNodes = calculateLayout(rawNodes).map(node => {
        const connections = connectionCounts[node.id] || 0;
        const moodScore = nodeMoods[node.id] || 0;
        const isThinking = !isSummary && connections === 0;

        let mood = 'neutral';
        const characterId = node.id.toLowerCase();
        if (moodScore > 0) {
            mood = 'happy';
        } else if (moodScore < 0) {
            if (characterId.includes('queen') || characterId.includes('heart')) {
                mood = 'angry';
            } else {
                mood = 'sad';
            }
        }

        return {
            ...node,
            position: node.position || { x: 0, y: 0 },
            data: { ...node.data, mood, isThinking },
            type: 'characterNode',
        };
    });

    let formattedEdges = [];
    if (json.edges) {
        const rawEdges = json.edges.map(e => ({
            ...e,
            id: e.id || `e-${e.source}-${e.target}`,
            data: e.data || { sentiment: 'neutral', strength: 0.5 }
        }));
        formattedEdges = styleEdges(rawEdges, formattedNodes, 'story');
    }

    return {
        nodes: formattedNodes,
        edges: formattedEdges,
        masterNodes: formattedNodes,
        chapters: json.chapters || []
    };
};