'use client';
// L'espace de travail dépend du navigateur (canvas, WebGL, flux SSE, stockage local) :
// il est rendu uniquement côté client.
import dynamic from 'next/dynamic';

const Workspace = dynamic(() => import('@/components/Workspace'), { ssr: false });

export default function Page() {
  return <Workspace />;
}
