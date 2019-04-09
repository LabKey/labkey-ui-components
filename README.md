# LabKey Glass Components (@glass)

This repository defines all of the components available in the @glass scope. These React components, utility functions, and models comprise the LabKey Glass UI framework.

:warning: **Private** :warning: LabKey Glass components are intended for internal use only.  

:construction: **Warning** :construction: LabKey Glass is under development so these components should be considered unstable. Once they're ready we'll officially push the components as version 1.0.0.

## Package listing

<!--- keep these alphabetical --->
| Package | Description | Current Verison |
| --- | --- | --- |
| @glass/domainproperties | Domain property related components for LabKey domains | 0.0.5 |
| @glass/grid | Simple grid display for LabKey data views | 0.0.3 |
| @glass/models | Shared models for LabKey components | 0.0.6 |
| @glass/navigation | Application navigation elements and functions | 0.0.19 |
| @glass/omnibox | LabKey component that takes a set of actions (like filter, sort, search) and exposes them as a single input for applying those actions to a QueryGrid | 0.0.8 |
| @glass/querygrid | Query Grid for LabKey schema/query data views | 0.0.24 |
| @glass/utils | Utility functions and components for LabKey views | 0.0.8 |

## Using @glass npm packages

The easiest way to use `@glass` components is to install them from npm and bundle them with your app. Before you run install you'll want to make sure you set the appropriate registry for the `@glass` scope.

#### Setting the Registry Scope

This package is currently available on LabKey's Artifactory package registry. To include this package set the registry in npm for the `@glass` scope. This can be done via command line using `npm config`:
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

* Create a new directory in the `glass-components/packages` directory. Package naming convention: all lowercase names with no spaces in them, trying to keep the names to one or two words if possible.
* Edit the root-level `package.json` and add the new directory to the `workspaces` array.
* Follow the instructions in the `packages/template` `README.md` file to put necessary files in place
* Run `yarn build`

Generally, when doing development, you should:

* Place source code in a `src` subdirectory.
* Place typing files in a `src/typings` subdirectory.
* Add documentation a-plenty.

#### Local Development

In order to use and test the components you are developing or modifying in this repository within another application, 
you can use [npm link](https://docs.npmjs.com/cli/link.html) (or `yarn link`, presumably)
(also see [this discussion](https://medium.com/@the1mills/how-to-test-your-npm-module-without-publishing-it-every-5-minutes-1c4cb4b369be))
to create symbolic links to your local versions of the packages.  Once modifications have been made and published, you can use [npm uninstall](https://docs.npmjs.com/cli/uninstall.html)
(also see [this discussion](https://medium.com/@alexishevia/the-magic-behind-npm-link-d94dcb3a81af)) to remove the symbolic
link (or, you can remove it yourself manually).  Please note that you will likely want to use the ``--no-save`` option 
when uninstalling to prevent your ``package.json`` file from being updated.

For example, if making changes to the grid package, you can do the following:
* ``cd packages/grid``
* ``npm link``  (this creates a link to this directory in the ``lib/node_modules`` directory of the node version currently on your path)
* ``cd my_application``
* ``npm link @glass/grid`` (note that the scope is required here)
(Alternatively, you can do this in one command from `my_application` by specifying the directory to link from:
``npm link /path/to/packages/grid``)

Then, when you no longer wish to reference the local installation, you can do
* ``npm uninstall --no-save @glass/grid``

This will remove the link and will not reinstall a version of the node module from the repository.  For that, you'll
need to use ``npm install``.

We have had varying degrees of success with using `link`.  If modifying only one package within this repository, it will
likely work just fine.  If you modify a package and something it depends on, this can produce some baffling type mismatch
errors.  An alternative process that seems to work in this case, but is a bit more tedious is the use `yarn watch` in 
conjunction with a copy command. The `watch` command can automatically build a package when the source code changes (
see the `packages/template/package.json` script declaration). You will then need to manually copy the `dist` directory
created by the build into the application's `node_modules/@glass/<package_name>` directory.
                                  
For example, for the navigation package, you could do:
* ``cd packages/navigation``
* ``yarn watch``
* edit files
* wait for recompile trigged by the `watch` to happen
* ``cp -r dist /path/to/my_app/node_modules/\@glass/navigation``
 
 
### Documentation
We use [typedoc](https://www.npmjs.com/package/typedoc) for generating our documentation.  This documentation is published to [GitHub pages](https://labkey.github.io/glass-components/), which is **publicly available on the internet**, 
so there should be no references to secrets or clients left in the documentation.  

All exported components, methods, interfaces, etc. should include 
documentation.  You can use the supported [JavaDoc tags](https://typedoc.org/guides/doccomments/) to provide additional explanations for parameters, return values, etc. as well as for indicating that some objects should not have documentation generated for them.

You can generate the docs locally by running the following command in the ```glass-components``` directory.
* ``yarn run build:docs``
 
**N.B.** This command produces a good number of errors from Typescript not being able to resolve classes and such. 
Try to eliminate as many of these as possible before deploying the docs.

To publish the documentation to [GitHub pages](https://labkey.github.io/glass-components/) use the following command in the ```glass-components``` directory:
* ``yarn run deploy:docs``

This deployment of docs should be done after each pull request is merged into ```master```. 

#### Storybook

A great way to view and play with these components is via [Storybook](https://storybook.js.org/). This is a tool that is used to deploy components in a functional environment which runs the components according to "stories". 
These stories are composed by developers to show features of a component and let other members of the team interact with a component. Because storybook uses WebPack's hot reloading,
this is also a great way to do visual inspection and testing of your components in isolation.

Each package that is developed should create a set of stories that illustrate the components in that package.  We follow these
conventions currently:
* Each package as a `.storybook` directory that contains the configuration files for storybook.  See `packages/template/.storybook` for and example.
* Stories are placed the directory `src/stories` with the names of the story files the same as the names of the respective components
* The [addon-knobs](https://www.npmjs.com/package/@storybook/addon-knobs) package is used for parameterizing the stories so a use can
explore the different options available within a component.  See the `navigation` package for a few examples.

You can start up Storybook via:

```sh
cd packages/<you package>
yarn run storybook

# The storybook instance is now available at http://localhost:9001
```

When changes are made to the source code for the components or the stories, the storybook instance will automatically reload.  However,
if making changes to the scss files within a package, you will still have to build the package manually.  It is probably possible to
change the `.storybook/webpack.config.js` to also do hot reloading when scss files are changed, but efforts to date have not been
successful.

## Publishing

In order to publish, you will need to set up your npm credentials.  Follow [these instructions](https://internal.labkey.com/wiki/Handbook/Dev/page.view?name=npmrc) to create your .npmrc file.
If you do not have permissions to publish to this repository, contact a local Artifactory administrator who can grant you those permissions.

To publish, increment the version number in accordance with [SemVer](https://semver.org/), update this Readme.md, and commit. Then from the package root (not the repository root!) of the package you want to update (e.g. packages/omnibox) run:

```sh
npm publish
```
