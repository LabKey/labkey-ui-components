# LabKey Glass (@glass) components

Defines all of the components available in the @glass scope. These React components are comprise the LabKey Glass UI framework.

:construction: **Warning** :construction: LabKey Glass is under development so these components should be considered unstable. Once they're ready we'll officially push the components as version 1.0.

## Components

<!--- keep these alphabetical --->
| Package | Current Verison |
| --- | --- |
| @glass/grid | 0.0.1 |
| @glass/omnibox | 0.0.1 |

## Using Components

The easiest way to use `@glass` components is to install them from npm and bundle them with your app. Before you run install you'll want to make sure you set the appropriate registry for the `@glass` scope.

#### Setting the Registry Scope

This package is currently availble on LabKey's Artifactory package registry. To include this package set the registry in npm for the `@glass` scope. This can be done via command line using `npm config`:
```
npm config set @glass:registry https://artifactory.labkey.com/artifactory/api/npm/libs-client
```
or via a `.npmrc` file
```
# .npmrc
@glass:registry=https://artifactory.labkey.com/artifactory/api/npm/libs-client
```

#### Installing

To install using npm
```
npm install @glass/grid
```
You can then import @glass/grid in your application as follows:
```js
import { Grid } from '@glass/grid';
```

## Development

If you would like to contribute changes for LabKey Glass components you can take the following steps.

#### 1. Install yarn

[Yarn](https://yarnpkg.com) is a package manager much like npm. We use it instead of npm due to it's support for [workspaces](https://yarnpkg.com/lang/en/docs/workspaces/). There a couple of different ways to install yarn. If you have npm you can do a global install:

```sh
npm install yarn -g
```

If you are working on a Mac and have [Homebrew](https://brew.sh/) you can install using:

```sh
brew install yarn
```

Yarn should now be available on the command line.

#### 2. Install lerna

[Lerna](https://lernajs.io/) is a tool for managing JavaScript projects with multiple packages. Our build is configured for a specific verison so you'll want to specify that when installing. Since yarn is already configured you can install globally:

```sh
yarn global add lerna@2.11
```

Lerna should now be availble on the command line.

#### 3. Clone and Build

Now that yarn and lerna are setup you can go ahead and clone this repository to a local directory.

```sh
git clone https://github.com/LabKey/glass-components.git # or via ssh
```

Navigate into the directory and run:

```sh
lerna bootstrap
```

This will install all dependencies for the component packages. Once this is complete you can utilize either lerna or yarn to run builds for a specific package. From the top directory you can run any command across all packages that have that command using lerna. For example, if you want to build all the components run the following from the top directory:

```sh
lerna run build
```

#### Storybook

A great way to view and play with these components is via [Storybook](https://storybook.js.org/). This is a tool that is used to deploy components in a functional environment which runs the components according to "stories". These stories are composed by developers to show features of a component and let other members of the team interact with a component. If you're doing active development you can start up Storybook via:

```sh
cd packages/storybook
yarn run storybook

# The storybook instance is now available at http://localhost:9001
```

## Publishing

To publish, increment the version number in accordance with [SemVer](https://semver.org/), update the Readme.md, and commit. Then from the package root (not the repository root!) of the package you want to update (e.g. packages/omnibox) run:

```sh
npm publish
```
