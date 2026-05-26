"use client";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useRef } from "react";

function TwoFAForm() {
  const params = useSearchParams();
  const router = useRouter();
  const userId = params.get("userId") || "";
  const [codes, setCodes] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  function handleChange(i: number, val: string) {
    if (!/^\d?$/.test(val)) return;
    const next = [...codes];
    next[i] = val;
    setCodes(next);
    if (val && i < 5) inputs.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !codes[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      setCodes(text.split(""));
      inputs.current[5]?.focus();
    }
  }

  async function handleSubmit() {
    const code = codes.join("");
    if (code.length !== 6) return setError("Enter all 6 digits");
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid code");
        setCodes(["", "", "", "", "", ""]);
        inputs.current[0]?.focus();
        return;
      }
      const roleMap: Record<string, string> = {
        super_admin: "/super-admin",
        admin: "/admin",
        teacher: "/teacher",
        student: "/student",
        parent: "/parent",
      };
      router.push(roleMap[data.role] || "/auth/login");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔒</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Two-Factor Auth</h1>
          <p className="text-gray-500 mt-2 text-sm">
            Open Google Authenticator and enter your 6-digit code
          </p>
        </div>

        <div className="flex gap-3 justify-center mb-6" onPaste={handlePaste}>
          {codes.map((c, i) => (
            <input
              key={i}
              ref={el => { inputs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={c}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors"
            />
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4 text-center">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Verify Code"}
        </button>

        <p className="text-center text-xs text-gray-400 mt-4">
          Code refreshes every 30 seconds
        </p>
      </div>
    </div>
  );
}

export default function Verify2FAPage() {
  return (
    <Suspense>
      <TwoFAForm />
    </Suspense>
  );
}