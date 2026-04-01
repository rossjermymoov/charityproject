"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function MobileLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        router.push("/mobile");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Invalid email or password");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-indigo-600 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-4">
            <span className="text-2xl font-bold text-indigo-600">CO</span>
          </div>
          <h1 className="text-2xl font-bold text-white">CharityOS</h1>
          <p className="text-indigo-200 mt-1">Sign in to continue</p>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/20 border border-red-400/30 text-white text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <div>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent text-base"
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent text-base"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 active:bg-indigo-100 disabled:opacity-50 transition-colors text-base"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-indigo-200 text-center text-sm mt-6">
          Demo: admin@charity.org / password
        </p>
      </div>
    </div>
  );
}
