# Meta Clip! feedback setup

## Included
- `index.html`: site plus fixed bottom-left **Send us something** popup.
- `netlify/functions/feedback.js`: server-side Discord webhook handler.

## Netlify setup
1. Deploy this folder with `index.html` at the publish root and keep the function at `netlify/functions/feedback.js`.
2. In Netlify site settings, add an environment variable named **`webhook`**.
3. Set its value to your real Discord webhook URL.
4. Redeploy after adding the variable.

The webhook URL is only read by the Netlify Function. It is not included in the HTML sent to visitors. Do not put the real URL in `index.html` or commit it to a public repository.

The form accepts general messages, suggestions, opinions, and bug reports. Contact info is optional. Basic validation and a honeypot are included, but this is not a full rate limiter. If spam becomes a problem, add hosting-layer rate limiting or a challenge.

A plain static HTML deploy without the Netlify Function will show the form but cannot forward submissions. Test with Netlify CLI (`netlify dev`) and set `webhook` in your local environment.
