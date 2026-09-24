# Contributing to Supercharged Links

Thanks for your interest in improving Supercharged Links! Bug reports,
translations and pull requests are all welcome.

## Reporting a bug

Open an [issue](https://github.com/mdelobelle/obsidian_supercharged_links/issues)
and include:

- your Obsidian version and operating system,
- the plugin version (see Settings → Community plugins),
- the selectors you configured, if the problem is about styling,
- what you expected to happen and what happened instead.

Before opening a new issue, please search the existing ones — a lot of
styling questions are already answered there.

## Setting up a development environment

You need [Node.js](https://nodejs.org) 18 or later.

```sh
git clone https://github.com/mdelobelle/obsidian_supercharged_links.git
cd obsidian_supercharged_links
npm install
```

Then either build once:

```sh
npm run build
```

or rebuild on every change while you work:

```sh
npm run dev
```

Both write `main.js` into the repository root. To try your build inside
Obsidian, symlink (or copy) `main.js`, `manifest.json` and `styles.css`
into `<your vault>/.obsidian/plugins/supercharged-links-obsidian/`, then
reload Obsidian or disable and re-enable the plugin.

## Before you open a pull request

- Make sure `npm run build` completes without errors.
- Run the linter Obsidian uses to review community plugins, and keep the
  files you touched free of new findings:

  ```sh
  npm run lint
  ```

- Commit the rebuilt `main.js` along with your source changes; the
  release workflow ships the file straight from the repository.
- Keep the diff focused. Unrelated reformatting makes review harder.

## Translations

Language dictionaries live in [`src/i18n`](src/i18n). To add a language,
copy `en.ts`, translate the values (leave the keys alone), and register
the new dictionary in `src/i18n/index.ts`. Translate whole sentences
rather than fragments so that word order can differ between languages.

## Code style

The project has no formatter configured, so match the style of the file
you are editing — it is tab-indented in `main.ts` and space-indented
under `src/`.

## License

By contributing you agree that your contributions are licensed under the
[MIT License](LICENSE) that covers this project.
