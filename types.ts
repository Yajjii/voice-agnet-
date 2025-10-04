
export enum AgentState {
  IDLE = 'IDLE',
  LISTENING = 'LISTENING',
  THINKING = 'THINKING',
  SPEAKING = 'SPEAKING',
  ERROR = 'ERROR',
}

export enum Speaker {
  USER = 'USER',
  AGENT = 'AGENT',
}

export interface Message {
  speaker: Speaker;
  text: string;
  isFinal: boolean;
}
