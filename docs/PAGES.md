# GitHub Pages

The `gh-pages` branch contains the contents of `dist/` at its root, with `.nojekyll` and a small `index.html` redirect to `playground/`. It requires no server, secret, bundler, external CDN, or framework installation. Relative module and example URLs work under a repository subpath.

To enable the site, open repository **Settings → Pages**, choose **Deploy from a branch**, select **gh-pages**, choose **/ (root)**, and save. The GitHub connection used for publication can write branch contents but cannot change Pages settings. GitHub supplies the definitive deployed URL and build status after configuration.

For local use:

```sh
npm run build
npm run playground
```

After source changes, rebuild and republish the new `dist/` contents to the root of `gh-pages`. The source branch and Pages branch are separate; pushing source alone does not refresh the Pages snapshot. Automatic deployment is intentionally not claimed. Do not put server code, tokens, private files, or the source repository's `.git` directory into the Pages tree.
