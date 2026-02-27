import React, { memo, useState, useEffect, useRef } from 'react';
import { Handle, Position } from 'reactflow';

// --- CHARACTER DESCRIPTIONS DICTIONARY ---
const CHARACTER_DESCRIPTIONS = {
    "alice": "A curious and imaginative girl who falls down a rabbit hole into a nonsensical world. She struggles to maintain her Victorian logic amidst the chaos.",
    "white rabbit": "A perpetually tardy and nervous creature wearing a waistcoat. His frantic rushing initiates Alice's entire adventure.",
    "queen": "The tyrannical, foul-tempered ruler of Wonderland. She attempts to solve every annoyance by screaming 'Off with their heads!'",
    "mad hatter": "A quirky tea party host trapped permanently at tea time. He speaks in unanswerable riddles and constantly frustrates Alice.",
    "cheshire cat": "A philosophical, grinning feline who can disappear at will. He acts as a confusing but somewhat helpful guide.",
    "march hare": "The Mad Hatter's equally eccentric companion. He treats every day like an endless, chaotic tea party.",
    "dormouse": "A very sleepy rodent who sits between the Hatter and Hare. He occasionally wakes up to tell nonsensical stories.",
    "caterpillar": "A haughty, hookah-smoking insect who questions Alice's identity. He teaches her how to control her size using a magic mushroom.",
    "duchess": "A highly un-maternal woman who violently nurses a baby that turns into a pig. She attempts to find a moral in absolutely everything.",
    "gryphon": "A mythical creature serving the Queen. He introduces Alice to the Mock Turtle and the Lobster Quadrille.",
    "mock turtle": "A deeply melancholic creature with the head of a calf and body of a turtle. He is always weeping over his school days.",
    "knave": "A timid servant put on trial for his life. He is accused of the alleged theft of the Queen's tarts."
};

const CharacterNode = ({ id, data, selected }) => {
    const size = 100 + (data.importance || 0.5) * 300;
    const scaleRatio = size / 250;

    const isActive = data.style?.opacity !== 0.1;
    const isThinking = data.isThinking;
    const mood = data.mood || 'neutral';

    const isSummaryMode = data.isSummaryMode;
    const isThisAudioPlaying = data.activeAudioId === id;
    const audioRef = useRef(null);

    const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);

    const normalizedId = String(id).toLowerCase();
    const normalizedLabel = String(data.label || '').toLowerCase();

    const isAlice = normalizedId.includes('alice') || normalizedLabel.includes('alice');
    const isQueen = normalizedId.includes('queen') || normalizedLabel.includes('queen');

    const hasAudio = isAlice || isQueen;

    let audioFileName = '';
    if (isAlice) audioFileName = 'alice.mp3';
    if (isQueen) audioFileName = 'queen_of_hearts.mp3';

    const audioFilePath = audioFileName;

    let characterDescription = "A curious inhabitant of Wonderland.";
    const searchString = `${normalizedId} ${normalizedLabel}`.replace(/_/g, ' ');

    for (const key in CHARACTER_DESCRIPTIONS) {
        if (searchString.includes(key)) {
            characterDescription = CHARACTER_DESCRIPTIONS[key];
            break;
        }
    }

    const rawImage = data.imageUrl || '';
    const cleanImage = rawImage.replace(/_(happy|sad|angry)/i, '');

    let targetImage = cleanImage;
    if (mood !== 'neutral' && cleanImage) {
        const extMatch = cleanImage.match(/\.(png|jpe?g|svg|webp)$/i);
        if (extMatch) {
            targetImage = cleanImage.replace(extMatch[0], `_${mood}${extMatch[0]}`);
        } else {
            targetImage = `${cleanImage}_${mood}`;
        }
    }

    const [currentSrc, setCurrentSrc] = useState(targetImage);

    useEffect(() => {
        setCurrentSrc(targetImage);
    }, [targetImage]);

    useEffect(() => {
        if (!audioRef.current) return;

        if (isThisAudioPlaying) {
            audioRef.current.play().catch(err => console.warn("Playback blocked or file missing:", err));
        } else {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    }, [isThisAudioPlaying]);

    useEffect(() => {
        if (!isSummaryMode) {
            setIsDescriptionOpen(false);
        }
    }, [isSummaryMode]);

    const toggleAudio = (e) => {
        e.stopPropagation();
        if (isThisAudioPlaying) {
            data.setActiveAudioId(null);
        } else {
            data.setActiveAudioId(id);
        }
    };

    const handleAudioEnded = () => {
        data.setActiveAudioId(null);
    };

    const handleError = () => {
        if (currentSrc !== cleanImage) {
            setCurrentSrc(cleanImage);
        }
    };

    let borderColor = selected ? '#fbbf24' : 'white';
    let imageTransform = 'scale(1)';

    if (mood === 'sad') {
        borderColor = '#94a3b8';
    } else if (mood === 'happy') {
        borderColor = '#10b981';
        imageTransform = 'scale(1.05)';
    } else if (mood === 'angry') {
        borderColor = '#ef4444';
        imageTransform = 'scale(1.1)';
    }

    if (isThinking) borderColor = '6px dashed #fff';

    const borderRadius = isThinking
        ? '50% 50% 50% 50% / 60% 60% 40% 40%'
        : '50%';

    return (
        <div
            style={{
                width: `${size}px`,
                height: `${size}px`,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            <Handle type="target" position={Position.Top} id="top" style={{ opacity: 0 }} />
            <Handle type="source" position={Position.Bottom} id="bottom" style={{ opacity: 0 }} />
            <Handle type="target" position={Position.Left} id="left" style={{ opacity: 0 }} />
            <Handle type="source" position={Position.Right} id="right" style={{ opacity: 0 }} />

            {hasAudio && (
                <audio
                    ref={audioRef}
                    src={audioFilePath}
                    onEnded={handleAudioEnded}
                />
            )}

            {isActive && isThinking && (
                <div style={{
                    position: 'absolute',
                    top: -20 * scaleRatio,
                    right: -50 * scaleRatio,
                    zIndex: 5,
                    pointerEvents: 'none',
                    transform: `scale(${scaleRatio})`,
                    transformOrigin: 'bottom left'
                }}>
                    <div style={{ position: 'absolute', bottom: 10, left: -40, width: 25, height: 25, borderRadius: '50%', background: 'white', opacity: 0.8 }} />
                    <div style={{ position: 'absolute', bottom: 40, left: -20, width: 45, height: 45, borderRadius: '50%', background: 'white', opacity: 0.9 }} />

                    <div style={{
                        position: 'absolute', bottom: 80, left: 0,
                        width: 120, height: 90, background: 'white', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                        animation: 'float 2s infinite ease-in-out'
                    }}>
                        <span style={{ fontSize: '50px', color: '#64748b', fontWeight: 'bold', marginTop: '-10px' }}>...</span>
                    </div>
                    <style>{`@keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }`}</style>
                </div>
            )}

            <div
                style={{
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    borderRadius: borderRadius,
                    border: isActive ? `${6 * scaleRatio}px solid ${borderColor}` : `${6 * scaleRatio}px solid white`,
                    boxShadow: selected ? '0 0 60px rgba(251,191,36,0.8)' : '0 20px 40px rgba(0,0,0,0.6)',
                    background: 'white',
                    opacity: !isActive ? 0.5 : 1,
                    transition: 'all 0.5s ease',
                    transform: isThinking ? 'translateY(-10px)' : 'none'
                }}
            >
                <div style={{ width: '100%', height: '100%', borderRadius: borderRadius, overflow: 'hidden' }}>
                    {currentSrc ? (
                        <img
                            src={currentSrc}
                            alt={data.label}
                            onError={handleError}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                filter: !isActive ? 'grayscale(100%) blur(2px)' : 'none',
                                transform: imageTransform,
                                transition: 'transform 0.5s ease'
                            }}
                        />
                    ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '50px', color: '#ccc' }}>?</div>
                    )}
                </div>

                {isSummaryMode && hasAudio && (
                    <button
                        onClick={toggleAudio}
                        className="nodrag"
                        style={{
                            position: 'absolute',
                            top: '12%',
                            right: '12%',
                            width: `${35 * scaleRatio}px`,
                            height: `${35 * scaleRatio}px`,
                            borderRadius: '50%',
                            background: isThisAudioPlaying ? '#10b981' : 'rgba(30, 41, 59, 0.85)',
                            border: `2px solid ${isThisAudioPlaying ? '#fff' : '#475569'}`,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: `${18 * scaleRatio}px`,
                            boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                            zIndex: 110,
                            transition: 'all 0.2s ease',
                            backdropFilter: 'blur(4px)'
                        }}
                        title={`Play ${data.label}'s summary`}
                    >
                        {isThisAudioPlaying ? '🔊' : '🔈'}
                    </button>
                )}
            </div>

            {/* --- FIXED TYPOGRAPHY WRAPPER --- */}
            {isActive && (
                <div
                    className="nodrag"
                    style={{
                        position: 'absolute',
                        bottom: isThinking ? '-60px' : '-40px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        zIndex: 100,
                        width: '600px' // <--- Widened to comfortably fit the 30px text
                    }}
                >
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            if (isSummaryMode) setIsDescriptionOpen(!isDescriptionOpen);
                        }}
                        style={{
                            backgroundColor: 'black',
                            padding: '12px 24px',
                            borderRadius: '50px',
                            border: isSummaryMode && isDescriptionOpen ? '2px solid #fbbf24' : '2px solid #333',
                            boxShadow: isSummaryMode && isDescriptionOpen ? '0 0 15px rgba(251,191,36,0.4)' : '0 5px 20px rgba(0,0,0,0.9)',
                            cursor: isSummaryMode ? 'pointer' : 'default',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            transition: 'all 0.2s ease',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        <span style={{
                            color: 'white',
                            fontWeight: '900',
                            fontSize: '35px',
                            textTransform: 'uppercase',
                            fontFamily: 'sans-serif',
                            letterSpacing: '1px'
                        }}>
                            {data.label}
                        </span>
                        {isSummaryMode && (
                            <span style={{
                                color: '#fbbf24',
                                fontSize: '24px',
                                transition: 'transform 0.2s ease',
                                transform: isDescriptionOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                            }}>
                                ▼
                            </span>
                        )}
                    </div>

                    {/* DESCRIPTION OVERLAY */}
                    {isSummaryMode && (
                        <div style={{
                            marginTop: '10px',
                            background: 'rgba(15, 23, 42, 0.95)',
                            border: '1px solid #334155',
                            borderRadius: '12px',
                            padding: isDescriptionOpen ? '26px 20px' : '0px 20px',
                            color: '#cbd5e1',
                            fontSize: '30px',
                            lineHeight: '1.6',
                            textAlign: 'center',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
                            backdropFilter: 'blur(8px)',
                            maxHeight: isDescriptionOpen ? '500px' : '0px', // <--- Increased height capacity
                            opacity: isDescriptionOpen ? 1 : 0,
                            overflow: 'hidden',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            pointerEvents: isDescriptionOpen ? 'auto' : 'none'
                        }}>
                            {characterDescription}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default memo(CharacterNode);