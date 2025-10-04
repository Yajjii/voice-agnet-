
import React from 'react';
import { useVoiceAgent } from './hooks/useVoiceAgent';
import { AgentState } from './types';
import Transcript from './components/Transcript';
import VoiceAgentButton from './components/VoiceAgentButton';
import StatusIndicator from './components/StatusIndicator';

const App: React.FC = () => {
  const { agentState, transcript, error, toggleAgent } = useVoiceAgent();

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100 p-4 items-center">
      <header className="w-full max-w-4xl mx-auto text-center mb-4">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
          Gemini Voice Agent
        </h1>
        <p className="text-gray-400 mt-2">
          Click the microphone and start talking.
        </p>
      </header>

      <div className="flex-grow w-full max-w-4xl bg-gray-800 rounded-lg shadow-2xl p-6 overflow-y-auto mb-4 flex flex-col">
          {transcript.length === 0 && agentState === AgentState.IDLE && (
               <div className="flex-grow flex flex-col justify-center items-center text-center text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  <h2 className="text-xl font-semibold">Your conversation will appear here.</h2>
                  <p>Click the microphone button below to begin.</p>
              </div>
          )}
          <Transcript messages={transcript} />
      </div>

      <footer className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center space-y-4">
        {error && <p className="text-red-400 bg-red-900/50 px-4 py-2 rounded-md">{error}</p>}
        <StatusIndicator state={agentState} />
        <VoiceAgentButton agentState={agentState} onClick={toggleAgent} />
      </footer>
    </div>
  );
};

export default App;
