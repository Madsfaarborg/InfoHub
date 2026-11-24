# Starter catalog provenance

Checked 24 November 2026. The public seed is `src/content/starter.json`, revision `starter-2026-11-24`.

Provider sources verify identifiers, controls, access routes and prices. All category fit, tier assignments, examples, escalation advice and descriptions are editorial starting points for local evaluation. They are not independent benchmarks or team measurements. Hosted availability means documented provider access, subject to account, region and entitlement; it does not mean organizational approval.

## Primary sources

- [OpenAI model catalog](https://developers.openai.com/api/docs/models): exact public IDs and reasoning enums. Sol and Astra support low, medium, high, xhigh and max; Terra also supports none. Runtime execution names were not used as evidence.
- [GPT-6.1 Terra](https://developers.openai.com/api/docs/models/gpt-6.1-terra): USD per million input/cached-input/output tokens of $1/$0.05/$5.
- [GPT-6.2 Sol](https://developers.openai.com/api/docs/models/gpt-6.2-sol): $2/$0.10/$10 on the same basis.
- [GPT-6.2 Astra](https://developers.openai.com/api/docs/models/gpt-6.2-astra): $8/$0.40/$40 on the same basis.
- [OpenAI reasoning guide](https://developers.openai.com/api/docs/guides/reasoning): effort is provider-specific; reasoning tokens are billed as output. Higher effort can increase time and token usage. This does not establish a measured improvement for our tasks.
- [Claude Sonnet 5.5](https://platform.claude.com/docs/en/models/sonnet-5-5/overview): exact ID `claude-sonnet-5-5`, USD per million input/cache-read/output of $2/$0.10/$10. Five-minute cache writes cost $2.50 and one-hour writes $4 per million.
- [Claude effort controls](https://platform.claude.com/docs/en/build-with-claude/effort): `output_config.effort` and adaptive thinking. Sonnet supports low, medium, high, xhigh and max. Medium/high seed entries use `thinking.type=adaptive`. Sampling temperature/top_p/top_k must not be set on this model.
- [Official Qwen3-30B-A3B model card](https://huggingface.co/Qwen/Qwen3-30B-A3B): exact repository, tokenizer `enable_thinking` switch, and mode-specific sampling defaults. Thinking: temperature 0.6, top_p 0.95, top_k 20, min_p 0. Non-thinking: temperature 0.7, top_p 0.8, top_k 20, min_p 0. Native context is 32,768; extended context requires separate configuration.
- [Alibaba Cloud Model Studio regional pricing](https://www.alibabacloud.com/help/en/model-studio/model-pricing): exact `qwen3.7-max-2026-05-17`, Singapore service region / International deployment, thinking-only, input range 0 < tokens <= 1M, original pay-as-you-go USD/1M input/output $2.50/$7.50. Output includes thinking and response. No cached rate or adjustable effort is claimed for this entry.

OpenAI rates are Standard short-context rates for requests with at most 272K input tokens. Above that threshold input and cache rates double and output rates rise to 1.5 times for the entire request. Cache writes, separately billed tools, retries, processing tiers and region premiums are outside the basic calculator. Thirty-minute writes per million cost $1.25 Terra, $2.50 Sol and $10 Astra; longer retention differs. Cached input must not be treated as a cache write.

Local Qwen is setup-required, with no tool destination and unknown costs. Pin revision, quantization/precision, hardware, serving engine/version, context and concurrency before promoting it to available. Unknown infrastructure cost is not zero. Its exact settings here refer to Transformers tokenizer templates, not an assumed universal API parameter.

## News and comparison boundaries

The seed contains one confirmed official news item: [OpenAI Model Release Notes](https://help.openai.com/en/articles/9624314-model-release-notes), section dated 17 November 2026, documenting GPT-6.2 Astra and Sol API availability. The item preserves that date without inventing a publication time; retrieval has an actual UTC timestamp. No vendor superiority claims are copied into the digest.

`benchmarks` is intentionally empty. No common multi-provider benchmark suite with verified settings, methodology and usable cost records was established in this bounded research. Token-rate estimates are not measured task cost, speed, success rate or comparative quality. Import compatible measured evidence separately and preserve its original suite, version, settings and attribution.
