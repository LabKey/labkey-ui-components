
# Public API Documentation

This package contains React components, models, actions, and utility functions for LabKey applications and pages.
Note that the code in this package in the `/src` directory is split into two main directories: `internal` and `public`.

With version 1.0 of this package, the `public` directory will be focused on several key components and models that will
be most beneficial for external development / usage. More components will be added to this list in future
`@labkey/component` package versions.

Those components, models, etc. in the `internal` directory should be considered unstable at this time and are very
likely to change in future versions of this package.

## Installation

The easiest way to use `@labkey/components` is to install it from npm and bundle it with your app. Before you run install
you'll want to make sure you set the appropriate registry for the `@labkey` scope.

#### Setting the Registry Scope

This package is currently available on LabKey's Artifactory package registry. To include this package set the registry
in npm for the `@labkey` scope. This can be done via command line using `npm config`:
```
npm config set @labkey:registry https://artifactory.labkey.com/artifactory/api/npm/libs-client
```
or via a `.npmrc` file
```
# .npmrc
@labkey:registry=https://artifactory.labkey.com/artifactory/api/npm/libs-client
```

#### Installing

To install using npm
```
npm install @labkey/components
```
You can then import `@labkey/components` in your application as follows:
```js
import { QueryModel, GridPanel } from '@labkey/components';
```

## Related documentation

* [Demo Module](https://github.com/LabKey/tutorialModules/tree/develop/demo) - LabKey demo module with React page and
component usage examples
* [QueryModel API and GridPanel](./QueryModel.md) - how to use QueryModel as a selectRows API wrapper and display data
in a GridPanel component
* [Immer for Immutability](./immer.md) - information and examples on using the Immer library for JavaScript object immutability
* [Jest Testing Recommendations](./jest.md) - recommendations and examples for adding Jest tests for your UI components code

