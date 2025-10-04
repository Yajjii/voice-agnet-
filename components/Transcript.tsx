
import React, { useRef, useEffect } from 'react';
import { Message, Speaker } from '../types';

interface TranscriptProps {
  messages: Message[];
}

const Transcript: React.FC<TranscriptProps> = ({ messages }) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="space-y-6">
      {messages.map((msg, index) => (
        <div key={index} className={`flex items-start gap-4 ${msg.speaker === Speaker.USER ? 'justify-end' : 'justify-start'}`}>
          {msg.speaker === Speaker.AGENT && (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 flex-shrink-0"></div>
          )}
          <div className={`max-w-md lg:max-w-lg px-5 py-3 rounded-2xl ${msg.speaker === Speaker.USER
            ? 'bg-blue-600 rounded-br-none'
            : 'bg-gray-700 rounded-bl-none'
            } ${msg.isFinal ? 'opacity-100' : 'opacity-70'}`}>
            <p className="text-white whitespace-pre-wrap">{msg.text}</p>
          </div>
          {msg.speaker === Speaker.USER && (
            <div className="w-8 h-8 rounded-full bg-gray-600 flex-shrink-0"></div>
          )}
        </div>
      ))}
      <div ref={endOfMessagesRef} />
    </div>
  );
};

export default Transcript;
