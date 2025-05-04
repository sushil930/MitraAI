
import React from 'react';
import { Mic, MicOff, LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type AnimationState = 'idle' | 'listening' | 'processing' | 'speaking';

interface AnimatedResponseProps {
  state: AnimationState;
}

const AnimatedResponse: React.FC<AnimatedResponseProps> = ({ state }) => {
  return (
    <div className="flex flex-col items-center justify-center my-6 py-4">
      <div className={cn(
        "relative w-24 h-24 rounded-full assistant-gradient-bg flex items-center justify-center transition-all duration-300",
        state === 'listening' && "animate-pulse",
        state === 'processing' && "bg-assistant-cyan",
        state === 'speaking' && "scale-110"
      )}>
        {state === 'idle' && (
          <Mic className="h-10 w-10 text-white" />
        )}
        {state === 'listening' && (
          <div className="relative">
            <Mic className="h-10 w-10 text-white animate-pulse" />
            <div className="absolute -inset-4 border-4 border-white/30 rounded-full animate-ping" />
          </div>
        )}
        {state === 'processing' && (
          <LoaderCircle className="h-10 w-10 text-white animate-spin" />
        )}
        {state === 'speaking' && (
          <div className="flex flex-col items-center">
            <div className="flex space-x-1">
              {[...Array(5)].map((_, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "bg-white w-1.5 rounded-full",
                    "animate-[pulse_0.8s_ease-in-out_infinite]",
                    i % 2 === 0 ? "h-4" : "h-7",
                    `delay-[${i * 100}ms]`
                  )}
                  style={{
                    animationDelay: `${i * 0.1}s`
                  }}
                />
              ))}
            </div>
            <span className="text-xs text-white mt-1">Speaking</span>
          </div>
        )}
      </div>
      
      <div className="mt-4 text-center">
        {state === 'idle' && (
          <p className="text-muted-foreground">Tap to speak</p>
        )}
        {state === 'listening' && (
          <p className="text-muted-foreground animate-pulse">Listening...</p>
        )}
        {state === 'processing' && (
          <p className="text-muted-foreground">Processing your query...</p>
        )}
        {state === 'speaking' && (
          <p className="text-muted-foreground">AI is responding...</p>
        )}
      </div>
    </div>
  );
};

export default AnimatedResponse;
