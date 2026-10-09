// Double bip discret pour les alertes et les nouveaux signaux.
let ctx: AudioContext | null = null;

export function beep(): void {
  try {
    ctx ??= new AudioContext();
    [660, 990].forEach((freq, i) => {
      const o = ctx!.createOscillator();
      const g = ctx!.createGain();
      o.frequency.value = freq;
      g.gain.value = 0.12;
      o.connect(g).connect(ctx!.destination);
      o.start(ctx!.currentTime + i * 0.16);
      o.stop(ctx!.currentTime + i * 0.16 + 0.13);
    });
  } catch {
    // audio indisponible (pas encore d'interaction utilisateur) : alerte visuelle seulement
  }
}
