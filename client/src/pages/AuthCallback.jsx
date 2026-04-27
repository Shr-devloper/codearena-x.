import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { setAuthToken } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function AuthCallback() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { loadMe } = useAuth();

  useEffect(() => {
    const token = params.get("token");
    if (token) setAuthToken(token);
    loadMe().then(() => nav("/dashboard", { replace: true }));
  }, [params, nav, loadMe]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-slate-500 text-sm">
      Finishing sign-in…
    </div>
  );
}
