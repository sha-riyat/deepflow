'use client';
// Panneaux à haute fréquence (DOM à 4 Hz, trades à 10 Hz) : rendus par des widgets impératifs
// pour ne pas solliciter React à chaque mise à jour.
import { useEffect, useRef } from 'react';
import { DomView } from '@/lib/widgets/dom.js';
import { TapeView } from '@/lib/widgets/tape.js';
import { engine, getData } from '@/lib/engine';

export function DomPanel() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const view = new DomView(ref.current);
    engine.dom = view;
    return () => {
      if (engine.dom === view) engine.dom = null;
      view.destroy();
    };
  }, []);
  return <div className="pane-body fill" ref={ref} />;
}

export function TapePanel() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const view = new TapeView(ref.current);
    engine.tape = view;
    const id = setInterval(() => view.setBigThreshold(getData().bubbles.threshold), 2000);
    return () => {
      clearInterval(id);
      if (engine.tape === view) engine.tape = null;
    };
  }, []);
  return <div className="pane-body fill" ref={ref} />;
}
