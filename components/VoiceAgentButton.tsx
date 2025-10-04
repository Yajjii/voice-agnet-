
import React from 'react';
import { AgentState } from '../types';

interface VoiceAgentButtonProps {
  agentState: AgentState;
  onClick: () => void;
}

const MicrophoneIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm5 10.168V16h-4v-1.832A5.002 5.002 0 014 10V8h2v2a3 3 0 006 0V8h2v2a5.002 5.002 0 01-1 3.168z" clipRule="evenodd" />
  </svg>
);

const StopIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
  </svg>
);

const VoiceAgentButton: React.FC<VoiceAgentButtonProps> = ({ agentState, onClick }) => {
  const isIdle = agentState === AgentState.IDLE || agentState === AgentState.ERROR;
  const isListening = agentState === AgentState.LISTENING;

  const baseClasses = "relative w-20 h-20 rounded-full flex items-center justify-center text-white transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-opacity-50 shadow-lg";
  
  const stateClasses = isIdle
    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 focus:ring-indigo-400'
    : 'bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 focus:ring-rose-400';

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${stateClasses}`}
      aria-label={isIdle ? 'Start session' : 'Stop session'}
    >
      {isListening && (
        <span className="absolute h-full w-full rounded-full bg-green-500 animate-ping opacity-60"></span>
      )}
      {isIdle ? <MicrophoneIcon /> : <StopIcon />}
    </button>
  );
};

export default VoiceAgentButton;
