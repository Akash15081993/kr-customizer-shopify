"use client"
import dynamic from 'next/dynamic';

const Next13ProgressBar = dynamic(() => import('next13-progressbar'),{ ssr: false });

export default function NextProgressBar() {
  return (
    <Next13ProgressBar
      height="2px"
      color="#3c64f4"
      options={{ showSpinner: false }}
      showOnShallow={true}
    />
  );
}