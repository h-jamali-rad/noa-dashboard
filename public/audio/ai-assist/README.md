# NOA AI Assist — audio guides

Place one MP3 file per element id from `/shared/ai-assist-scripts.json` here.
The wrapper component (`components/ai-assist-wrapper.tsx`) plays
`/audio/ai-assist/{id}.mp3` when AI Assist is enabled and the user hovers
the wrapped element.

Missing files fail silently — the wrapper's audio `.play()` promise is
swallowed so a missing clip simply produces no sound (no console errors).

Filename convention: kebab-case id from the JSON manifest, e.g.

```
prep-stat-card-cohort.mp3
train-model-comparison-table.mp3
xai-shap-top10.mp3
cdss-form.mp3
```

Voice/style: short (10–25 s), conversational, explains what the user is
looking at — not what to click. Generated voices should be normalised
around -18 LUFS so they don't startle the user.
