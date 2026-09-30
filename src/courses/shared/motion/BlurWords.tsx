/* Word-cascade heading, ported from react-bits BlurText (reactbits.dev)
   as a dependency-free CSS port restyled to the slideshow's motion
   grammar: each word rises out of a soft blur in sequence. The full text
   stays available to assistive tech; the spans are presentation only. */

interface BlurWordsProps {
  text: string;
  className?: string;
  /* Reveal pace in ms: delay before the first word, gap between words,
     and each word's rise. The defaults are the slideshow's cadence. */
  baseDelay?: number;
  stagger?: number;
  durationMs?: number;
}

export default function BlurWords({ text, className, baseDelay = 120, stagger = 45, durationMs }: BlurWordsProps) {
  const words = text.split(" ");
  return (
    <span className={className} aria-label={text} role="text">
      {words.map((word, i) => (
        <span key={`${word}-${i}`} className="blur-word-wrap" aria-hidden="true">
          <span
            className="blur-word"
            style={{
              animationDelay: `${baseDelay + i * stagger}ms`,
              ...(durationMs ? { animationDuration: `${durationMs}ms` } : {}),
            }}
          >
            {word}
          </span>
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}
