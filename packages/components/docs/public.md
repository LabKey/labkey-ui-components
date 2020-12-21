
# Public API

This package contains React components, models, actions, and utility functions for LabKey applications and pages.
We have documented here those items in the package that comprise the public API. Other items will be added as time
allows, demand dictates, and stability suggests.

## Installation

The easiest way to use `@labkey/components` is to install it from npm and bundle it with your app. Before you run install
you'll want to make sure you set the appropriate registry for the `@labkey` scope.

#### Setting the Registry Scope

This package is currently available on LabKey's Artifactory package registry. To include this package, set the registry
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

## API
* [QueryModel API](./QueryModel.md) - how to use `QueryModel`, `withQueryModels`, `GridPanel`, and `DetailsPanel`, to
fetch and render data from LabKey server.
* [Sorting Utilities](./sort.md) - utilities to sort data the way users expect it to be sorted.

## Related Documentation

* [Demo Module](https://github.com/LabKey/tutorialModules/tree/develop/demo/src/client/QueryModelPage) - LabKey demo module with React page and
component usage examples
in a GridPanel component
* [Immer for Immutability](./immer.md) - information and examples on using the Immer library for JavaScript object immutability
* [Jest Testing Recommendations](./jest.md) - recommendations and examples for adding Jest tests for your UI components code

## Code Organization

The source code in this package is split into two main directories under the `/src` directory: `internal` and `public`.
The React components, models, etc. in the `internal` directory are either purely for implementation purposes or not yet
stable enough to be included as part of the public API. As components become more stable they will be moved to the
`public` directory and added to the public API documentation with future `@labkey/component` package versions.
