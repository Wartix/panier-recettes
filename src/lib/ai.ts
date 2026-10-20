export function getAiConfig() {
  const apiKey = process.env.RECEIPT_AI_API_KEY?.trim() ?? "";
  const baseUrl = (process.env.RECEIPT_AI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.RECEIPT_AI_MODEL?.trim() || "gpt-4o-mini";
  return { apiKey, baseUrl, model, enabled: apiKey.length > 0 };
}

function extractJson(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return trimmed;
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1);
  return trimmed;
}

export async function completeJson(options: { system: string; user: string }): Promise<unknown> {
  const { apiKey, baseUrl, model } = getAiConfig();
  if (!apiKey) throw new Error("ai_unconfigured");
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: options.system },
        { role: "user", content: options.user },
      ],
    }),
  });
  if (!response.ok) throw new Error(`ai_failed_${response.status}`);
  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) throw new Error("ai_empty");
  return JSON.parse(extractJson(raw)) as unknown;
}
