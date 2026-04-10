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
    <div className="min-h-[100dvh] bg-indigo-600 flex flex-col items-center justify-center px-8">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-3xl mb-5 shadow-lg">
            <span className="text-3xl font-bold text-indigo-600">TC</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Tin Collections</h1>
          <p className="text-indigo-200 mt-2 text-lg">Parity CRM</p>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-500/20 border border-red-400/30 text-white text-base rounded-xl px-5 py-4">
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
              className="w-full px-5 py-4 bg-white/10 border-2 border-white/20 rounded-xl text-white text-lg placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-5 py-4 bg-white/10 border-2 border-white/20 rounded-xl text-white text-lg placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4.5 bg-white text-indigo-600 font-bold rounded-xl active:bg-indigo-50 disabled:opacity-50 transition-colors text-xl shadow-lg"
            style={{ paddingTop: "1.125rem", paddingBottom: "1.125rem" }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-indigo-200 text-center text-base mt-8">
          Demo: admin@charity.org / password
        </p>
      </div>
    </div>
  );
}
