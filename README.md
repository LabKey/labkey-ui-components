# LabKey Glass Components (@glass)

This repository defines all of the components available in the @glass scope. These React components, utility functions, and models comprise the LabKey Glass UI framework.

:warning: **Private** :warning: LabKey Glass components are intended for internal use only.  

:construction: **Warning** :construction: LabKey Glass is under development so these components should be considered unstable. Once they're ready we'll officially push the components as version 1.0.0.

## Package listing

<!--- keep these alphabetical --->
| Package | Description |
| --- | --- | 
| [@glass/base](packages/base/README.md) | Base components, models, and utility functions for LabKey applications and pages
| [@glass/domainproperties](packages/domainproperties/README.md) | Domain property related components for LabKey domains | 
| [@glass/navigation](packages/navigation/README.md) | Application navigation elements and functions |
| [@glass/omnibox](packages/omnibox/README.md) | LabKey component that takes a set of actions (like filter, sort, search) and exposes them as a single input for applying those actions to a QueryGrid | 
| [@glass/querygrid](packages/querygrid/README.md) | Query Grid for LabKey schema/query data views 
| [@glass/report-list](packages/report-list/README.md) | Query Grid for LabKey schema/query data views 
| [template](packages/template/README.md) | A template for creating new packages

## Using @glass npm packages

The easiest way to use `@glass` components is to install them from npm and bundle them with your app. 
Before you run install you'll want to make sure you set the appropriate registry for the `@glass` scope
as well as the `@labkey` scope.

#### Setting the Registry Scope

This package is currently available on LabKey's Artifactory package registry. To include this package set the registry in npm for the `@glass` scope. This can be done via command line using `npm config`:
```
npm config set @glass:registry https://artifactory.labkey.com/artifactory/api/npm/libs-client/
npm config set @labkey:registry https://artifactory.labkey.com/artifactory/api/npm/libs-client/

```
or via a `.npmrc` file
```
# .npmrc
@glass:registry=https://artifactory.labkey.com/artifactory/api/npm/libs-client/
@labkey:registry=https://artifactory.labkey.com/artifactory/api/npm/libs-client/
```

#### Installing

To install using npm
```
npm install @glass/base
```
You can then import @glass/base in your application as follows:
```js
import { Grid } from '@glass/base';
```

## Development



### Getting Started
If you are building the glass components locally, you will need to do the following to prepare your system.

#### 1. Install yarn

[Yarn](https://yarnpkg.com) is a package manager much like npm. We use it instead of npm due to its support for [workspaces](https://yarnpkg.com/lang/en/docs/workspaces/). There a couple of different ways to install yarn. If you have npm you can do a global install:

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
yarn global add lerna@3.14.1
```

Lerna should now be available on the command line.

#### 3. Clone and Build

Now that yarn and lerna are set up you can go ahead and clone this repository to a local directory.

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

### Technologies 
For doing development of glass components, you should be familiar with the following technologies:
* [React](https://reactjs.org/) - used for building the UI components
* [Bootstrap](https://getbootstrap.com/docs/3.4/) - for consistent, responsive styling
* [React-Bootstrap](https://5c507d49471426000887a6a7--react-bootstrap.netlify.com/) - bootstrap styling for react components
* [Typescript](https://www.typescriptlang.org/docs/home.html) - for typing of javascript objects
* [Jest](https://jestjs.io/docs/en/getting-started.html) - For unit testing of components
* [Enzyme](https://airbnb.io/enzyme/) - Testing utility library
* [Storybook](https://storybook.js.org/) - For use in manual testing and exploration of features outside of an application

And, for building, we use
* [Yarn](https://yarnpkg.com) - package manager and build tool
* [Lerna](https://lernajs.io/) - for managing JavaScript projects with mutliple packages.

### Best Practices
You should do pretty well to follow the styles and practices currently represented in the code, but here are   
some guides to best practices for doing front-end development:
* [Alan's Guidelines](https://docs.google.com/presentation/d/1hW9gYbWhW6spr7uhAjpKBNl3hWPXUOPbmlwD6UkYWE8/edit?pli=1#slide=id.g5627a1f538_0_120)
* [Airbnb Style Guide](https://github.com/airbnb/javascript)

### Creating a New Package
To create a new package:

* Create a new directory in the `glass-components/packages` directory. Package naming convention: all lowercase names with no spaces in them, trying to keep the names to one or two words if possible. 
Use hyphens to separate words.
* Edit the root-level `package.json` and add the new directory to the `workspaces` array.
* Follow the instructions in the `packages/template` `README.md` file to put necessary files in place
* Run `yarn build`

Generally, when doing development, you should:

* Place source code in a `src` subdirectory.
* Place typing files in a `src/typings` subdirectory.
* Add documentation a-plenty and update the package `README.md` release notes as you add/fix/update the package.

### Local Development

When making modifications to an existing package, you should:
* Update the version number for the package to be `X.Y.Z-fb-my-branch-name.0`, which `X.Y.Z` is your best guess at the 
next [SemVer](https://semver.org/) version that will include your changes, `fb-my-branch-name` is the name of your
feature branch with underscores replaced by hyphens and the `.0` is just a starting point for the prerelease versioning.
You can do this editing manually or by using `lerna version --exact`.  See [below](#version-numbering) for
 more on version numbering.
* Update the README.md file for the package to document what is changing in this version.  
* Write [jest](https://jestjs.io/docs/en/getting-started.html) tests together with [enzyme](https://airbnb.io/enzyme/) to test non-rendering functions and rendering of components with different sets of parameters.  Jest 
tests should be preferred over other types of tests since they are quick to run and small enough to be easily understood, 
but they should generally not try to do a lot of interaction with the components. You can, however, validate that callbacks 
passed to a component are called when expected.  See existing `.spec.ts` files for examples.  
* Write jest tests that use actual server responses where needed.  We have several examples of tests using `xhr-mock` 
for reading in realistic data that can be captured from the server.
* Write or update [storybook stories](#storybook) that illustrate the functionality.  This is the easiest way to do the bulk of manual
testing and iteration on display updates.  Again, we have several examples of stories that use actual data captured 
from the server for various Ajax calls that are required.  
* Test within the application pnce display and functionality are as expected from within storybook.  
  
#### Getting glass packages to the application

While you can [publish](#publishing) a pre-release version of the glass packages and then update your application's `package.json`
to reference the new pre-release version in order to view the changes within the application, you will likely want to 
be able to do this without publishing.

In order to use and test the components you are developing or modifying in this repository within another application, 
you can use [npm link](https://docs.npmjs.com/cli/link.html) (or `yarn link`, presumably)
(also see [this discussion](https://medium.com/@the1mills/how-to-test-your-npm-module-without-publishing-it-every-5-minutes-1c4cb4b369be))
to create symbolic links to your local versions of the packages.  Once modifications have been made and published, you can use [npm uninstall](https://docs.npmjs.com/cli/uninstall.html)
(also see [this discussion](https://medium.com/@alexishevia/the-magic-behind-npm-link-d94dcb3a81af)) to remove the symbolic
link (or, you can remove it yourself manually).  Please note that you will likely want to use the ``--no-save`` option 
when uninstalling to prevent your ``package.json`` file from being updated.

For example, if making changes to the base package, you can do the following:
* ``cd packages/base``
* ``npm link``  (this creates a link to this directory in the ``lib/node_modules`` directory of the node version currently on your path)
* ``cd my_application``
* ``npm link @glass/base`` (note that the scope is required here)
(Alternatively, you can do this in one command from `my_application` by specifying the directory to link from:
``npm link /path/to/packages/base``)

Then, when you no longer wish to reference the local installation, you can do
* ``npm uninstall --no-save @glass/base``

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
* wait for recompile triggered by the `watch` to happen
* ``cp -r dist /path/to/my_app/node_modules/\@glass/navigation``

### Package Dependencies
We track our external dependencies in [this spreadsheet](https://docs.google.com/spreadsheets/d/1W39yHLulzLUaXhp5-IRFuloJC9O94CJnwEHrR_4CcSo/edit#gid=0)
in order to maintain notes about the cost of updating our various packages.  To do package updates, use the
```
yarn outdated
```
command to show which packages are out of date and then compare to the spreadsheet to determine if there has already
been investigation into the cost of upgrading packages that are out of date.  
 
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

### Storybook

A great way to view and play with these components is via [Storybook](https://storybook.js.org/). This is a tool that is used to deploy components in a functional environment which runs the components according to "stories". 
These stories are composed by developers to show features of a component and let other members of the team interact with a component. Because storybook uses WebPack's hot reloading,
this is also a great way to do visual inspection and testing of your components in isolation.

Each package that is developed should create a set of stories that illustrate the components in that package.  We follow these
conventions currently:
* Each package as a `.storybook` directory that contains the configuration files for storybook.  See `packages/template/.storybook` for and example.
* Stories are placed the directory `src/stories` with the names of the story files the same as the names of the respective components
`* The [addon-knobs](https://www.npmjs.com/package/@storybook/addon-knobs) package is used for parameterizing the stories so a user can
explore the different options available within a component.  See the `navigation` package for a few examples.

You can start up Storybook via:

```sh
cd packages/<your package>
yarn run storybook

# The storybook instance is now available at http://localhost:9001
```

When changes are made to the source code or .scss files for the components or the stories, the storybook instance will automatically reload.


## Publishing

### Credentials
In order to publish, you will need to set up your npm credentials.  Follow [these instructions](https://internal.labkey.com/wiki/Handbook/Dev/page.view?name=npmrc) to create your .npmrc file.
If you do not have permissions to publish to this repository, contact a LabKey Artifactory administrator who can grant you those permissions.


### Version numbering

When updates are made to any @glass npm package, the version number updates will follow [SemVer](https://semver.org/). 
The next version you go to for a package should be based on the following guidelines:
1. Am I fixing a bug but not adding anything new - use the next patch version 
1. Am I adding something new, but not changing anything that already existed - use the next minor version
1. Am I breaking something existing because of my changes - use the next major version

With that in mind, we want to make use of "prerelease" version numbers while a feature / story is being developed 
and only go to that next “release” version right before feature branch on glass-components is ready to 
merge back to master. 

Steps for package version numbering during feature branch development:
1. Create your feature branch off of master, i.e. fb_feature_1, and add your changes. 
1. When you are ready to push an alpha version up to Artifactory so you can test it in your application and
on TeamCity, update the `package.json` version for that package. Ex. if adding a new feature and the current version is `0.1.0`,
you would use `0.2.0-fb-feature-1.1`.
1. If you make further edits to your feature branch and need to push new alpha versions, you would just bump the last
digit in your package version number (i.e. `0.2.0-fb-feature-1.2`, `0.2.0-fb-feature-1.3`, etc.).
1. Once your feature branch is complete and ready to merge, you do one more package version update to what will be the
"release" version (i.e. `0.2.0` in this scenario) and then build/publish and complete the merge. Don't forget to update
the release notes in your package's `README.md` file for this version number. And don't forget to update your application
package.json for this new version number (if that applies).
1. Once merged and the "release" version has been pushed to Artifactory, you can then go to Artifactory and delete your
alpha versions of that package for this feature branch.

## Publishing commands

### Lerna
Though the updating of version numbers can be done manually, it is recommended that you take advantage of the 
[`lerna version`](https://github.com/lerna/lerna/tree/master/commands/version#readme) and 
[`lerna publish`](https://github.com/lerna/lerna/tree/master/commands/publish#readme) commands, particularly if
you are changing a package that other packages depend on.  

When you first create your feature branch, you'll want to use 
```
lerna version --exact
``` 
to update the versions to ones corresponding to your feature branch.  This will prompt you for the type of version you 
want to create. In this case, you will likely want to choose 'Custom' and type in the appropriate version that 
corresponds to your feature branch.

When ready to publish a new version of the package(s) for use in an application, if everything
works according to plan, you should be able to do the following to update package versions and publish these new versions:

``
lerna publish prerelease --exact --registry https://artifactory.labkey.com/artifactory/api/npm/libs-client
``

While still doing development, use the `prerelease` option.  When ready to make the release, you may be able to
use the [appropriate option](https://github.com/lerna/lerna/tree/master/commands/version#readme) for the type of 
update, but if there are changes in more than one package, they may not all need the same kind of version update,
so you'll want to go through the prompts provided if no semver bump keyword is provided.  We use the `--exact` option 
so that any transitive dependencies will use the exact version reference instead of 
the ^ version reference.  This is particularly important when there may be multiple branches open that are 
possibly targeting the same next release version, as the last one alphabetically will match to the ^ version.

You can also publish by first changing the version and then publishing:
```
lerna version --exact
```
This will prompt you for the kind of version change you want.  The one closest to our versioning scheme is prerelease.
You can also choose `custom`.  This creates the version (including making a tag in git).  Then to publish, you run
the command
```
lerna publish from-git --registry https://artifactory.labkey.com/artifactory/api/npm/libs-client
```
The `--registry` option is necessary (currently, at least) because even though packages have the registry 
specified in their `package.json` files, for some reason this is not found by the publish command.

### Yarn publish 
If publishing with lerna does not work, you can also do it manually using either `yarn` or `npm`.  From the package 
root (not the repository root!) of the package you want to update (e.g. `packages/omnibox`) run:

```sh
yarn publish
```

This will prompt you for the new version.  Choose a version increment in accordance with [SemVer](https://semver.org/).  This command will
update the `package.json` file and commit that change.  Then you can do a `git push` to get the update into the remote repository. (Note,
you could instead use `npm publish`, but you will have to update the `package.json` file manually before using that command.)


## Troubleshooting

Here we capture some tips on getting past some problems you may
encounter while building and publishing.

**Type is not assignable**

*TS2322: Type 'import("/Development/labkey/trunk/server/optionalModules/sampleManagement/node_modules/@glass/querygrid/node_modules/@glass/base/dist/models/model").QueryGridModel' is not assignable to type 'import("/Development/labkey/trunk/server/optionalModules/sampleManagement/node_modules/@glass/base/dist/models/model").QueryGridModel'.*
  
This is usually an indication that in your glass package, you have a reference to another glass component that uses an inexact version (e.g., prefixed with ^).  
To fix this, you'll need to publish a new version of the package that referenced
the inexact version.  Since this will require no code changes, lerna may not recognize that 
a new version should be published.  You can use the [--force-publish](https://github.com/lerna/lerna/tree/master/commands/version#--force-publish)
option for lerna to make it create a new version.

To prevent this problem in the future, you should pay attention to changes
made to the `yarn.lock` file as you are doing development.  Generally, this
file in the `glass-components` repository should not have references to any
`@glass` packages.  If there are references, use `yarn list` to examine the full
set of dependencies and find where differing versions of one of the `@glass` pacakges
are being included.