import React, { useCallback } from 'react';
import { useStore, getBezierPath, getSmoothStepPath } from 'reactflow';
import { getEdgeParams } from '../utils/floatingEdgeUtils';

function FloatingEdge({ id, source, target, markerEnd, style }) {
    const sourceNode = useStore(useCallback((store) => store.nodeInternals.get(source), [source]));
    const targetNode = useStore(useCallback((store) => store.nodeInternals.get(target), [target]));

    if (!sourceNode || !targetNode) {
        return null;
    }

    const { sx, sy, tx, ty } = getEdgeParams(sourceNode, targetNode);

    // We want a curved line (bezier or smoothstep) as requested.
    // The user asked for "Solid, curved lines" (smoothstep or bezier).
    // "Change the default edge type... to 'smoothstep' or 'bezier'."
    // Let's use getBezierPath which provides a nice curve.
    // However, for floating edges, sometimes a straight line looks cleaner if they are close, 
    // but let's try Bezier to satisfy "curved".
    // Note: calculating correct control points for floating bezier can be tricky. 
    // A simple straight path is often used with floating edges to avoid weird loops.
    // BUT the user specifically asked for "Solid, curved lines".
    // Let's try to infer direction for the curve or just use a straight line if it looks better?
    // User Prompt: "Make Lines Solid and Curved" + "Floating Edges".
    // If I use straight line, I fail "Curved".
    // If I use Bezier, I need sourcePosition/targetPosition (Top/Bottom/Left/Right).
    // Our getHandlePosition calculates exact coordinates.
    // Let's use a straight path (M sx sy L tx ty) but add some curve if needed? 
    // Actually, standard Floating Edges are usually straight lines.
    // Wait, the prompt says: "Change the default edge type... to 'smoothstep' or 'bezier'... Implement 'Floating Edges'... You will need to create a custom edge component".
    // It effectively asks for TWO things that might conflict if not careful.
    // If I make a custom Floating Edge, *I* control the path drawing.
    // If I just want dynamic connection points, that's "Floating Handles".
    // The standard "Floating Edge" example calculates the shortest path between two nodes.
    // Let's stick to the user's specific request: "Floating Edges" to allow lines to originate from optimal intersection.
    // And "Curved". 
    // To get a curve, we need a "sourcePosition" and "targetPosition" (e.g. Top/Bottom).
    // We can infer the best side (Top/Right/Bottom/Left) based on relative positions for the Bezier control points.

    // Let's try a simple Bezier first, inferring position based on angle?
    // Or actually, let's just use Straight line for floating edges as it is the most robust and "clean" look for this graph type, 
    // but if the user INSISTS on curved, I might default to straight if simply calculating handle position.
    // Let's look at the "Solution" text again:
    // "Change the default edge type... to 'smoothstep' or 'bezier'." -> This implies generic edges.
    // "Implement Floating Edges... custom edge component... helper function to get edge parameters".
    // Okay, I will provide a custom edge that attempts to curve.

    // We can simply calculate the path. 
    const [edgePath] = getBezierPath({
        sourceX: sx,
        sourceY: sy,
        sourcePosition: getPosition(sourceNode, targetNode),
        targetX: tx,
        targetY: ty,
        targetPosition: getPosition(targetNode, sourceNode),
    });

    return (
        <path
            id={id}
            className="react-flow__edge-path"
            d={edgePath}
            markerEnd={markerEnd}
            style={style}
        />
    );
}

// Helper to guess best Handle position (Top/Bottom/Left/Right) for Bezier curve control points
function getPosition(nodeA, nodeB) {
    const centerA = {
        x: nodeA.positionAbsolute.x + nodeA.width / 2,
        y: nodeA.positionAbsolute.y + nodeA.height / 2
    };
    const centerB = {
        x: nodeB.positionAbsolute.x + nodeB.width / 2,
        y: nodeB.positionAbsolute.y + nodeB.height / 2
    };

    const dx = centerB.x - centerA.x;
    const dy = centerB.y - centerA.y;

    if (Math.abs(dx) > Math.abs(dy)) {
        return dx > 0 ? Position.Right : Position.Left;
    } else {
        return dy > 0 ? Position.Bottom : Position.Top;
    }
}

export default FloatingEdge;
