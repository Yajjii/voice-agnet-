
import React from 'react';
import { AgentState } from '../types';

interface StatusIndicatorProps {
  state: AgentState;
}

const getStatusInfo = (state: AgentState): { text: string; color: string } => {
  switch (state) {
    case AgentState.LISTENING:
      return { text: 'Listening...', color: 'bg-green-500' };
    case AgentState.THINKING:
      return { text: 'Thinking...', color: 'bg-yellow-500' };
    case AgentState.SPEAKING:
      return { text: 'Speaking...', color: 'bg-blue-500' };
    case AgentState.ERROR:
      return { text: 'Error', color: 'bg-red-500' };
    case AgentState.IDLE:
    default:
      return { text: 'Idle', color: 'bg-gray-500' };
  }
};

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ state }) => {
  const { text, color } = getStatusInfo(state);
  const isProcessing = state === AgentState.LISTENING || state === AgentState.THINKING || state === AgentState.SPEAKING;

  return (
    <div className="flex items-center justify-center h-6">
        {state !== AgentState.IDLE && (
            <div className="flex items-center space-x-2 text-gray-400">
            <span className={`relative flex h-3 w-3`}>
                <span className={`${color} ${isProcessing ? 'animate-ping' : ''} absolute inline-flex h-full w-full rounded-full opacity-75`}></span>
                <span className={`${color} relative inline-flex rounded-full h-3 w-3`}></span>
            </span>
            <span>{text}</span>
            </div>
        )}
    </div>
  );
};

export default StatusIndicator;
