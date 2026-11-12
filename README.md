# node-red-vite-plugin

Vite plugins for building [Node-RED](https://nodered.org) nodes. Each plugin
is its own npm package with its own version, released from this repository.

## Packages

| Package                                                         | Description                                           |
| --------------------------------------------------------------- | ----------------------------------------------------- |
| [vite-plugin-node-red-node](packages/vite-plugin-node-red-node) | Builds the editor and runtime files of Node-RED nodes |

## Development

You need Node.js 22 or newer and [pnpm](https://pnpm.io).

```sh
pnpm install
pnpm run build    # build every package
pnpm run test     # test every package
pnpm run lint     # ESLint
pnpm run format   # Prettier check (format:fix to apply)
```

CI runs the same commands on pull requests that change code or
configuration; documentation-only changes skip it.

## Adding a package

1. Create a folder under `packages/`, with its code in `src/` and its entry
   point in `src/index.ts`.
2. In its `package.json`, add the scripts and release settings:

   ```json
   {
     "scripts": {
       "build": "vite build --config ../../vite.config.ts",
       "test": "vitest run"
     },
     "release": {
       "extends": ["semantic-release-monorepo", "../../.releaserc.json"]
     }
   }
   ```

The shared `vite.config.ts` bundles the package into a single
`dist/index.js` and `dist/index.d.ts`. Everything in `dependencies` and
`peerDependencies` stays an import and isn't bundled.

## Releases

Every push to `main` runs CI and then
[semantic-release](https://semantic-release.gitbook.io) for each package.
The commit messages decide whether a package is released:

| Commit type                             | Release                   |
| --------------------------------------- | ------------------------- |
| `fix:`                                  | patch, e.g. 1.0.0 → 1.0.1 |
| `feat:`                                 | minor, e.g. 1.0.0 → 1.1.0 |
| `feat!:` or a `BREAKING CHANGE:` footer | major, e.g. 1.0.0 → 2.0.0 |
| `docs:`, `chore:`, `ci:`, `build:` …    | none                      |

Things to keep in mind:

- **Only commits that change files inside a package's folder count** for that
  package. A `feat:` commit that only touches the repository root releases
  nothing.
- **Each package has its own version series**, tagged as
  `<package>-v<version>`, e.g. `vite-plugin-node-red-node-v1.2.0`.
- **Merge pull requests with a merge commit**, so the individual commit
  messages reach `main`. When squashing, the pull request title becomes the
  commit message and must follow the same format.
- A new package's first release is `1.0.0`. To start at `0.x`, push a tag
  such as `<package>-v0.0.0` before its first release.

## License

MIT
