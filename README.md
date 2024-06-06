# OmnI18n Edit

Static webapp to edit [OmnI18n](https://www.npmjs.com/package/omni18n) [FileDB](https://github.com/emedware/omni18n/blob/main/docs/db.md#filedb)

## Usage

Just browse [./build/index.html](./build/index.html)

The bundled files are released on [github](https://github.com/eddow/omni18n-edit/releases)

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

# Used `infos`

`OmnI18n` allows `KeyInfos` and `TextInfos`. These, in a file, are inserted between the key/locale and its `:` between `{` and `}` describing an object in a js-like format

Ex:

```
format.lists{inFileOnly:true}:
	:{list::$1|style:long, type:conjunction}
```

## KeyInfos

- `inFileOnly` (`boolean, default=false`): means it shouldn't appear in the translatable list as it is a technical translation

## TextInfos

void
