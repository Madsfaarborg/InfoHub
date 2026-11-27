"use client";
import Link from "next/link";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="not-found"><h1>The guide couldn’t load.</h1><p>Try again in a moment. Your task hasn’t been sent anywhere.</p><div className="recovery-actions"><button className="button button-dark" onClick={reset}>Try again</button><Link className="text-button" href="/">Home</Link></div></div>;
}
