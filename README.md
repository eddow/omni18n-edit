# OmnI18n Edit

Static webapp to edit [OmnI18n](https://www.npmjs.com/package/omni18n) [FileDB](https://github.com/emedware/omni18n/blob/main/docs/db.md#filedb)

## Usage

Just browse [./build/index.html](./build/index.html)

The built files are released on github

### Functionning

It's really just a CRUD engine.

Make sure your dictionary file begins with a list of locales

```
#{locales: ['en','fr','de']}

```

After, open the file (buttons in the toolbar) and configure the languages you wish to edit

Add/remove/modify, then download the modified dictionary file (other button in the toolbar)

## Development

In order to develop (who would do that?), `svelte-material-ui` has a svelte5-ready version as `@next` (in branch `v8`), so it has to be cloned, branched and compiled locally (hence the `"devDependencies"` entry `"svelte-material-ui-dev": "file:../svelte-material-ui"`)
