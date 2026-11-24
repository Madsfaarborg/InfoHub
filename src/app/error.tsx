"use client";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="not-found"><h1>The guide couldn’t load.</h1><p>Try again in a moment. Your task hasn’t been sent anywhere.</p><button className="button button-dark" onClick={reset}>Try again</button></div>;
}
