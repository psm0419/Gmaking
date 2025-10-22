import React, { useEffect, useState } from "react";

const base = "/images/assistant";
const frames = [
  "/images/character/idle1.png",
  "/images/character/idle2.png",
  "/images/character/idle3.png",
  "/images/character/idle4.png",
];

export default function CharacterIdleAnimation({ size = 256 }) {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    let blinkTimer;
    let loopTimer;

    const playIdleLoop = () => {
      let sequence = [0, 1, 0]; // 기본 루프
      let i = 0;
      loopTimer = setInterval(() => {
        setFrameIndex(sequence[i]);
        i = (i + 1) % sequence.length;
      }, 400); // 속도 조절 (느리게 하려면 600~800)
    };

    const playBlink = () => {
      const blinkSeq = [1, 2, 3, 1];
      let i = 0;
      const blinkInterval = setInterval(() => {
        setFrameIndex(blinkSeq[i]);
        i++;
        if (i >= blinkSeq.length) clearInterval(blinkInterval);
      }, 120);
    };

    playIdleLoop();

    // 3~6초마다 한 번씩 눈깜빡임 발생
    blinkTimer = setInterval(() => {
      playBlink();
    }, Math.random() * 3000 + 3000);

    return () => {
      clearInterval(blinkTimer);
      clearInterval(loopTimer);
    };
  }, []);

  return (
    <img
      src={frames[frameIndex]}
      alt="idle robot"
      width={size}
      height={size}
      className="select-none pointer-events-none"
      draggable={false}
    />
  );
}
