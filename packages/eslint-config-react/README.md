# @labkey/eslint-config-react

This package provides LabKey's base JS ESLint configuration with React plugins as an extensible shared config.

## Installing

Install `@labkey/eslint-config-base` first then continue below.

```bash
$ npm install --save-dev --save-exact @labkey/eslint-config-react
```

You'll need to also install all of the dependencies.  On OSX or Linux, you can use this snippet to install all of the dependencies:

```bash
$ npm info @labkey/eslint-config-react peerDependencies --json | command sed 's/[\{\},]//g ; s/: /@/g' | xargs npm install --save-dev --save-exact --dry-run
```

When you have inspected the output, you can remove the `--dy-run` flag to actually perform the install.


## Add to Project

Create an .eslintrc.json file with the following contents

```jsonp
{
  "extends": "@labkey/eslint-config-react"
}
```

## Configuring and Using
For more information on configuring and using es-lint, refer to the [README](packages/eslint-config-base/README.md) for eslint-config-base.

## TODO

Look into including [eslint-config-react-redux](https://github.com/DianaSuvorova/eslint-plugin-react-redux)
