"use client";

export default function ContactError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-2xl mx-auto py-12 text-center">
      <h2 className="text-xl font-bold text-red-600 mb-4">Error loading contact</h2>
      <pre className="text-left bg-gray-100 p-4 rounded text-sm overflow-auto mb-4 max-h-96">
        {error.message}
        {error.digest && `\nDigest: ${error.digest}`}
        {error.stack && `\n\n${error.stack}`}
      </pre>
      <button
        onClick={reset}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Try Again
      </button>
    </div>
  );
}
