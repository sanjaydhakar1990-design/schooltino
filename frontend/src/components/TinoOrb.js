/**
 * TinoOrb - AI Agent Visual Component
 * Inspired by ElevenLabs AI Agents
 * 
 * States:
 * - idle: Soft breathing animation with gentle glow
 * - listening: Pulsing pink/magenta, expanding rings, sound bars
 * - thinking: Rotating gradient, faster pulse, orbiting particles
 * - speaking: Blue waves emanating, rhythmic pulse, voice visualization
 */

import React from 'react';

const TinoOrb = ({ state = 'idle', size = 'md', className = '', onClick }) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-28 h-28',
    lg: 'w-40 h-40',
    xl: 'w-56 h-56'
  };

  const coreSize = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32',
    xl: 'w-44 h-44'
  };

  const getStateClasses = () => {
    switch (state) {
      case 'listening':
        return {
          core: 'from-pink-500 via-rose-500 to-purple-500',
          glow: 'bg-pink-400/50',
          animation: 'animate-pulse-fast',
          rings: true,
          soundBars: true
        };
      case 'thinking':
        return {
          core: 'from-indigo-500 via-purple-600 to-violet-500',
          glow: 'bg-purple-400/40',
          animation: 'animate-spin-slow',
          rings: false,
          particles: true
        };
      case 'speaking':
        return {
          core: 'from-blue-400 via-indigo-500 to-purple-500',
          glow: 'bg-blue-400/50',
          animation: 'animate-pulse-speak',
          rings: true,
          waves: true,
          speakingBars: true
        };
      default: // idle
        return {
          core: 'from-indigo-500 via-purple-500 to-pink-500',
          glow: 'bg-indigo-400/30',
          animation: 'animate-breathe',
          rings: false,
          idlePulse: true
        };
    }
  };

  const stateConfig = getStateClasses();

  return (
    <div 
      className={`relative flex items-center justify-center ${sizeClasses[size]} ${className} cursor-pointer`}
      data-testid="tino-orb"
      data-state={state}
      onClick={onClick}
    >
      {/* Outer Ambient Glow */}
      <div 
        className={`absolute inset-0 rounded-full ${stateConfig.glow} blur-3xl ${stateConfig.animation}`}
        style={{ transform: 'scale(1.5)' }}
      />
      
      {/* Expanding Rings for Listening/Speaking */}
      {stateConfig.rings && (
        <>
          <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping-slow" />
          <div className="absolute inset-1 rounded-full border border-white/20 animate-ping-slower" />
          <div className="absolute inset-2 rounded-full border border-white/10 animate-ping-slowest" />
        </>
      )}

      {/* Sound Waves for Speaking */}
      {stateConfig.waves && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute w-full h-full rounded-full border-2 border-blue-300/40 animate-wave-1" />
          <div className="absolute w-full h-full rounded-full border-2 border-blue-300/30 animate-wave-2" />
          <div className="absolute w-full h-full rounded-full border-2 border-blue-300/20 animate-wave-3" />
        </div>
      )}

      {/* Idle Pulse Effect */}
      {stateConfig.idlePulse && (
        <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-indigo-400/20 to-purple-400/20 blur-xl animate-breathe" />
      )}
      
      {/* Inner Glow Ring */}
      <div 
        className={`absolute ${coreSize[size]} rounded-full bg-gradient-to-tr ${stateConfig.core} opacity-50 blur-lg ${stateConfig.animation}`}
      />
      
      {/* Core Orb with 3D effect */}
      <div 
        className={`relative ${coreSize[size]} rounded-full bg-gradient-to-tr ${stateConfig.core} shadow-2xl ${stateConfig.animation}`}
        style={{
          boxShadow: state === 'speaking' 
            ? '0 0 80px rgba(59, 130, 246, 0.6), 0 0 120px rgba(99, 102, 241, 0.4), inset 0 -10px 30px rgba(0,0,0,0.3)'
            : state === 'listening'
            ? '0 0 80px rgba(236, 72, 153, 0.6), 0 0 120px rgba(139, 92, 246, 0.4), inset 0 -10px 30px rgba(0,0,0,0.3)'
            : state === 'thinking'
            ? '0 0 60px rgba(139, 92, 246, 0.5), 0 0 100px rgba(99, 102, 241, 0.3), inset 0 -10px 30px rgba(0,0,0,0.3)'
            : '0 0 50px rgba(99, 102, 241, 0.4), inset 0 -10px 30px rgba(0,0,0,0.2)'
        }}
      >
        {/* Glossy Highlight - Top */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/40 via-transparent to-transparent opacity-70" />
        
        {/* Glossy Highlight - Bottom reflection */}
        <div className="absolute bottom-0 left-1/4 right-1/4 h-1/3 rounded-full bg-gradient-to-t from-white/10 to-transparent blur-sm" />
        
        {/* Center Visual Elements */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Listening - Sound Bars */}
          {stateConfig.soundBars && (
            <div className="flex gap-1 items-end">
              <div className="w-1.5 bg-white/90 rounded-full animate-sound-bar-1" style={{ height: '16px' }} />
              <div className="w-1.5 bg-white/90 rounded-full animate-sound-bar-2" style={{ height: '24px' }} />
              <div className="w-1.5 bg-white/90 rounded-full animate-sound-bar-3" style={{ height: '12px' }} />
              <div className="w-1.5 bg-white/90 rounded-full animate-sound-bar-2" style={{ height: '20px' }} />
              <div className="w-1.5 bg-white/90 rounded-full animate-sound-bar-1" style={{ height: '14px' }} />
            </div>
          )}
          
          {/* Speaking - Voice Bars */}
          {stateConfig.speakingBars && (
            <div className="flex gap-1.5 items-center">
              <div className="w-2 bg-white/95 rounded-full animate-speak-bar-1" style={{ height: '12px' }} />
              <div className="w-2 bg-white/95 rounded-full animate-speak-bar-2" style={{ height: '20px' }} />
              <div className="w-2 bg-white/95 rounded-full animate-speak-bar-3" style={{ height: '16px' }} />
              <div className="w-2 bg-white/95 rounded-full animate-speak-bar-2" style={{ height: '24px' }} />
              <div className="w-2 bg-white/95 rounded-full animate-speak-bar-1" style={{ height: '10px' }} />
            </div>
          )}
          
          {/* Thinking - Spinner */}
          {stateConfig.particles && (
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              <div className="absolute inset-2 border-2 border-white/20 border-b-white/60 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
            </div>
          )}
          
          {/* Idle - Gentle pulse dot */}
          {stateConfig.idlePulse && (
            <div className="w-4 h-4 bg-white/90 rounded-full animate-pulse shadow-lg shadow-white/50" />
          )}
        </div>
      </div>

      {/* State Label */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span className={`text-xs font-semibold px-3 py-1 rounded-full shadow-sm ${
          state === 'listening' ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white' :
          state === 'speaking' ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white' :
          state === 'thinking' ? 'bg-gradient-to-r from-purple-500 to-violet-500 text-white' :
          'bg-white/90 text-slate-600 border border-slate-200'
        }`}>
          {state === 'listening' ? '🎤 सुन रहा हूं...' :
           state === 'speaking' ? '🗣️ बोल रहा हूं...' :
           state === 'thinking' ? '🧠 सोच रहा हूं...' :
           '✨ Tino AI'}
        </span>
      </div>
    </div>
  );
};

export default TinoOrb;
