# Local Development for @labkey/components

### Best Practices
You should do pretty well to follow the styles and practices currently represented in the code, but here are
some guides to best practices for doing front-end development:
* [Alan's Guidelines](https://docs.google.com/presentation/d/1hW9gYbWhW6spr7uhAjpKBNl3hWPXUOPbmlwD6UkYWE8/edit?pli=1#slide=id.g5627a1f538_0_120)
* [Airbnb Style Guide](https://github.com/airbnb/javascript)
* [Immer for immutability](./immer.md)
* [QueryModel API](./QueryModel.md)
* [Jest Testing Recommendations](./jest.md)

Generally, when doing development, you should:

* Place source code in a `src` subdirectory (note the distinction between the `internal` code and `public` code.
* Place typing files in a `src/typings` subdirectory.
* Add documentation a-plenty and update the package [release notes](../releaseNotes/components.md) as you add/fix/update the package.

### Local Development

When making modifications to the existing package, you should:
* Use an alpha version number for the package of the form `X.Y.Z-fb-my-branch-name.0`, where `X.Y.Z` is your best guess at the
next [SemVer](https://semver.org/) version that will include your changes, `fb-my-branch-name` is the name of your
feature branch with underscores replaced by hyphens and the `.0` is just a starting point for the prerelease versioning. This `.0`
version will be incremented with each alpha package version you want to publish and test in your LabKey module. See
[below](#version-numbering) for more on version numbering.
* Update the `releaseNotes/labkey/components.md` file to document what is changing in this version. Note that the final release
version number and date will be set just before you merge your feature branch.
* See the [publishing](#publishing) section for how to publish a package.

#### Testing

* Write [jest](https://jestjs.io/docs/en/getting-started.html) tests for your React components, models, and utility functions.
    * See additional documentation on [Jest testing recommendations](./jest.md).
* Test within the application using a published alpha package version.
Alternatively, you can get faster dev iteration by using the `npm run start-link` command from your LabKey module (see details below).

#### Getting @labkey/components packages to the application

While you can [publish](#publishing) a pre-release version of the components packages and then update your application's `package.json`
to reference the new pre-release version in order to view the changes within the application, you will likely want to
be able to do this without publishing for quicker development iteration.

In order to use and test the components you are developing or modifying in this repository within another application,
we currently recommend using the LabKey module's `npm run start-link` command. This command will link to the @labkey
package src code in a way that includes it in the files being watched and built by the HMR command.
This means that changes made in the @labkey packages will then get re-built into the application alongside the Labkey
module React code changes.

For example, to test changes in `@labkey/components` within the `my_app` module, you could do:
* `npm run start-link` in the `my_app` module dir to use
[hot module reload mode](../../build/webpack/README.md#developing-with-hot-module-reloading-hmr) in your module
with webpack aliases enabled for package linking
* edit files within the `package/components` dir
* see changes reflected in your `appDev` LabKey page/view

### Package Dependencies
We track our external dependencies in [this spreadsheet](https://docs.google.com/spreadsheets/d/1W39yHLulzLUaXhp5-IRFuloJC9O94CJnwEHrR_4CcSo/edit#gid=0)
in order to maintain notes about the cost of updating our various packages.  To do package updates, use the
```
npm outdated
```
command to show which packages are out of date and then compare to the spreadsheet to determine if there has already
been investigation into the cost of upgrading packages that are out of date.

### Linting
In an effort to maintain consistent formatting, use best practices and catch errors before they reach production, it
is highly recommended to lint any files you've changed before merging them to develop.

#### Commands

```shell script
# Lints files matching file path glob without any auto-formatting or fixing
npm run lint <file path>

# Lints, auto-formats, and fixes files matching file path glob
npm run lint-fix <file path>

# Lints files with uncommitted local changes without auto-formatting or fixing
npm run lint-precommit

# Lints, auto-formats, and fixes files with uncommitted local changes
npm run lint-precommit-fix

# Lints files that have been modified in the branch without auto-formatting or fixing
npm run lint-branch

# Lints, auto-formats, and fixes files that have been modified in the branch
npm run lint-branch-fix

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
npm run lint "./src/components/files/FileTree.tsx"

# All files in a directory
npm run lint-fix "./src/components/files/*"

# Recursively all files in a directory and its sub-directories
npm run lint-fix "./src/components/**/*"
```

### Package Bundle Size
Periodically we should review the @labkey/components package bundle size to make sure that there
aren't any inadvertent dependencies or files getting included in the bundle. To do this, we have
used the `webpack-bundle-analyzer` npm package. See [docs](https://github.com/webpack-contrib/webpack-bundle-analyzer) for more details.

You can analyze the bundle size for any of our npm packages by running the following command:
```
npm run build-analyze
```
For analyzing the bundle size of one of the applications, you can do the same using the npm command:
```
npm run build-analyze
```

### Adding an entry point / subpackage to @labkey/components
1. Create a new top level directory in the `packages/components/src` directory for your subpackage
   1. add a new `index.ts` file in this directory
   2. move any components, utils, actions, models that you are going to export from this subpackage into this directory
   3. Note: any code in this subpackage should not be imported / used by the code in the `src/internal` directory
2. Update the `packages/components/package.config.js` file to add the new entry
   1. adding the `import` path to the `index.ts` file mentioned in step 1.i
   2. in most cases, the new entry will also `dependOn: 'components'`
3. Update the `packages/components/package.json` file to add the new subpackage
   1. add to `"exports"` to indicate the location of the subpackage generated JS file
   2. add to `"typesVersions"` to indicate the location of the subpackage typings file
4. Update the `packages/build/webpack/constants.js` file to add the subpackage alias
   1. add to the TypeScript config `"compilerOptions"` to indicate the src code path for the subpackage
   2. add to the `"aliases"` `LABKEY_PACKAGES_DEV` object to setup an alias for the subpackage src code
5. Update the `packages/build/webpack/package.config.js` file to add the new subpackage to the `"externals"` array
   1. this will keep the subpackage JS code from being bundled with the downstream LabKey npm packages

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

### Steps

With that in mind, we want to make use of "prerelease" version numbers while a feature / story is being developed
and only go to that next “release” version right before the feature branch on labkey-ui-components is ready to
merge back to develop.

Steps for package publishing during feature branch development:
1. Create your feature branch off of develop, i.e. `fb_my_branch`, and add your changes.
1. When you are ready to push an alpha version up to Artifactory so you can test it in your application and
on TeamCity, run the prerelease command `npm version prerelease --preid=X` where `X` is your branch name,
i.e. `npm version prerelease --preid=fb-branch-name`.
Note, it is recommended to use `-` in place of `_` as it is better supported in filesystems.
1. This will update the version in the `package.json` and `package-lock.json`. Commit these changes using a message
like `@labkey/components@X.Y.Z-fb-my-branch-name.N`.
1. Run the `npm publish` command from the package root directory. This command will verify the build and publish the package.
1. If you make further edits to your feature branch and need to push new alpha versions, you can simplify the
prerelease command to `npm version prerelease` and it will bump the alpha version. Commit these changes the same
way as before.
1. Once your feature branch is complete and ready to merge, you do one more package version update to what will be the
"release" version (i.e. `0.2.0` in this scenario).
1. First update the release notes for the package for the version you're about to publish. Commit these changes.
1. Now you can set the package version by once again running the `npm version` command, however,
this time the first argument will be one of `patch`, `minor`, or `major` depending on the change you've made.
See [npm version](https://docs.npmjs.com/cli/v8/commands/npm-version?v=true) command documentation for more details.
1. Commit the version and then run the `npm publish` command.
1. Once merged and the "release" version has been pushed to Artifactory, you can then go to Artifactory and delete your
alpha versions of that package for this feature branch.

## Merging changes into develop

### labkey-ui-components

1. Do one final merge of the `develop` branch into your feature branch for `labkey-ui-components`.
2. Run one final lint of your changes, `npm run lint-branch-fix`, and review the changes applied.
3. Update the `releaseNotes/labkey/components.md` file with what will be your release version number and release date.
4. Run the commands to build and test: `npm run build`, `npm test`.
5. Push your final set of commits from `labkey-ui-components` to GitHub so that TeamCity can do a final run of the jest tests.
6. Message the Frontend dev room chat about starting the pull request merge. This is to make sure two people aren't
   merging at the same time which might result in conflicting package version numbers.
7. Check on the [TeamCity](https://teamcity.labkey.org) build status and jest test status (also shown in the PR).
8. Run the command to publish: `npm publish`.
9. Merge the pull requests for `labkey-ui-components`.
10. Message the Frontend dev room chat that the merge is complete.

### LabKey modules

1. Update any LabKey module `package.json` files where you are using / applying these changes with this final release version
number (then do the regular `npm install --legacy-peer-deps` for that module, build, etc. and push those
`package.json` and `package-lock.json` file changes to github as well).
2. Merge the PRs for your LabKey module changes.
3. Remove any of the alpha package versions from [Artifactory](https://labkey.jfrog.io/artifactory/webapp/#/home)
that you had published during development for this feature branch.
   - To do this all at once and for all packages, use the `prugeNpmAlphaVersions` gradle task as follows:
   ```commandline
       ./gradlew purgeNpmAlphaVersions -PalphaPrefix=fb-feature-1
   ```
   This will walk through **all the `@labkey` packages** and find those whose version numbers include this alpha prefix
   (i.e., those that match the pattern .*-alphaPrefix\\..\*).  If you want to see what would be deleted without
   actually doing the deletion attach a `-PdryRun` property to the command
   ```commandline
       ./gradlew purgeNpmAlphaVersions -PalphaPrefix=fb-feature-1 -PdryRun
   ```
    - Alternatively, you can do this manually and one at a time:
       1. Navigate to the `@labkey/components` [tree node](https://labkey.jfrog.io/artifactory/webapp/#/artifacts/browse/tree/General/libs-client-local/@labkey/components/-/@labkey)
    of the `libs-client-local` artifact.
       1. Right click on the name of the alpha package version in the tree on the left and choose `delete` (or use the
    `Actions > Delete` in the upper right), note that you must be logged in to see this option.

## Making hotfix patches to a release branch

Occasionally we will need to patch a version of the `@labkey/components` package to fix a bug in a previous release of
LabKey server. There are a few extra steps in this process, described below:

1. Find the `@labkey/components` package version number to patch by looking at the package versions that are used
 in the `package.json` files of the LabKey module that you plan to update. The version number to branch from needs to
 be the latest bug fix version greater than the version in use by the package where the update is required.
 That is, if the module uses `0.41.2`, but we have already produced `0.41.3` and `0.41.4`, you need to use `0.41.4` as the
 branch starting point since you'll presumably be making another bug fix release and can't use the versions already published.
1. Once you know that package version number, track down the commit hash for it in
 the [github commit list](https://github.com/LabKey/labkey-ui-components/commits/develop) off of the develop branch.
1. Create the release branch using that commit hash, `git checkout -b release20.3-SNAPSHOT <commit hash>`, and
 push that release branch to github.
1. Create a new hotfix branch off of that new release branch, `git checkout -b 20.3_fb_myFeatureBranchWithFixes`.
1. Use the regular process to develop and test your changes and push those changes up to github.
1. Create the pull request from your new hotfix feature branch and set the target of the pull request to the release branch.
1. After all code review and triage is complete and you are ready to merge, do the regular merge steps for
 `labkey-ui-components` (see the steps in the section above). Note that the new release version you will use for your changes
 will be the next patch version off of the target package version for that release. For example, if the version was at
  `0.31.3` then you will publish version `0.31.4`.
1. After any related LabKey module changes have been merged from their repo's release branch to develop,
 create a new branch in `labkey-ui-components` off of develop in order to merge forward your hotfix changes:
    1. Get the latest from the hotfix branch:
        1. `git checkout release20.3-SNAPSHOT`
        1. `git pull`
    1. Checkout develop so that you can branch off of it:
        1. `git checkout develop`
        1. `git pull`
    1. Create a new branch and merge in the hotfix changes:
        1. `git checkout -b fb_mergeFrom203`
        1. `git merge release20.3-SNAPSHOT`
    1. Treat this new branch as a regular feature branch off of develop (i.e. publish an alpha package to test in platform/etc.,
        review TeamCity results, get code review, merge as usual using the steps in the section above).
