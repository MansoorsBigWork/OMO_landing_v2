/* Product analytics. Events go to PostHog when its snippet is present on
   the page; otherwise they are dropped silently so the app never depends
   on the tracker being loaded. */

interface PostHogLike {
  capture: (event: string, properties?: Record<string, unknown>) => void;
}

export function capture(event: string, properties?: Record<string, unknown>): void {
  const ph = (window as { posthog?: PostHogLike }).posthog;
  ph?.capture(event, properties);
}
