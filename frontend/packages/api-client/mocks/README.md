# Development mocks

This scaffold has no mock endpoints or canned workflow responses. The deployment milestone checks the configured real backend's `GET /health`.

After the backend contract is confirmed, add MSW handlers and explicitly labelled fixtures here for development only. Keep them out of production imports and builds. Preserve the dataset's documented quirks when deriving fixtures; never present fabricated findings, progress, or health results as live responses.
