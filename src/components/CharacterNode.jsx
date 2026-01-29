import React from 'react';
import { Handle, Position } from 'reactflow';

const CharacterNode = ({ data }) => {
    // Default size if none is provided
    const size = data.size || 150;

    return (
        <div
            className="relative flex items-center justify-center transition-transform hover:scale-105"
            style={{
                width: size,
                height: size,
                borderRadius: '50%',
                border: '4px solid white',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
                backgroundColor: '#e2e8f0',
                overflow: 'visible', // Must be visible for handles to work properly
            }}
        >
            {/* Background Image */}
            {data.imageUrl && (
                <div
                    className="absolute inset-0 w-full h-full rounded-full"
                    style={{
                        backgroundImage: `url(${data.imageUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        opacity: 0.5,
                        zIndex: 0,
                        overflow: 'hidden'
                    }}
                />
            )}

            {/* --- THE UNIVERSAL HANDLES (8 Total) --- */}
            {/* Top */}
            <Handle type="target" position={Position.Top} id="top" className="opacity-0" />
            <Handle type="source" position={Position.Top} id="top" className="opacity-0" />

            {/* Bottom */}
            <Handle type="target" position={Position.Bottom} id="bottom" className="opacity-0" />
            <Handle type="source" position={Position.Bottom} id="bottom" className="opacity-0" />

            {/* Left */}
            <Handle type="target" position={Position.Left} id="left" className="opacity-0" />
            <Handle type="source" position={Position.Left} id="left" className="opacity-0" />

            {/* Right */}
            <Handle type="target" position={Position.Right} id="right" className="opacity-0" />
            <Handle type="source" position={Position.Right} id="right" className="opacity-0" />
            {/* --------------------------------------- */}

            {/* Character Name */}
            <div className="relative z-10 px-2 text-center pointer-events-none">
                <h1
                    className="font-extrabold text-black"
                    style={{
                        fontSize: `${size / 7}px`, // Dynamic font size based on bubble size
                        textShadow: '0 2px 4px rgba(255,255,255,0.8)',
                        lineHeight: 1,
                    }}
                >
                    {data.label}
                </h1>
            </div>
        </div>
    );
};

export default CharacterNode;