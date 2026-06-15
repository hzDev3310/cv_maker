export const AI_PROVIDERS = {
  groq: {
    id: "groq",
    label: "Groq",
    storageKey: "cv-builder-groq-key",
    defaultModel: "llama-3.3-70b-versatile",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    authHeader: "Authorization",
    createKeyUrl: "https://console.groq.com/keys",
    docsUrl: "https://console.groq.com/docs/models",
    apiKeyPlaceholder: "gsk_...",
    description: "Fast OpenAI-compatible models from Groq.",
    models: [
      {
        id: "llama-3.1-8b-instant",
        label: "Llama 3.1 8B Instant",
        description: "Fast, lightweight model for quick edits.",
      },
      {
        id: "llama-3.3-70b-versatile",
        label: "Llama 3.3 70B Versatile",
        description: "Balanced general-purpose model.",
      },
      {
        id: "openai/gpt-oss-20b",
        label: "GPT-OSS 20B",
        description: "Smaller reasoning-focused model.",
      },
    ],
  },
  gemini: {
    id: "gemini",
    label: "Gemini",
    storageKey: "cv-builder-gemini-key",
    defaultModel: "gemini-3.5-flash",
    endpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    authHeader: "Authorization",
    createKeyUrl: "https://aistudio.google.com/app/apikey",
    docsUrl: "https://ai.google.dev/gemini-api/docs/models",
    apiKeyPlaceholder: "AIza...",
    description: "Free-tier Gemini models through Google AI Studio.",
    models: [
      {
        id: "gemini-3.5-flash",
        label: "Gemini 3.5 Flash",
        description: "High-quality free-tier model for general use.",
        freeTier: true,
      },
      {
        id: "gemini-3.1-flash-lite",
        label: "Gemini 3.1 Flash-Lite",
        description: "Low-latency, cost-sensitive free-tier model.",
        freeTier: true,
      },
      {
        id: "gemini-2.5-flash",
        label: "Gemini 2.5 Flash",
        description: "Hybrid reasoning model with a free tier.",
        freeTier: true,
      },
      {
        id: "gemini-2.5-flash-lite",
        label: "Gemini 2.5 Flash-Lite",
        description: "Small, efficient free-tier model.",
        freeTier: true,
      },
    ],
  },
};

export function listProviders() {
  return Object.values(AI_PROVIDERS);
}

export function getProvider(providerId) {
  return AI_PROVIDERS[providerId] || AI_PROVIDERS.groq;
}

