# Veil

Veil is a browser-based toolkit for reviewing sensitive data in AI prompts and responses. Its first audience is security and privacy teams evaluating how redaction and blocking policies behave on representative examples.

## Run locally

Requires Node.js 20.19+ or 22.12+ and npm.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. Use `npm test` to run the scanner suite and `npm run build` to produce the static site in `dist/`.

## Try the workflow

1. Open **Prompt Review** and select **Run scan** to redact the sample email address.
2. Change **Content type** to **AI response**, load the example, and run a scan. The default policy blocks the synthetic credential and withholds the preview.
3. In **Policies**, set the API credential action to **Redact** and select **Test custom policy**. Run the scan again to see all three matching data types masked.
4. In **Findings**, filter the session's decisions or export metadata as JSON.

## Data handling

The app scans text in the browser without calling any AI provider or backend. Input and results live in page memory. The findings list retains up to 200 scans for the current page session and stores timestamps, content type, policy, decision, and match counts. The export includes those fields. A refresh clears session data.

The repository ships with [synthetic examples](data/examples.json) and [policy definitions](data/policies.json). The scanner uses patterns for email addresses, selected credential formats, and payment-card candidates verified with the Luhn checksum. Pattern detectors have coverage gaps and can produce false positives. A Block decision withholds the app's preview. Enforcement across AI providers would require integrating the policy engine into a gateway or another controlled entry point.

## Design and product direction

[Design brief](design/brief.md) · [Desktop](design/prompt-review-desktop.png) · [Mobile](design/prompt-review-mobile.png) · [Design QA](design-qa.md)
