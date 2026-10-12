// Netlify Function: forwards feedback to Discord.
// Set Netlify environment variable `webhook` to your Discord webhook URL.
// Keep the URL out of index.html and out of public source control.

const ALLOWED_TYPES = new Set([
  "General message", "Suggestion", "Bug report", "Feedback"
]);

exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store"
  };
  const reply = (statusCode, body) => ({
    statusCode, headers, body: JSON.stringify(body)
  });

  if (event.httpMethod !== "POST") {
    return reply(405, { error: "Method not allowed." });
  }

  const origin = event.headers?.origin;
  const host = event.headers?.host;
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) {
        return reply(403, { error: "Request origin not allowed." });
      }
    } catch {
      return reply(403, { error: "Invalid request origin." });
    }
  }

  let data;
  try {
    data = JSON.parse(event.body || "{}");
  } catch {
    return reply(400, { error: "Invalid request body." });
  }

  // Honeypot: bots that fill this hidden field are not forwarded.
  if (typeof data.website === "string" && data.website.trim()) {
    return reply(200, { ok: true });
  }

  const type = typeof data.type === "string" && ALLOWED_TYPES.has(data.type)
    ? data.type : "General message";
  const message = typeof data.message === "string" ? data.message.trim() : "";
  const contact = typeof data.contact === "string" ? data.contact.trim() : "";

  if (!message) return reply(400, { error: "Please enter a message." });
  if (message.length > 4000) return reply(400, { error: "Message is too long." });
  if (contact.length > 120) return reply(400, { error: "Contact field is too long." });

  const webhook = process.env.webhook;
  if (!webhook) {
    console.error("Missing Netlify environment variable: webhook");
    return reply(500, { error: "Feedback is not configured yet." });
  }

  const safe = value => value.replace(/@/g, "@\u200b").replace(/```/g, "[code]");
  const discordMessage = {
    username: "Meta Clip! Feedback",
    allowed_mentions: { parse: [] },
    embeds: [{
      title: `New ${type}`,
      color: type === "Bug report" ? 0xE05A47 : 0xB5E61D,
      description: safe(message),
      fields: contact ? [{
        name: "Reply contact (optional)",
        value: safe(contact),
        inline: false
      }] : [],
      footer: { text: "Meta Clip! website feedback" },
      timestamp: new Date().toISOString()
    }]
  };

  try {
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(discordMessage)
    });
    if (!response.ok) {
      console.error("Discord webhook returned status", response.status);
      return reply(502, { error: "Discord could not accept the message right now." });
    }
    return reply(200, { ok: true });
  } catch {
    console.error("Failed to forward feedback to Discord.");
    return reply(502, { error: "Could not deliver the message right now." });
  }
};
