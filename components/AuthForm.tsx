"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";
import { useToast } from "./Toast";
import Logo from "./Logo";

export default function AuthForm() {
  const toast = useToast();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sb = supabaseBrowser();
    if (!sb) return toast("Supabase не підключено — перевір .env.local");
    if (mode === "signup" && !/^[a-z0-9_]{3,20}$/i.test(username)) {
      return toast("Нік: 3–20 латинських літер, цифр або _");
    }
    if (password.length < 6) return toast("Пароль — мінімум 6 символів");

    setBusy(true);
    if (mode === "signup") {
      const { data, error } = await sb.auth.signUp({ email, password, options: { data: { username } } });
      if (error) toast(error.message);
      else if (!data.session) toast("Перевір пошту і підтверди акаунт");
      else toast("Ласкаво просимо в SHO ZA MEM!");
    } else {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) toast("Невірна пошта або пароль");
    }
    setBusy(false);
  };

  return (
    <form className="screen" onSubmit={submit} style={{ justifyContent: "center" }}>
      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
        <Logo size={28} />
        <p className="muted" style={{ margin: 0 }}>
          {mode === "signup" ? "Створи акаунт, щоб додавати й зберігати меми" : "З поверненням!"}
        </p>
      </div>

      <div className="segmented" style={{ gridTemplateColumns: "1fr 1fr" }} role="group" aria-label="Вхід або реєстрація">
        <button type="button" aria-pressed={mode === "signup"} onClick={() => setMode("signup")}>Реєстрація</button>
        <button type="button" aria-pressed={mode === "login"} onClick={() => setMode("login")}>Вхід</button>
      </div>

      {mode === "signup" && (
        <label className="field">
          <span>Нік</span>
          <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="memolog_2026" autoComplete="username" />
        </label>
      )}
      <label className="field">
        <span>Пошта</span>
        <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ти@gmail.com" autoComplete="email" />
      </label>
      <label className="field">
        <span>Пароль</span>
        <input
          className="input"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="мінімум 6 символів"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
        />
      </label>

      <button type="submit" className="btn btn-yellow btn-block" disabled={busy}>
        {busy ? "Зачекай..." : mode === "signup" ? "Створити акаунт" : "Увійти"}
      </button>
    </form>
  );
}
