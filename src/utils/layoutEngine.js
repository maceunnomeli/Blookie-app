import { MarkerType } from 'reactflow';

// We tighten the horizontal gap slightly because the vertical spread is now much wider
const COLUMN_WIDTH = 600;

const calculateLayout = (nodes) => {
    if (!nodes || nodes.length === 0) return [];

    const sortedNodes = [...nodes].sort((a, b) => (b.data?.importance || 0.5) - (a.data?.importance || 0.5));

    // Anchor Alice in the exact center
    sortedNodes[0].position = { x: 0, y: 0 };

    for (let i = 1; i < sortedNodes.length; i++) {
        const x = i * COLUMN_WIDTH;

        // 1. Alternate Top and Bottom
        const isTop = i % 2 !== 0;

        // 2. Base minimum distance from the center line
        const baseY = isTop ? -180 : 180;

        // 3. Staggered Wave (0, 140, or 280) creates 3 distinct vertical "tiers"
        const stagger = (i % 3) * 140;

        // 4. Importance Push: Less important characters (closer to 0) get pushed further out
        const importance = sortedNodes[i].data?.importance || 0.5;
        const importancePush = (1 - importance) * 150;

        // Calculate final organic Y position
        const y = isTop
            ? (baseY - stagger - importancePush)
            : (baseY + stagger + importancePush);

        sortedNodes[i].position = { x, y };
    }

    return sortedNodes;
};

export const styleEdges = (edges, nodes, viewMode = 'story') => {
    if (!edges) return [];
    const nodeMap = new Map(nodes.map(node => [node.id, node]));

    return edges.map(edge => {
        const sourceNode = nodeMap.get(edge.source);
        const targetNode = nodeMap.get(edge.target);
        if (!sourceNode || !targetNode) return { ...edge, hidden: true };

        const sentiment = edge.data?.sentiment || 'neutral';
        const strength = edge.data?.strength || 0.5;

        const sourceImp = sourceNode.data?.importance || 0.5;
        const targetImp = targetNode.data?.importance || 0.5;

        let sourceHandle = 'right';
        let targetHandle = 'left';

        if (sourceNode.position.x > targetNode.position.x) {
            sourceHandle = 'left';
            targetHandle = 'right';
        }

        const isNegative = sentiment === 'negative';

        let type = 'default';
        if (viewMode === 'story') {
            type = isNegative ? 'battleEdge' : 'friendshipEdge';
        }

        const strokeColor = isNegative ? '#ef4444' : '#10b981';
        const strokeWidth = viewMode === 'story' ? 0 : (3 + strength * 15);

        return {
            ...edge,
            sourceHandle,
            targetHandle,
            type,
            data: { ...edge.data, sourceImp, targetImp },
            animated: false,
            style: {
                stroke: strokeColor,
                strokeWidth: strokeWidth,
                opacity: 0.9,
            }
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

        if (!isSummary) {
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
        formattedEdges = styleEdges(rawEdges, formattedNodes, isSummary ? 'summary' : 'story');
    }

    return {
        nodes: formattedNodes,
        edges: formattedEdges,
        masterNodes: formattedNodes,
        chapters: json.chapters || []
    };
};