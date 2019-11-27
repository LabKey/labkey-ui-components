# @labkey/dependencies

The `package.json` file in this directory is used to define the base set of shared npm 
package dependencies that application pages developed in a LabKey module should build from. 
This will not be an exhaustive list, but should be those packages which we expect many or all
of the Labkey developed application pages to use. 

## Using this package

1. Make sure you have the `@labkey` scope defined in a `.npmrc` file in your module root directory 
(see example at `<labkey>/server/modules/experiment/.npmrc`).
1. In your `package.json`, add `@labkey/dependencies` to your `dependencies`

## Adding / updating a dependency

TODO: fill out this section after discussing with the client side developer group. 

## Publishing

The published versions of this package are stored on the [LabKey Artifactory](https://artifactory.labkey.com) repository.
In order to publish a new version of this `@labkey/dependencies` package, you will need to set 
up your npm credentials.  Follow [these instructions](https://internal.labkey.com/wiki/Handbook/Dev/page.view?name=npmrc) to 
create your .npmrc file. If you do not have permissions to publish to this repository, 
contact a local Artifactory administrator who can grant you those permissions.

To publish, increment the version number in accordance with [SemVer](https://semver.org/) 
and commit. Then from the `<labkey>/webapps/dependencies` directory run:

```
npm publish
```