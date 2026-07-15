"use client";

import { useState } from "react";

export function AdminLogoutButton() {
  const [submitting, setSubmitting] = useState(false);

  async function signOut() {
    if (submitting) return;
    setSubmitting(true);

    try {
      await fetch("/api/admin/session", { method: "DELETE" });
    } finally {
      window.location.assign("/admin/login");
    }
  }

  return (
    <button className="admin-logout" disabled={submitting} onClick={signOut} type="button">
      {submitting ? "Cerrando..." : "Cerrar sesión"}
    </button>
  );
}
