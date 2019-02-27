# LabKey Glass (@glass) components

Defines all of the components available in the @glass scope. These React components, utility functions, and models comprise the LabKey Glass UI framework.

## Components

<!--- keep these alphabetical --->
| Package | Description | Current Verison |
| --- | --- | --- |
| @glass/domainproperties | Domain property related components for LabKey domains | 0.0.2 |
| @glass/grid | Simple grid display for LabKey data views | 0.0.3 |
| @glass/models | Shared models for LabKey components | 0.0.3 |
| @glass/omnibox | LabKey component that takes a set of actions (like filter, sort, search) and exposes them as a single input for applying those actions to a QueryGrid | 0.0.4 |
| @glass/querygrid | Query Grid for LabKey schema/query data views | 0.0.8 |
| @glass/utils | Utility functions and components for LabKey views | 0.0.4|

## Using Components

The easiest way to use `@glass` components is to install them from npm and bundle them with your app. Before you run install you'll want to make sure you set the appropriate registry for the `@glass` scope.

#### Setting the Registry Scope

This package is currently availble on LabKey's Artifactory package registry. To include this package set the registry in npm for the `@glass` scope. This can be done via command line using `npm config`:
```
npm config set @glass:registry https://artifactory.labkey.com/artifactory/api/npm/libs-client/
```
or via a `.npmrc` file
```
# .npmrc
@glass:registry=https://artifactory.labkey.com/artifactory/api/npm/libs-client/
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

#### Creating a New Package
To create a new package:

* Create a new directory in the `glass-components/packages` directory.
* Edit the root-level `package.json` and add the new directory to the `workspaces` array.
* Copy the `package-scripts.js` file from an existing package to the new directory.
* Copy and modify (or create) the `package.json`, `rollup.config.js`, and `tsconfig.json` files in your new package directory.
* Place source code in a `src` subdirectory.
* Place typing files in a `src/typings` subdirectory.
* Add documentation a-plenty.
* Run `yarn build`

#### Local Development

In order to use and test the components you are developing or modifying in this repository within another application, 
you can use [npm link](https://docs.npmjs.com/cli/link.html) 
(also see [this discussion](https://medium.com/@the1mills/how-to-test-your-npm-module-without-publishing-it-every-5-minutes-1c4cb4b369be))
to create symbolic links to your local versions of the packages.  Once modifications have been made and published, you can use [npm uninstall](https://docs.npmjs.com/cli/uninstall.html)
(also see [this discussion](https://medium.com/@alexishevia/the-magic-behind-npm-link-d94dcb3a81af)) to remove the symbolic
link (or, you can remove it yourself manually).  Please note that you will likey want to use the ``--no-save`` option 
when uninstalling to prevent your ``package.json`` file from being updated.

For example, if making changes to the grid package, you can do the following:
* ``cd packages/grid``
* ``npm link``  (this creates a link to this directory in the ``lib/node_modules`` directory of the node version currently on your path)
* ``cd my_application``
* ``npm link @glass/grid`` (note that the scope is required here)

Then, when you no longer wish to reference the local installation, you can do
* ``npm uninstall --no-save @glass/grid``

This will remove the link and will not reinstall a version of the node module from the repository.  For that, you'll
need to use ``npm install``.
 
### Documentation
We use [typedoc](https://www.npmjs.com/package/typedoc) for generating our documentation.  
All exported components, methods, interfaces, etc. should include documentation.  You can use the supported [JavaDoc tags](https://typedoc.org/guides/doccomments/)
to provide additional explanations for parameters, return values, etc. as well as for indicating that some objects should not have documentation generated for them.

You can generate the docs locally by running
* ``yarn run build:docs``

#### Storybook

A great way to view and play with these components is via [Storybook](https://storybook.js.org/). This is a tool that is used to deploy components in a functional environment which runs the components according to "stories". These stories are composed by developers to show features of a component and let other members of the team interact with a component. If you're doing active development you can start up Storybook via:

```sh
cd packages/storybook
yarn run storybook

# The storybook instance is now available at http://localhost:9001
```

## Publishing

In order to publish, you will need to set up your npm credentials.  Follow [these instructions](https://internal.labkey.com/wiki/Handbook/Dev/page.view?name=npmrc) to create your .npmrc file.
If you do not have permissions to publish to this repository, contact a local Artifactory administrator who can grant you those permissions.

To publish, increment the version number in accordance with [SemVer](https://semver.org/), update this Readme.md, and commit. Then from the package root (not the repository root!) of the package you want to update (e.g. packages/omnibox) run:

```sh
npm publish
```
