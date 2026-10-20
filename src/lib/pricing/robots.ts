export type RobotsRule = {
  allow: boolean;
  pattern: string;
  regex: RegExp;
};

function patternToRegExp(pattern: string): RegExp {
  let source = "";
  for (const char of pattern) {
    if (char === "*") source += ".*";
    else if (char === "$") source += "$";
    else source += char.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(source, "i");
}

export function parseRobots(text: string, userAgent = "*"): RobotsRule[] {
  const lines = text.split(/\r?\n/);
  const groups: { agents: string[]; rules: { allow: boolean; pattern: string }[] }[] = [];
  let current: { agents: string[]; rules: { allow: boolean; pattern: string }[] } | null = null;

  for (const raw of lines) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) continue;
    const match = line.match(/^([a-z-]+)\s*:\s*(.*)$/i);
    if (!match) continue;
    const field = match[1].toLowerCase();
    const value = match[2].trim();
    if (field === "user-agent") {
      if (!current || current.rules.length) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
    } else if ((field === "allow" || field === "disallow") && current) {
      if (!value) continue;
      current.rules.push({ allow: field === "allow", pattern: value });
    }
  }

  const wanted = userAgent.toLowerCase();
  const specific = groups.filter((group) => group.agents.some((agent) => agent !== "*" && wanted.startsWith(agent)));
  const chosen = specific.length ? specific : groups.filter((group) => group.agents.includes("*"));
  const rules: RobotsRule[] = [];
  for (const group of chosen) {
    for (const rule of group.rules) {
      rules.push({ ...rule, regex: patternToRegExp(rule.pattern) });
    }
  }
  return rules;
}

export function pathAllowed(rules: RobotsRule[], pathWithQuery: string): boolean {
  const path = pathWithQuery.startsWith("/") ? pathWithQuery : `/${pathWithQuery}`;
  let winner: RobotsRule | null = null;
  for (const rule of rules) {
    if (!rule.regex.test(path)) continue;
    if (!winner || rule.pattern.length > winner.pattern.length || (rule.pattern.length === winner.pattern.length && rule.allow && !winner.allow)) {
      winner = rule;
    }
  }
  return winner ? winner.allow : true;
}

export function isStoreEnabled(storeId: string): boolean {
  const key = `STORE_${storeId.toUpperCase()}`;
  const value = (process.env[key] ?? "on").trim().toLowerCase();
  return value !== "off" && value !== "0" && value !== "false";
}
