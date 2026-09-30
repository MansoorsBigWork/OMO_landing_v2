import { useState } from "react";

/* Glossary flashcard. Structure restyled from the 21st.dev Tilt Flip
   Card starting point: a 3D rotate on Y over 400ms; under reduced motion
   the faces cross-fade instead. The decorative tilt was not kept. */

interface FlashcardProps {
  front: string;
  back: string;
}

export default function Flashcard({ front, back }: FlashcardProps) {
  const [flipped, setFlipped] = useState(false);

  return (
    <button
      type="button"
      className="flashcard"
      aria-pressed={flipped}
      onClick={() => setFlipped((v) => !v)}
    >
      <span className={`flashcard-inner${flipped ? " is-flipped" : ""}`}>
        <span className="flashcard-face flashcard-front">{front}</span>
        <span className="flashcard-face flashcard-back">
          <span className="flashcard-term">{front}</span>
          {back}
        </span>
      </span>
    </button>
  );
}
