"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LocaleToggle, useI18n } from "@/lib/i18n";
import { sendJson } from "@/lib/client";

export function LoginScreen() {
  const { m } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState("demo@panierrecettes.ca");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await sendJson("/api/auth/login", "POST", { email, password });
      router.push("/");
      router.refresh();
    } catch {
      setError(m.login.error);
    }
  }

  async function demo() {
    await sendJson("/api/auth/demo", "POST");
    router.push("/");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center bg-cream px-5 py-10 md:my-4 md:min-h-[calc(100dvh-2rem)] md:rounded-[28px] md:border md:border-line">
      <div className="mb-8 flex items-center justify-between">
        <p className="font-serif text-2xl">Panier Recettes</p>
        <LocaleToggle />
      </div>
      <h1 className="font-serif text-5xl leading-none">{m.login.title}</h1>
      <p className="mt-3 text-sm text-muted">{m.login.lead}</p>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <label className="block text-sm font-medium">
          {m.login.email}
          <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-2xl border border-line px-3 py-3" />
        </label>
        <label className="block text-sm font-medium">
          {m.login.password}
          <input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-2xl border border-line px-3 py-3" />
        </label>
        {error ? <p className="text-sm text-tomato">{error}</p> : null}
        <button type="submit" className="w-full rounded-full bg-pine py-3 text-sm font-semibold text-cream">
          {m.login.submit}
        </button>
      </form>
      <button type="button" onClick={demo} className="mt-3 w-full rounded-full border border-line py-3 text-sm font-semibold">
        {m.login.demo}
      </button>
      <Link href="/register" className="mt-4 text-center text-sm text-pine">
        {m.login.register}
      </Link>
    </main>
  );
}

export function RegisterScreen() {
  const { m } = useI18n();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await sendJson("/api/auth/register", "POST", { name, email, password });
      router.push("/");
      router.refresh();
    } catch {
      setError(m.register.error);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center bg-cream px-5 py-10 md:my-4 md:rounded-[28px] md:border md:border-line">
      <div className="mb-8 flex items-center justify-between">
        <p className="font-serif text-2xl">Panier Recettes</p>
        <LocaleToggle />
      </div>
      <h1 className="font-serif text-5xl leading-none">{m.register.title}</h1>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <label className="block text-sm font-medium">
          {m.register.name}
          <input required value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-2xl border border-line px-3 py-3" />
        </label>
        <label className="block text-sm font-medium">
          {m.login.email}
          <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-2xl border border-line px-3 py-3" />
        </label>
        <label className="block text-sm font-medium">
          {m.login.password}
          <input type="password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-2xl border border-line px-3 py-3" />
        </label>
        {error ? <p className="text-sm text-tomato">{error}</p> : null}
        <button type="submit" className="w-full rounded-full bg-pine py-3 text-sm font-semibold text-cream">
          {m.register.submit}
        </button>
      </form>
      <Link href="/login" className="mt-4 text-center text-sm text-pine">
        {m.login.signin}
      </Link>
    </main>
  );
}
