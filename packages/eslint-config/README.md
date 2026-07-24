# @labkey/eslint-config

This package contains a shareable ESLint configuration with TypeScript, React, and Prettier support.

## Installation

```sh
# Using npm
npm install @labkey/eslint-config --save-dev
```

## Usage

The configuration is provided as an ESLint [flat config](https://eslint.org/docs/latest/use/configure/configuration-files).
Re-export it from your project's `eslint.config.mjs`:

```js
export { default } from '@labkey/eslint-config';
```
