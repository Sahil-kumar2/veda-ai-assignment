import { config } from "../../config/env";
import { logger } from "../../utils/logger";
import { ApiError } from "../../utils/ApiError";
import { PromptMessages } from "./promptBuilder";

export interface LLMResponse {
  raw: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
}

interface GroqChatResponse {
  model: string;
  choices?: Array<{
    message?: { content?: string };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
  };
  error?: {
    message?: string;
  };
}

export const callLLM = async (messages: PromptMessages): Promise<LLMResponse> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  try {
    logger.info(`[LLM:GROQ] Calling model: ${config.groq.model}`);

    const response = await fetch(`${config.groq.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.groq.apiKey}`,
      },
      body: JSON.stringify({
        model: config.groq.model,
        messages: [
          { role: "system", content: messages.system },
          { role: "user", content: messages.user },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      }),
      signal: controller.signal,
    });

    const json = (await response.json()) as GroqChatResponse;

    if (!response.ok) {
      const message = json.error?.message || `Groq request failed (${response.status})`;
      if (response.status === 401) throw new ApiError(401, "Invalid Groq API key");
      if (response.status === 429) throw new ApiError(429, "Groq rate limit exceeded");
      throw new ApiError(502, message);
    }

    const choice = json.choices?.[0];
    const raw = choice?.message?.content?.trim();

    if (!raw) {
      throw new ApiError(502, "Groq returned an empty response");
    }

    logger.info(
      `[LLM:GROQ] Response received ` +
        `tokens: ${json.usage?.prompt_tokens ?? 0} in / ` +
        `${json.usage?.completion_tokens ?? 0} out | ` +
        `finish_reason: ${choice?.finish_reason ?? "unknown"}`
    );

    if (choice?.finish_reason === "length") {
      logger.warn("[LLM:GROQ] Response truncated (finish_reason=length)");
    }

    return {
      raw,
      model: json.model || config.groq.model,
      promptTokens: json.usage?.prompt_tokens ?? 0,
      completionTokens: json.usage?.completion_tokens ?? 0,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;

    if ((error as Error).name === "AbortError") {
      throw new ApiError(504, "Groq request timed out after 60s");
    }

    const err = error as Error;
    throw new ApiError(502, `Groq call failed: ${err.message || String(err)}`);
  } finally {
    clearTimeout(timeout);
  }
};
