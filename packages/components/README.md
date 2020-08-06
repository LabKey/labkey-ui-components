# LabKey Components (@labkey/components)

This package contains Components, models, actions, and utility functions for LabKey applications and pages.

:construction: **Warning** :construction:
This package is under development, so these components should be considered unstable and are very likely to change.
Once they're ready, we'll officially push the components as version 1.0.0.
:construction: **Warning** :construction:

## Release Notes
Release notes for this package are available [here](releaseNotes/labkey/components.md).

## Development

### Getting Started
If you are building the components locally, you will need to do the following to prepare your system.

#### 1. Install yarn

[Yarn](https://yarnpkg.com) is a package manager much like npm.
There a couple of different ways to install yarn. If you have npm you can do a global install:

```sh
npm install yarn -g
```

If you are working on a Mac and have [Homebrew](https://brew.sh/) you can install using:

```sh
brew install yarn
```

Yarn should now be available on the command line.

#### 2. Clone and Build

Now that yarn is set up, you can go ahead and clone this repository to a local directory.

```sh
git clone https://github.com/LabKey/labkey-ui-components.git # or via ssh
```

Navigate into the packages/components directory and run:

```sh
yarn install
```

This will install all dependencies for the component packages.
Once this is complete you can utilize yarn to build and test the package.

```sh
yarn build
yarn test
```

### Technologies
For doing development of LabKey UI Components, you should be familiar with the following technologies:
* [React](https://reactjs.org/) - used for building the UI components
* [Bootstrap](https://getbootstrap.com/docs/3.4/) - for consistent, responsive styling
* [React-Bootstrap](https://5c507d49471426000887a6a7--react-bootstrap.netlify.com/) - bootstrap styling for react components
* [Typescript](https://www.typescriptlang.org/docs/home.html) - for typing of javascript objects
* [Jest](https://jestjs.io/docs/en/getting-started.html) - For unit testing of components
* [Enzyme](https://airbnb.io/enzyme/) - Testing utility library
* [Storybook](https://storybook.js.org/) - For use in manual testing and exploration of features outside of an application

Note that we are currently not using the latest versions of Bootstrap, React-Bootstrap and Typescript because there
have been some significant changes between our current version and the latest version of these libraries, so when looking for docs,
be sure to look at the ones corresponding to the version we are using.

And, for building, we use
* [Yarn](https://yarnpkg.com) - package manager and build tool

### Best Practices
You should do pretty well to follow the styles and practices currently represented in the code, but here are
some guides to best practices for doing front-end development:
* [Alan's Guidelines](https://docs.google.com/presentation/d/1hW9gYbWhW6spr7uhAjpKBNl3hWPXUOPbmlwD6UkYWE8/edit?pli=1#slide=id.g5627a1f538_0_120)
* [Airbnb Style Guide](https://github.com/airbnb/javascript)

Generally, when doing development, you should:

* Place source code in a `src` subdirectory.
* Place typing files in a `src/typings` subdirectory.
* Add documentation a-plenty and update the package `README.md` release notes as you add/fix/update the package.

### Local Development

When making modifications to the existing package, you should:
* Use an alpha version number for the package of the form `X.Y.Z-fb-my-branch-name.0`, where `X.Y.Z` is your best guess at the
next [SemVer](https://semver.org/) version that will include your changes, `fb-my-branch-name` is the name of your
feature branch with underscores replaced by hyphens and the `.0` is just a starting point for the prerelease versioning. This `.0`
version will be incremented with each alpha package version you want to publish and test in your LabKey module.
Note that the version number within the `package.json` file will be set while running the  `yarn publish` command.  See [below](#version-numbering) for
 more on version numbering.
* Update the `releaseNotes/labkey/components.md` file to document what is changing in this version. Note that the final release
version number and date will be set just before you merge your feature branch.
* Write [jest](https://jestjs.io/docs/en/getting-started.html) tests together with [enzyme](https://airbnb.io/enzyme/) to test
non-rendering functions and rendering of components with different sets of parameters.  Jest
tests should be preferred over other types of tests since they are quick to run and small enough to be easily understood,
but they should generally not try to do a lot of interaction with the components. You can, however, validate that callbacks
passed to a component are called when expected.  See existing `.spec.ts` files for examples.
* Write jest tests that use actual server responses where needed.  We have several examples of tests using `xhr-mock`
for reading in realistic data that can be captured from the server.
* Write or update [storybook stories](#storybook) that illustrate the functionality.  This is the easiest way to do the bulk of manual
testing and iteration on display updates.  Again, we have several examples of stories that use actual data captured
from the server for various Ajax calls that are required.
* Test within the application, using a published alpha package version, once display and functionality are as expected from within storybook.

#### Getting @labkey/components packages to the application

While you can [publish](#publishing) a pre-release version of the glass packages and then update your application's `package.json`
to reference the new pre-release version in order to view the changes within the application, you will likely want to
be able to do this without publishing for quicker development iteration.

In order to use and test the components you are developing or modifying in this repository within another application,
we currently recommend using `yarn watch` together with a copy command from the `dist` directory to the `node_modules/@labkey/components`
directory of your application. The `watch` command will automatically build a package when the source code changes.  If you have hot reloading started for your application, after you copy the `dist` directory, changes made in the components
will then get loaded into the application.

For example, to test changes in `@labkey/components` within the `my_app` module, you could do:
* ``yarn watch``
* edit files within the `package/components` dir
* wait for recompile triggered by the `watch` to happen
* ``cp -r dist /path/to/my_app/node_modules/\@labkey/components/dist``
* use [hot module reload mode](https://github.com/LabKey/platform/tree/develop/webpack#developing-with-hot-module-reloading-hmr) in your module to test changes


We do not currently recommend using [`npm link`](https://docs.npmjs.com/cli/link.html) (or [`yarn link`](https://yarnpkg.com/lang/en/docs/cli/link/)).  It seems promising,
but when used it produces an empty page in the application in many cases and the following type of error in the console:
```
react-dom.development.js:55 Uncaught Invariant Violation: Element ref was specified as a string (reactSelect) but no owner was set. This could happen for one of the following reasons:
1. You may be adding a ref to a function component
2. You may be adding a ref to a component that was not created inside a component's render method
3. You have multiple copies of React loaded
```
I believe this happens because the `node_modules` directory within this directory contains all of the dependencies for the package,
including the ones that are excluded in our bundling of the package since they are also included by the application.
This includes, most notably, a copy of `react`.  When the application loads it will get one copy of react from this
`node_modules` and one copy from its own `node_modules` and unhappiness ensues.  There are probably things we can do to
fix this, but for now use watch and copy instead.

### Package Dependencies
We track our external dependencies in [this spreadsheet](https://docs.google.com/spreadsheets/d/1W39yHLulzLUaXhp5-IRFuloJC9O94CJnwEHrR_4CcSo/edit#gid=0)
in order to maintain notes about the cost of updating our various packages.  To do package updates, use the
```
yarn outdated
```
command to show which packages are out of date and then compare to the spreadsheet to determine if there has already
been investigation into the cost of upgrading packages that are out of date.

### Documentation
We use [typedoc](https://www.npmjs.com/package/typedoc) for generating our documentation.  This documentation is published to [GitHub pages](https://labkey.github.io/labkey-ui-components/).

All exported components, methods, interfaces, etc. should include
documentation.  You can use the supported [JavaDoc tags](https://typedoc.org/guides/doccomments/) to provide additional explanations for parameters, return values, etc. as well as for indicating that some objects should not have documentation generated for them.

You can generate the docs locally by running the following command in the ```labkey-ui-components/packages/components``` directory.
* ``yarn run build:docs``

**N.B.** This command produces a good number of errors from Typescript not being able to resolve classes and such.
Try to eliminate as many of these as possible before deploying the docs.

To publish the documentation to [GitHub pages](https://labkey.github.io/labkey-ui-components/) use the following command in the ```labkey-ui-components/packages/components``` directory:
* ``yarn run deploy:docs``

This deployment of docs should be done after each pull request is merged into ```master```.

### Storybook

A great way to view and play with these components is via [Storybook](https://storybook.js.org/). This is a tool that is used to deploy components in a functional environment which runs the components according to "stories".
These stories are composed by developers to show features of a component and let other members of the team interact with a component. Because storybook uses WebPack's hot reloading,
this is also a great way to do visual inspection and testing of your components in isolation.

For each component that is developed a set of stories that illustrate the components should also be created.  We follow these
conventions currently:
* The configuration files for storybook are in the `.storybook` directory.
* Stories are placed the directory `src/stories` with the names of the story files the same as the names of the respective components
* The [addon-knobs](https://www.npmjs.com/package/@storybook/addon-knobs) package is used for parameterizing the stories so a user can
explore the different options available within a component.

You can start up Storybook via:

```sh
yarn run storybook

# The storybook instance is now available at http://localhost:9001
```

When changes are made to the source code or .scss files for the components or the stories, the storybook instance will automatically reload.

### Linting
**In an effort to maintain consistent formatting, use best practices and catch errors before they reach production, it
is highly recommended to lint any files you've changed before merging them to master.**

#### Commands

```shell script
# Lints files matching file path glob without any auto-formatting or fixing
yarn run lint <file path>

# Lints, auto-formats, and fixes files matching file path glob
yarn run lint-fix <file path>

# Lints files with uncommitted local changes without auto-formatting or fixing
yarn run lint-precommit

# Lints, auto-formats, and fixes files with uncommitted local changes
yarn run lint-precommit-fix

# Lints files that have been modified in the branch without auto-formatting or fixing
yarn run lint-branch

# Lints, auto-formats, and fixes files that have been modified in the branch
yarn run lint-branch-fix

```

**Using `lint-branch-fix`**:

This script will automatically format, lint and attempt to fix lint errors in files that have been changed
in your feature branch. This will only detect changed files that have been committed and pushed to GitHub in the
feature branch your local repo is on. You can run this as many times as you want. It does not automatically commit
the fixes, giving you an opportunity to review the fixes and the generated warnings before committing.
Not all warnings are must fix, they are there for your consideration.

**Using `lint-precommit-fix`**:

This script is exactly the same as lint-branch-fix, except it runs only on files with uncommitted changes.

A couple of possible workflows would be either to run `lint-precommit-fix` before every commit; or to do some
commits and pushes then run lint-branch-fix and iterate fixing the warnings and using `lint-precommit-fix` to check
if they are cleared before committing the fixes.

**Working with file paths**

Any command with a file path should make the file path relative to the `/packages/components` directory.
The format of the file path should match node file path format and be in double quotes. This ensures node resolves the file
path instead of relying on your OS shell.  Some examples:

```shell script
# Single file
yarn run lint "./src/components/files/FileTree.tsx"

# All files in a directory
yarn run lint-fix "./src/components/files/*"

# Recursively all files in a directory and its sub-directories
yarn run lint-fix "./src/components/**/*"
```

## Publishing

### Credentials
In order to publish, you will need to set up your npm credentials.  Follow [these instructions](https://www.labkey.org/Documentation/_PremiumResources/wiki-page.view?name=npmrc) to create your .npmrc file.
If you do not have permissions to publish to this repository, contact a LabKey Artifactory administrator who can grant you those permissions.


### Version numbering

When updates are made to any @labkey npm package, the version number updates will follow [SemVer](https://semver.org/).
The next version you go to for a package should be based on the following guidelines:
1. Am I fixing a bug but not adding anything new - use the next patch version
1. Am I adding something new, but not changing anything that already existed - use the next minor version
1. Am I breaking something existing because of my changes - use the next major version

With that in mind, we want to make use of "prerelease" version numbers while a feature / story is being developed
and only go to that next “release” version right before the feature branch on labkey-ui-components is ready to
merge back to master.

Steps for package version numbering during feature branch development:
1. Create your feature branch off of master, i.e. fb_feature_1, and add your changes.
1. When you are ready to push an alpha version up to Artifactory so you can test it in your application and
on TeamCity, update the `package.json` version for that package. Ex. if adding a new feature and the current version is `0.1.0`,
you would use `0.2.0-fb-feature-1.1`.
1. If you make further edits to your feature branch and need to push new alpha versions, you would just bump the last
digit in your package version number (e.g., `0.2.0-fb-feature-1.2`, `0.2.0-fb-feature-1.3`, etc.).
1. Once your feature branch is complete and ready to merge, you do one more package version update to what will be the
"release" version (i.e. `0.2.0` in this scenario) and then build/publish and complete the merge. Don't forget to update
the release notes in your package's `README.md` file for this version number. And don't forget to update your application
package.json for this new version number (if that applies).
1. Once merged and the "release" version has been pushed to Artifactory, you can then go to Artifactory and delete your
alpha versions of that package for this feature branch.

### Publishing commands

From the package root (not the repository root!) of the package you want to update (e.g. `packages/components`) run:

```sh
yarn publish
```

This will prompt you for the new version.  Choose a version increment in accordance with [SemVer](https://semver.org/).  This command will
update the `package.json` file and commit that change.  Then you can do a `git push` to get the update into the remote repository.

## Merging changes into master

1. Message the Frontend dev room chat about starting the pull request merge. This is to make sure two people aren't
merging at the same time which might result in conflicting package version numbers.
1. Do one final merge of the `master` branch into your feature branch for `labkey-ui-components`.
1. Run one final lint of your changes, `yarn run lint-branch-fix`, and review the changes applied.
1. Update the `releaseNotes/labkey/components.md` file with what will be your release version number and release date.
1. Run the commands to build, test, and publish: `yarn build`, `yarn test`, `yarn publish`.
1. Push your final set of commits from `labkey-ui-components` to github so that TeamCity can do a final run of the jest tests.
1. Update any LabKey module `package.json` files where you are using / applying these changes with this final release version
number (then do the regular `npm install` for that module, build, etc. and push those `package.json` and `package-lock.json` file
changes to github as well).
1. Remove any of the alpha package versions from [Artifactory](https://artifactory.labkey.com/artifactory/webapp/#/home)
that you had published during development for this feature branch.
    1. Navigate to the `@labkey/components` [tree node](https://artifactory.labkey.com/artifactory/webapp/#/artifacts/browse/tree/General/libs-client-local/@labkey/components/-/@labkey)
    of the `libs-client-local` artifact.
    1. Right click on the name of the alpha package version in the tree on the left and choose `delete` (or use the
    `Actions > Delete` in the upper right), note that you must be logged in to see this option.
1. Check on the [TeamCity](https://teamcity.labkey.org) build status and jest test status.
1. Merge the pull requests for `labkey-ui-components` and any of your related LabKey modules / repos.
1. Message the Frontend dev room chat that the merge is complete.

## Making hotfix patches to a release branch

Occasionally we will need to patch a version of the `@labkey/components` package to fix a bug in a previous release of
LabKey server. There are a few extra steps in this process, described below:

1. Find the `@labkey/components` package version number to patch by looking at the package versions that are used
 in the `package.json` files of the LabKey module that you plan to update. The version number to branch from needs to
 be the latest bug fix version greater than the version in use by the package where the update is required.
 That is, if the module uses `0.41.2`, but we have already produced `0.41.3` and `0.41.4`, you need to use `0.41.4` as the
 branch starting point since you'll presumably be making another bug fix release and can't use the versions already published.
1. Once you know that package version number, track down the commit hash for it in
 the [github commit list](https://github.com/LabKey/labkey-ui-components/commits/master) off of the master branch.
1. Create the release branch using that commit hash, `git checkout -b release20.3-SNAPSHOT <commit hash>`, and
 push that release branch to github.
1. Create a new hotfix branch off of that new release branch, `git checkout -b 20.3_fb_myFeatureBranchWithFixes`.
1. Use the regular process to develop and test your changes and push those changes up to github.
1. Create the pull request from your new hotfix feature branch and set the target of the pull request to the release branch.
1. After all code review and triage is complete and you are ready to merge, do the regular merge steps for
 `labkey-ui-components` (see the steps in the section above). Note that the new release version you will use for your changes
 will be the next patch version off of the target package version for that release. For example if the veresion was at
  `0.31.3` then you will publish version `0.31.4`.
1. After any related LabKey module changes have been merged from their repo's release branch to develop,
 create a new branch in `labkey-ui-components` off of master in order to merge forward your hotfix changes:
    1. Get the latest from the hotfix branch:
        1. `git checkout release20.3-SNAPSHOT`
        1. `git pull`
    1. Checkout master so that you can branch off of it:
        1. `git checkout master`
        1. `git pull`
    1. Create a new branch and merge in the hotfix changes:
        1. `git checkout -b fb_mergeFrom203`
        1. `git merge release20.3-SNAPSHOT`
    1. Treat this new branch as a regular feature branch off of master (i.e. publish an alpha package to test in platform/etc.,
        review TeamCity results, get code review, merge as usual using the steps in the section above).

