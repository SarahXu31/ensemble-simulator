// 改动3：通用 OpenAI 兼容 LLM 适配器（不绑定任何厂商，可对接任意 OpenAI 格式服务）。
// 配置存 localStorage（key: fengmo_llm_config），供「最近发生」古风总结调用。

export type LLMConfig = {
  baseURL: string;
  apiKey: string;
  model: string;
};

export const LLM_CONFIG_KEY = 'fengmo_llm_config';

export const DEFAULT_LLM_CONFIG: LLMConfig = {
  baseURL: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4o-mini',
};

export function readLLMConfig(): LLMConfig {
  try {
    const raw = localStorage.getItem(LLM_CONFIG_KEY);
    if (!raw) return { ...DEFAULT_LLM_CONFIG };
    const parsed = JSON.parse(raw);
    return {
      baseURL: parsed.baseURL || DEFAULT_LLM_CONFIG.baseURL,
      apiKey: parsed.apiKey || '',
      model: parsed.model || DEFAULT_LLM_CONFIG.model,
    };
  } catch {
    return { ...DEFAULT_LLM_CONFIG };
  }
}

export function writeLLMConfig(config: LLMConfig): void {
  try {
    localStorage.setItem(LLM_CONFIG_KEY, JSON.stringify(config));
  } catch {
    /* ignore */
  }
}

export function hasLLMApiKey(): boolean {
  return !!readLLMConfig().apiKey.trim();
}

// 通用适配器：任意 OpenAI 兼容的 /chat/completions 接口。
export class SummaryLLMAdapter {
  private config: LLMConfig;

  constructor(config?: LLMConfig) {
    this.config = config ?? readLLMConfig();
  }

  async complete(prompt: string): Promise<string> {
    const base = this.config.baseURL.replace(/\/+$/, '');
    const url = `${base}/chat/completions`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.8,
      }),
    });
    if (!resp.ok) {
      const detail = await resp.text().catch(() => '');
      throw new Error(`LLM 请求失败（${resp.status}）：${detail.slice(0, 200)}`);
    }
    const data = await resp.json();
    return (data?.choices?.[0]?.message?.content ?? '').trim();
  }
}
