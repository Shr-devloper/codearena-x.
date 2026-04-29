import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { setAuthToken, authDebug } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function AuthCallback() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { loadMe } = useAuth();
  const [message, setMessage] = useState("Finishing sign-in…");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const token = params.get("token");
      if (!token) {
        authDebug("OAuth callback: missing token");
        nav("/login?error=oauth&message=missing_token", { replace: true });
        return;
      }

      setAuthToken(token);
      authDebug("OAuth callback: token applied, fetching /auth/me");

      const { user } = await loadMe();
      if (cancelled) return;

      if (user) {
        authDebug("OAuth callback: success, redirecting to dashboard");
        nav("/dashboard", { replace: true });
        return;
      }

      setMessage("Could not verify your session.");
      authDebug("OAuth callback: /me returned no user");
      setTimeout(() => {
        if (!cancelled) nav("/login?error=session", { replace: true });
      }, 1200);
    })();

    return () => {
      cancelled = true;
    };
  }, [params, nav, loadMe]);

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-500">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" aria-hidden />
      <p className="text-sm">{message}</p>
    </div>
  );
}
