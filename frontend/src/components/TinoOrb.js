/**
 * TinoOrb - AI Agent Visual Component
 * Inspired by ElevenLabs AI Agents
 * 
 * States:
 * - idle: Soft breathing animation
 * - listening: Pulsing pink/magenta, expanding rings
 * - thinking: Rotating gradient, faster pulse
 * - speaking: Blue waves emanating, rhythmic pulse
 */

import React from 'react';

const TinoOrb = ({ state = 'idle', size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-40 h-40'
  };

  const coreSize = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  };

  const getStateClasses = () => {
    switch (state) {
      case 'listening':
        return {
          core: 'from-pink-500 via-purple-500 to-indigo-500',
          glow: 'bg-pink-400/40',
          animation: 'animate-pulse-fast',
          rings: true
        };
      case 'thinking':
        return {
          core: 'from-indigo-500 via-purple-600 to-violet-500',
          glow: 'bg-purple-400/30',
          animation: 'animate-spin-slow',
          rings: false
        };
      case 'speaking':
        return {
          core: 'from-blue-500 via-indigo-500 to-purple-500',
          glow: 'bg-blue-400/40',
          animation: 'animate-pulse-speak',
          rings: true,
          waves: true
        };
      default: // idle
        return {
          core: 'from-indigo-500 via-purple-500 to-pink-500',
          glow: 'bg-indigo-400/20',
          animation: 'animate-breathe',
          rings: false
        };
    }
  };

  const stateConfig = getStateClasses();

  return (
    <div 
      className={`relative flex items-center justify-center ${sizeClasses[size]} ${className}`}
      data-testid="tino-orb"
      data-state={state}
    >
      {/* Outer Glow */}
      <div 
        className={`absolute inset-0 rounded-full ${stateConfig.glow} blur-2xl ${stateConfig.animation}`}
      />
      
      {/* Expanding Rings for Listening/Speaking */}
      {stateConfig.rings && (
        <>
          <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping-slow" />
          <div className="absolute inset-2 rounded-full border border-white/10 animate-ping-slower" />
        </>
      )}

      {/* Sound Waves for Speaking */}
      {stateConfig.waves && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute w-full h-full rounded-full border-2 border-blue-300/30 animate-wave-1" />
          <div className="absolute w-full h-full rounded-full border-2 border-blue-300/20 animate-wave-2" />
          <div className="absolute w-full h-full rounded-full border-2 border-blue-300/10 animate-wave-3" />
        </div>
      )}
      
      {/* Inner Glow Ring */}
      <div 
        className={`absolute ${coreSize[size]} rounded-full bg-gradient-to-tr ${stateConfig.core} opacity-40 blur-md ${stateConfig.animation}`}
      />
      
      {/* Core Orb */}
      <div 
        className={`relative ${coreSize[size]} rounded-full bg-gradient-to-tr ${stateConfig.core} shadow-2xl ${stateConfig.animation}`}
        style={{
          boxShadow: state === 'speaking' 
            ? '0 0 60px rgba(59, 130, 246, 0.5), 0 0 100px rgba(99, 102, 241, 0.3)'
            : state === 'listening'
            ? '0 0 60px rgba(236, 72, 153, 0.5), 0 0 100px rgba(139, 92, 246, 0.3)'
            : '0 0 40px rgba(99, 102, 241, 0.3)'
        }}
      >
        {/* Glossy Highlight */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/30 to-transparent opacity-60" />
        
        {/* Center Icon/Indicator */}
        <div className="absolute inset-0 flex items-center justify-center">
          {state === 'listening' && (
            <div className="flex gap-1">
              <div className="w-1 h-4 bg-white/80 rounded-full animate-sound-bar-1" />
              <div className="w-1 h-6 bg-white/80 rounded-full animate-sound-bar-2" />
              <div className="w-1 h-3 bg-white/80 rounded-full animate-sound-bar-3" />
              <div className="w-1 h-5 bg-white/80 rounded-full animate-sound-bar-1" />
              <div className="w-1 h-4 bg-white/80 rounded-full animate-sound-bar-2" />
            </div>
          )}
          {state === 'speaking' && (
            <div className="flex gap-1">
              <div className="w-1.5 h-3 bg-white/90 rounded-full animate-speak-bar-1" />
              <div className="w-1.5 h-5 bg-white/90 rounded-full animate-speak-bar-2" />
              <div className="w-1.5 h-4 bg-white/90 rounded-full animate-speak-bar-3" />
              <div className="w-1.5 h-6 bg-white/90 rounded-full animate-speak-bar-2" />
              <div className="w-1.5 h-3 bg-white/90 rounded-full animate-speak-bar-1" />
            </div>
          )}
          {state === 'thinking' && (
            <div className="w-6 h-6 border-2 border-white/50 border-t-white rounded-full animate-spin" />
          )}
          {state === 'idle' && (
            <div className="w-3 h-3 bg-white/80 rounded-full animate-pulse" />
          )}
        </div>
      </div>

      {/* State Label */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          state === 'listening' ? 'bg-pink-100 text-pink-700' :
          state === 'speaking' ? 'bg-blue-100 text-blue-700' :
          state === 'thinking' ? 'bg-purple-100 text-purple-700' :
          'bg-slate-100 text-slate-600'
        }`}>
          {state === 'listening' ? 'सुन रहा हूं...' :
           state === 'speaking' ? 'बोल रहा हूं...' :
           state === 'thinking' ? 'सोच रहा हूं...' :
           'Tino AI'}
        </span>
      </div>
    </div>
  );
};

export default TinoOrb;
