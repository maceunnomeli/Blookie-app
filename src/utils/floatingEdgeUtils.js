import { Position, useInternalNode } from 'reactflow';

// Get the intersection point between the center of the node and the target position
function getHandlePosition(node, targetPosition) {
    const nodeCenter = getNodeCenter(node);
    const x = nodeCenter.x;
    const y = nodeCenter.y;

    // For circular nodes, we just need the angle
    // But React Flow standard example uses rectangular bounds. 
    // Since our nodes are circles, we can do this more simply or stick to the robust generic way.
    // Let's assume the node is roughly circular for the visual, but the handle logic 
    // usually works best if we project the line from center to center and find the intersection with the circle radius.

    // Actually, standard Floating Edge example finds the intersection with the bounding box.
    // Let's implement the standard circle intersection since we know they are circles.

    const dx = targetPosition.x - x;
    const dy = targetPosition.y - y;
    const angle = Math.atan2(dy, dx);

    // The radius is half the width (assuming width=height for circle)
    const radius = node.width / 2;

    // Calculate the point on the circle edge
    const handleX = x + radius * Math.cos(angle);
    const handleY = y + radius * Math.sin(angle);

    return { x: handleX, y: handleY };
}

function getNodeCenter(node) {
    return {
        x: node.positionAbsolute.x + node.width / 2,
        y: node.positionAbsolute.y + node.height / 2,
    };
}

// Params for the edge component to use
export function getEdgeParams(source, target) {
    const sourceCenter = getNodeCenter(source);
    const targetCenter = getNodeCenter(target);

    const sourceIntersection = getHandlePosition(source, targetCenter);
    const targetIntersection = getHandlePosition(target, sourceCenter);

    return {
        sx: sourceIntersection.x,
        sy: sourceIntersection.y,
        tx: targetIntersection.x,
        ty: targetIntersection.y,
        sourcePos: Position.Top, // These don't matter much for custom edge path calculation but are required
        targetPos: Position.Bottom,
    };
}
