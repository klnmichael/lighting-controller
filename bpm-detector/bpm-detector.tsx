import React, { useState } from 'react';
import { createRealTimeBpmProcessor, getBiquadFilter } from 'realtime-bpm-analyzer';

const LiveBpmTracker = () => {
  const [bpm, setBpm] = useState<number | null>(null);
  const [stableBpm, setStableBpm] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);

  const startTracking = async () => {
    try {
      const audioContext = new AudioContext();

      const realtimeAnalyzerNode = await createRealTimeBpmProcessor(audioContext, {
        continuousAnalysis: true,
        stabilizationTime: 20000,
      });

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioContext.createMediaStreamSource(stream);
      const lowpass = getBiquadFilter(audioContext);
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(150, audioContext.currentTime);

      source.connect(lowpass).connect(realtimeAnalyzerNode);
      source.connect(audioContext.destination); // OPTIONAL: Hear yourself


      realtimeAnalyzerNode.port.onmessage = (event: MessageEvent) => {
        if (event.data.message === 'BPM') {
          setBpm(event.data.data.bpm);
        }
        if (event.data.message === 'BPM_STABLE') {
          setStableBpm(event.data.data.bpm);
        }
      };

      setStarted(true);
    } catch (err) {
      console.error('Mic setup failed:', err);
      setError('Microphone access denied or setup error');
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '1rem' }}>
      <h2>Live BPM Tracker</h2>
      {!started && (
        <button onClick={startTracking}>Start Listening</button>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {started && (
        <>
          <p>Current BPM: {typeof bpm === 'number' ? bpm.toFixed(2) : 'Listening...'}</p>
          <p>Stable BPM: {typeof stableBpm === 'number' ? stableBpm.toFixed(2) : 'Waiting for stability...'}</p>
        </>
      )}
    </div>
  );
};

export default LiveBpmTracker;
