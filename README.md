# LabKey NPM Packages (@labkey)

This repository defines npm packages available in the @labkey scope.

## Package listing

<!--- keep these alphabetical --->
| Package | Status | Description |
| --- | --- | --- |
| [@labkey/build](packages/build/README.md) | | LabKey client-side build assets.
| [@labkey/components](packages/components/README.md) | [![Build Status](https://teamcity.labkey.org/app/rest/builds/buildType:(id:LabKey_Trunk_Premium_InternalSuites_GlassComponentsUnitTest)/statusIcon)](https://teamcity.labkey.org/viewType.html?buildTypeId=LabKey_Trunk_Premium_InternalSuites_GlassComponentsUnitTest) | All components, models, actions, and utility functions for LabKey applications and pages
| [@labkey/eslint-config-base](packages/eslint-config-base/README.md) | | Base ESLint configuration with TypeScript and Prettier support.
| [@labkey/eslint-config-react](packages/eslint-config-react/README.md) | | Extends the base configuration with React support.
| [@labkey/test](packages/test/README.md) | [![Build Status](https://teamcity.labkey.org/app/rest/builds/buildType:(id:LabkeyTrunk_ModuleSuites_ApiSuites_LabkeyTestIntegration)/statusIcon)](https://teamcity.labkey.org/viewType.html?buildTypeId=LabkeyTrunk_ModuleSuites_ApiSuites_LabkeyTestIntegration) | Utilities and configurations for running JavaScript tests with LabKey Server.
| [@labkey/themes](packages/themes/README.md) | | UI themes for LabKey Server.


## Using @labkey npm packages

The easiest way to use `@labkey` components is to install them from npm and bundle them with your app.
Before you run install, you'll want to make sure you set the appropriate registry for the `@labkey` scope.

#### Setting the Registry Scope

This package is currently available on LabKey's Artifactory package registry and relies on
the `@labkey/api` package.  To include this package, set the registry in npm for the `@labkey` scope.
This can be done via command line using `npm config`:
```
npm config set @labkey:registry https://labkey.jfrog.io/artifactory/api/npm/libs-client/
```
or via a `.npmrc` file
```
# .npmrc
@labkey:registry=https://labkey.jfrog.io/artifactory/api/npm/libs-client/
```

#### Installing

To install using npm
```
npm install @labkey/components
```
You can then import `@labkey/components` in your application as follows:
```js
import { Grid } from '@labkey/components';
```

# Linting and Prettifying

First, install the `@labkey/eslint-config-base` or `@labkey/eslint-config-react` as appropriate.
Once configured, you can run eslint in a variety of ways as described in the [README](packages/eslint-config-base/README.md) for eslint-config-base


