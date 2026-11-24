# Artificial Analysis directory

InfoHub keeps two views. **Find a model** gives up to three curated recommendations with the provider and exact thinking or image settings. **Models → Browse the wider Artificial Analysis directory** lists source model identities for exploration. A model appears in recommendations only after its task fit, access route, and settings are verified independently and curated in InfoHub.

## Coverage

The sync imports all entries returned by the documented free-shape model feeds. It follows pagination for language models and includes text to image, image editing, silent and audio-enabled text to video and image to video, text to speech, speech to text, speech to speech, and instrumental and vocal music. It uses stable source IDs, so two entries that share a model name can remain separate when the source assigns them different variant IDs. The same ID across multiple feeds appears once with all its categories.

Coverage is defined by the API, which can exclude superseded or unranked media entries and can differ from the public website. The published API reference does not list a dedicated video-editing model feed. InfoHub links directly to the public lists to cover such cases. The directory preserves names as supplied and does not guess missing provider settings. [API reference](https://artificialanalysis.ai/data-api/docs/reference) · [Language releases](https://artificialanalysis.ai/models/releases) · [Video editing leaderboard](https://artificialanalysis.ai/video/leaderboard/video-editing/)

## Connect the directory

Use an organization API key and confirm that the organization's Artificial Analysis plan or written agreement covers automated retrieval and display to the intended InfoHub audience. A key authenticates API calls. Display and redistribution rights depend on the plan or agreement, including its rules for model selection products. The self-hosted site has no sign-in, so its network audience must match the permitted audience. [Data API access](https://artificialanalysis.ai/data-api/docs) · [Data Platform Terms](https://artificialanalysiscdn.com/legal/ProDataPlatformTerms.pdf) · [Artificial Analysis contact](https://artificialanalysis.ai/contact)

Set `ARTIFICIAL_ANALYSIS_API_KEY` in the host command's environment using your local secret management. Keep the key out of Git, chat, and the browser environment. Then run:

```sh
npm run content -- sync-artificial-analysis --authorized
```

The host command writes `artificial-analysis.json` to the published directory selected by `INFOHUB_DATA_DIR`. A default Docker deployment can read it on the next page load, using the same host publisher and read-only mount as `current.json`. The web server does not need the API key. Keep the published directory private and out of the GitHub repository.

Run the same command to refresh the snapshot or configure it in your existing host scheduler. A failed request leaves the last good snapshot in place. The directory shows its refresh date, visible [Artificial Analysis attribution](https://artificialanalysis.ai/data-api/docs#attribution-and-licensing), and live source links. The snapshot contains model identities and category memberships, separate from news, benchmarks, prices, and recommendations.
