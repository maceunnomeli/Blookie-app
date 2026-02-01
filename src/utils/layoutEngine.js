import { MarkerType } from 'reactflow';

// Layout Configuration
const ROW_HEIGHT = 600;
const OFFSET_X = 700;
const BASE_SIZE = 100;
const SIZE_MULTIPLIER = 200;

const calculateLayout = (nodes) => {
    if (!nodes || nodes.length === 0) return [];

    const sortedNodes = [...nodes].sort((a, b) => {
        const impA = a.data?.importance || 0.5;
        const impB = b.data?.importance || 0.5;
        return impB - impA;
    });

    let nodeIndex = 0;
    for (let level = 0; nodeIndex < sortedNodes.length; level++) {
        const itemsForThisLevel = level + 1;
        const rowNodes = [];

        for (let i = 0; i < itemsForThisLevel && nodeIndex < sortedNodes.length; i++) {
            rowNodes.push(sortedNodes[nodeIndex]);
            nodeIndex++;
        }

        rowNodes.forEach((node, idx) => {
            const y = level * ROW_HEIGHT;
            let x = 0;

            if (level === 0) {
                x = 0;
            } else if (level === 1) {
                if (idx === 0) x = -OFFSET_X;
                else x = OFFSET_X;
            } else {
                const rowWidth = (rowNodes.length - 1) * OFFSET_X;
                const startX = -rowWidth / 2;
                x = startX + (idx * OFFSET_X);
            }

            node.position = { x, y };
        });
    }

    return sortedNodes;
};

export const styleEdges = (edges, nodes) => {
    if (!edges) return [];
    const nodeMap = new Map(nodes.map(node => [node.id, node]));

    return edges.map(edge => {
        const sourceNode = nodeMap.get(edge.source);
        const targetNode = nodeMap.get(edge.target);

        if (!sourceNode || !targetNode) return { ...edge, hidden: true };

        const sentiment = edge.data?.sentiment || 'neutral';
        const strength = edge.data?.strength || 0.5;

        // Smart Anchors logic
        let sourceHandle = 'bottom';
        let targetHandle = 'top';

        const sx = sourceNode.position.x;
        const sy = sourceNode.position.y;
        const tx = targetNode.position.x;
        const ty = targetNode.position.y;
        const dx = tx - sx;
        const dy = ty - sy;

        if (Math.abs(dx) > Math.abs(dy)) {
            sourceHandle = dx > 0 ? 'right' : 'left';
            targetHandle = dx > 0 ? 'left' : 'right';
        } else {
            sourceHandle = dy > 0 ? 'bottom' : 'top';
            targetHandle = dy > 0 ? 'top' : 'bottom';
        }

        const strokeColor = sentiment === 'positive' ? '#fbbf24' : '#ef4444'; // Gold or Red

        // THICKNESS FIX: Base 4px + up to 12px based on strength
        const lineWidth = 4 + (strength * 8);

        return {
            ...edge,
            sourceHandle,
            targetHandle,
            type: 'default', // 'default' is a bezier curve
            style: {
                stroke: strokeColor,
                strokeWidth: lineWidth,
                opacity: 0.8,
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