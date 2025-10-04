import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality } from '@google/genai';
import { AgentState, Message, Speaker } from '../types';
import { decode, decodeAudioData, createBlob } from '../utils/audioUtils';

const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;
const SCRIPT_PROCESSOR_BUFFER_SIZE = 4096;

export const useVoiceAgent = () => {
  const [agentState, setAgentState] = useState<AgentState>(AgentState.IDLE);
  const [transcript, setTranscript] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);

  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  const outputAudioSources = useRef(new Set<AudioBufferSourceNode>()).current;
  const nextStartTimeRef = useRef<number>(0);

  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');

  const stopAgent = useCallback(async () => {
    console.log('Stopping agent...');
    setAgentState(AgentState.IDLE);

    if (sessionPromiseRef.current) {
      const session = await sessionPromiseRef.current;
      session.close();
      sessionPromiseRef.current = null;
    }
    
    if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
    }

    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if(mediaStreamSourceRef.current) {
      mediaStreamSourceRef.current.disconnect();
      mediaStreamSourceRef.current = null;
    }
    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
      await inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }

    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
      outputAudioSources.forEach(source => source.stop());
      outputAudioSources.clear();
      await outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }

    setTranscript(prev => prev.map(msg => ({ ...msg, isFinal: true })));

  }, [outputAudioSources]);

  useEffect(() => {
    return () => {
        // Ensure cleanup on unmount
        stopAgent();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleServerMessage = useCallback(async (message: LiveServerMessage) => {
    if (message.serverContent?.inputTranscription) {
      setAgentState(AgentState.THINKING);
      const text = message.serverContent.inputTranscription.text;
      const isFinal = message.serverContent.inputTranscription.isFinal;
      currentInputTranscriptionRef.current += text;
      
      setTranscript(prev => {
        const last = prev[prev.length - 1];
        if (last && last.speaker === Speaker.USER && !last.isFinal) {
          const updated = [...prev];
          updated[prev.length - 1] = { ...last, text: currentInputTranscriptionRef.current, isFinal };
          return updated;
        }
        return [...prev, { speaker: Speaker.USER, text: currentInputTranscriptionRef.current, isFinal }];
      });
      if(isFinal) {
        currentInputTranscriptionRef.current = "";
      }
    } else if (message.serverContent?.outputTranscription) {
        setAgentState(AgentState.SPEAKING);
        const text = message.serverContent.outputTranscription.text;
        const isFinal = message.serverContent.outputTranscription.isFinal;
        currentOutputTranscriptionRef.current += text;
        
        setTranscript(prev => {
            const last = prev[prev.length - 1];
            if (last && last.speaker === Speaker.AGENT && !last.isFinal) {
                const updated = [...prev];
                updated[prev.length - 1] = { ...last, text: currentOutputTranscriptionRef.current, isFinal };
                return updated;
            }
            return [...prev, { speaker: Speaker.AGENT, text: currentOutputTranscriptionRef.current, isFinal: false }];
        });
        if(isFinal) {
            currentOutputTranscriptionRef.current = "";
        }
    }

    if (message.serverContent?.turnComplete) {
      setAgentState(AgentState.LISTENING);
    }

    const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
    if (audioData) {
        if (!outputAudioContextRef.current) return;
        setAgentState(AgentState.SPEAKING);
        const decodedAudio = decode(audioData);
        const audioBuffer = await decodeAudioData(decodedAudio, outputAudioContextRef.current, OUTPUT_SAMPLE_RATE, 1);
        
        const source = outputAudioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(outputAudioContextRef.current.destination);

        const currentTime = outputAudioContextRef.current.currentTime;
        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, currentTime);

        source.start(nextStartTimeRef.current);
        nextStartTimeRef.current += audioBuffer.duration;
        outputAudioSources.add(source);
        source.onended = () => {
            outputAudioSources.delete(source);
        };
    }
  }, [outputAudioSources]);


  const startAgent = useCallback(async () => {
    if (agentState !== AgentState.IDLE) return;
    setError(null);
    setTranscript([]);

    try {
      setAgentState(AgentState.LISTENING);
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Fix: Cast window to `any` to access `webkitAudioContext` for older browser compatibility.
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: INPUT_SAMPLE_RATE });
      // Fix: Cast window to `any` to access `webkitAudioContext` for older browser compatibility.
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: OUTPUT_SAMPLE_RATE });
      nextStartTimeRef.current = 0;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log('Session opened.');
            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            mediaStreamSourceRef.current = source;

            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(SCRIPT_PROCESSOR_BUFFER_SIZE, 1, 1);
            scriptProcessorRef.current = scriptProcessor;
            
            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromiseRef.current?.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: handleServerMessage,
          onerror: (e: ErrorEvent) => {
            console.error('Session error:', e);
            setError(`An error occurred: ${e.message}`);
            stopAgent();
          },
          onclose: (e: CloseEvent) => {
            console.log('Session closed.');
            stopAgent();
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: 'You are a friendly and helpful conversational AI assistant. Keep your responses concise and to the point.',
        },
      });

    } catch (err) {
      console.error('Failed to start agent:', err);
      setError('Could not access microphone. Please grant permission and try again.');
      setAgentState(AgentState.ERROR);
      await stopAgent();
    }
  }, [agentState, handleServerMessage, stopAgent]);

  const toggleAgent = () => {
    if (agentState === AgentState.IDLE || agentState === AgentState.ERROR) {
      startAgent();
    } else {
      stopAgent();
    }
  };

  return { agentState, transcript, error, toggleAgent };
};