import { MarkerType } from 'reactflow';

// Layout Configuration
const ROW_HEIGHT = 400; // Increased to let graph breathe
const OFFSET_X = 500;   // Increased to spread nodes out

// Pre-calculate sizing constants
const BASE_SIZE = 100; // Default base
const SIZE_MULTIPLIER = 200; // Multiplier for importance

/**
 * Calculates the pyramid layout positions for nodes based on rank.
 */
const calculateLayout = (nodes) => {
    // Sort by importance (descending) to determine rank
    const sortedNodes = [...nodes].sort((a, b) => b.data.importance - a.data.importance);

    // Assign ranks and positions
    let nodeIndex = 0;
    for (let level = 0; nodeIndex < sortedNodes.length; level++) {
        const itemsForThisLevel = level + 1; // 1, 2, 3...
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
                // Explicit Rule: Rank 2 (idx 0) -> -Offset, Rank 3 (idx 1) -> +Offset
                if (idx === 0) x = -OFFSET_X;
                else x = OFFSET_X;
            } else {
                // Generalize for deeper levels: Center them
                const rowWidth = (rowNodes.length - 1) * OFFSET_X;
                const startX = -rowWidth / 2;
                x = startX + (idx * OFFSET_X);
            }

            node.position = { x, y };
        });
    }

    return sortedNodes;
};

/**
 * Styles edges based on Rule 4 and Feature: Smart Anchors
 */
const styleEdges = (edges, nodes) => {
    const nodeMap = new Map(nodes.map(node => [node.id, node]));

    return edges.map(edge => {
        const { sentiment, strength } = edge.data;
        const sourceNode = nodeMap.get(edge.source);
        const targetNode = nodeMap.get(edge.target);

        // Default Fallback
        let sourceHandle = 'bottom';
        let targetHandle = 'top';

        if (sourceNode && targetNode) {
            // Calculate distances
            const sx = sourceNode.position.x;
            const sy = sourceNode.position.y;
            const tx = targetNode.position.x;
            const ty = targetNode.position.y;

            const dx = tx - sx;
            const dy = ty - sy;

            // --- NEW LOGIC: Determine dominant direction ---
            if (Math.abs(dx) > Math.abs(dy)) {
                // Horizontal relationship is stronger
                if (dx > 0) {
                    sourceHandle = 'right'; // Target is to the Right
                    targetHandle = 'left';
                } else {
                    sourceHandle = 'left';  // Target is to the Left
                    targetHandle = 'right';
                }
            } else {
                // Vertical relationship is stronger
                if (dy > 0) {
                    sourceHandle = 'bottom'; // Target is Below
                    targetHandle = 'top';
                } else {
                    sourceHandle = 'top';    // Target is Above
                    targetHandle = 'bottom';
                }
            }
        }

        // Visual Styling
        const strokeColor = sentiment === 'positive' ? '#10b981' : '#dc2626';
        // Exponential thickness: Weak=2px, Strong=22px
        const lineWidth = 2 + Math.pow(strength || 0.5, 2) * 20;

        return {
            ...edge,
            sourceHandle,
            targetHandle,
            type: 'default', // Keep curved bezier
            style: {
                stroke: strokeColor,
                strokeWidth: lineWidth,
                opacity: 0.9,
            },
            animated: false,
        };
    });
};

// ... keep imports and helper functions ...

export const processGraphData = (json) => {
    // If it's the new chapter format, we extract the "Master List" of characters
    const rawNodes = json.characters.map(char => ({
        id: char.id,
        data: {
            label: char.name,
            importance: char.importance,
            imageUrl: char.imageUrl
        }
    }));

    // Calculate layout for EVERYONE (so positions are stable)
    const formattedNodes = calculateLayout(rawNodes).map(node => ({
        ...node,
        position: node.position || { x: 0, y: 0 },
        data: {
            ...node.data,
            size: BASE_SIZE + (node.data.importance * SIZE_MULTIPLIER)
        },
        type: 'characterNode',
    }));

    return {
        masterNodes: formattedNodes,
        chapters: json.chapters // Pass chapters through
    };
};

// ... keep styleEdges function ...
// Make sure to export styleEdges so we can use it in App.jsx!
export { styleEdges };
