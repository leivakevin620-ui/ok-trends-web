"use client";

import { useState } from "react";

export function AdminLoginForm({ configured }: Readonly<{ configured: boolean }>) {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured || status === "submitting") return;

    setStatus("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const payload = (await response.json()) as { message?: string; redirectTo?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "No fue posible iniciar sesión.");
      }

      window.location.assign(payload.redirectTo ?? "/admin");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Error inesperado.");
    }
  }

  return (
    <form className="admin-login-form" onSubmit={handleSubmit}>
      <label>
        Clave administrativa
        <input
          autoComplete="current-password"
          disabled={!configured || status === "submitting"}
          maxLength={256}
          minLength={12}
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </label>

      {message ? <p className="admin-form-error" role="alert">{message}</p> : null}

      <button className="admin-login-button" disabled={!configured || status === "submitting"} type="submit">
        {!configured
          ? "Configuración requerida"
          : status === "submitting"
            ? "Verificando..."
            : "Entrar al panel"}
      </button>
    </form>
  );
}
