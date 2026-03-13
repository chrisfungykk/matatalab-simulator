# Versioning & Release

When making changes that affect the application build output (new features, bug fixes, layout changes, dependency updates), always:

1. Bump the version in both `package.json` and `vite.config.ts` (`__APP_VERSION__` define).
2. Use semver: patch for fixes, minor for features, major for breaking changes.
3. The app footer displays `v{version} · {build datetime}` — the build timestamp updates automatically on each build via `__BUILD_TIME__` in `vite.config.ts`.
4. After changes, run `npm run build` to verify the build is clean before committing.
5. Commit with a message prefixed by the new version, e.g. `v1.2.0: description of changes`.
6. Push to `main` to trigger the GitHub Actions deploy workflow (`.github/workflows/deploy.yml`).
