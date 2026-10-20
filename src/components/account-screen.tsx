"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendJson } from "@/lib/client";
import { useI18n } from "@/lib/i18n";

export function AccountScreen({ name, email, postalCode }: { name: string; email: string; postalCode: string }) {
  const { m } = useI18n();
  const router = useRouter();
  const [postal, setPostal] = useState(postalCode);
  const [note, setNote] = useState("");

  async function save(event: React.FormEvent) {
    event.preventDefault();
    await sendJson("/api/account", "POST", { postalCode: postal });
    setNote(m.account.saved);
    router.refresh();
  }

  async function logout() {
    await sendJson("/api/auth/logout", "POST");
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <h1 className="font-serif text-4xl">{m.account.title}</h1>
      <p className="text-sm text-muted">
        {name} · {email}
      </p>
      <form onSubmit={save} className="space-y-3">
        <label className="block text-sm font-medium">
          {m.account.postal}
          <input value={postal} onChange={(event) => setPostal(event.target.value)} className="mt-1 w-full rounded-2xl border border-line px-3 py-3" />
        </label>
        <button type="submit" className="w-full rounded-full bg-pine py-3 text-sm font-semibold text-cream">
          {m.account.save}
        </button>
      </form>
      {note ? <p className="text-sm text-pine">{note}</p> : null}
      <button type="button" onClick={logout} className="text-sm text-muted">
        {m.account.logout}
      </button>
    </div>
  );
}
