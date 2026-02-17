import { MarkerType } from 'reactflow';

// CONFIG: Horizontal Layout
const COLUMN_WIDTH = 800;
const ROW_HEIGHT = 250;

const calculateLayout = (nodes) => {
    if (!nodes || nodes.length === 0) return [];

    const sortedNodes = [...nodes].sort((a, b) => {
        const impA = a.data?.importance || 0.5;
        const impB = b.data?.importance || 0.5;
        return impB - impA;
    });

    // Alice at 0,0
    sortedNodes[0].position = { x: 0, y: 0 };

    for (let i = 1; i < sortedNodes.length; i++) {
        const col = Math.ceil(i / 2);
        const isTop = i % 2 !== 0;

        const x = col * COLUMN_WIDTH;
        const y = (isTop ? -ROW_HEIGHT : ROW_HEIGHT) + (Math.random() * 50 - 25);

        sortedNodes[i].position = { x, y };
    }

    return sortedNodes;
};

// --- SMART EDGE STYLING (The Fix) ---
export const styleEdges = (edges, nodes) => {
    if (!edges) return [];
    const nodeMap = new Map(nodes.map(node => [node.id, node]));

    return edges.map(edge => {
        const sourceNode = nodeMap.get(edge.source);
        const targetNode = nodeMap.get(edge.target);

        if (!sourceNode || !targetNode) return { ...edge, hidden: true };

        const sentiment = edge.data?.sentiment || 'neutral';
        const strength = edge.data?.strength || 0.5;

        // 1. Calculate positions to find Shortest Path
        const sx = sourceNode.position.x;
        const sy = sourceNode.position.y;
        const tx = targetNode.position.x;
        const ty = targetNode.position.y;

        const dx = tx - sx;
        const dy = ty - sy;

        // 2. "Smart Anchor" Logic
        let sourceHandle = 'right';
        let targetHandle = 'left';

        // If vertical distance is greater than horizontal distance, switch to Vertical Mode
        if (Math.abs(dy) > Math.abs(dx)) {
            if (dy > 0) {
                // Target is BELOW Source
                sourceHandle = 'bottom';
                targetHandle = 'top';
            } else {
                // Target is ABOVE Source
                sourceHandle = 'top';
                targetHandle = 'bottom';
            }
        } else {
            // Horizontal Mode (Standard)
            if (dx > 0) {
                sourceHandle = 'right';
                targetHandle = 'left';
            } else {
                // Rare case: Target is to the LEFT (backwards)
                sourceHandle = 'left';
                targetHandle = 'right';
            }
        }

        const isNegative = sentiment === 'negative';
        const strokeColor = isNegative ? '#ef4444' : '#10b981';
        const lineWidth = 3 + (strength * 15);

        return {
            ...edge,
            sourceHandle,
            targetHandle,
            type: 'default', // Bezier curve adapts to the handles
            style: {
                stroke: strokeColor,
                strokeWidth: lineWidth,
                opacity: 0.9,
            },
            animated: false,
        };
    });
};

export const processGraphData = (json) => {
    if (!json) return { nodes: [], edges: [], chapters: [] };

    let rawNodes = [];
    let isChapterData = false;

    if (json.characters) {
        isChapterData = true;
        rawNodes = json.characters.map(char => ({
            id: char.id,
            data: {
                label: char.name,
                importance: char.importance || 0.5,
                imageUrl: char.imageUrl
            }
        }));
    } else if (json.nodes) {
        rawNodes = json.nodes.map(n => ({
            ...n,
            data: n.data || { label: n.id, importance: 0.5 }
        }));
    }

    const formattedNodes = calculateLayout(rawNodes).map(node => ({
        ...node,
        position: node.position || { x: 0, y: 0 },
        data: { ...node.data },
        type: 'characterNode',
    }));

    let formattedEdges = [];
    if (!isChapterData && json.edges) {
        const rawEdges = json.edges.map(e => ({
            ...e,
            id: e.id || `e-${e.source}-${e.target}`,
            data: e.data || { sentiment: 'neutral', strength: 0.5 }
        }));
        formattedEdges = styleEdges(rawEdges, formattedNodes);
    }

    return {
        nodes: formattedNodes,
        edges: formattedEdges,
        masterNodes: formattedNodes,
        chapters: json.chapters || []
    };
};