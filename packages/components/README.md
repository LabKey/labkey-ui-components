# @labkey/components

[API Docs](./docs/public.md) | [Change Log](./releaseNotes/labkey/components.md) | [License](./LICENSE.txt) | [![Build Status](https://teamcity.labkey.org/app/rest/builds/buildType:(id:LabKey_Trunk_Premium_InternalSuites_GlassComponentsUnitTest)/statusIcon)](https://teamcity.labkey.org/viewType.html?buildTypeId=LabKey_Trunk_Premium_InternalSuites_GlassComponentsUnitTest)

This package contains React components, models, actions, and utility functions for LabKey applications and pages.

## v1.0.0 - Official Stable Release
v1.0.0 is the first stable release of `@labkey/components`. This version includes components that are part of the public
API along with components used internally within LabKey.

The source code in this package is split into two main directories under the `/src` directory: `internal` and `public`.
The React components, models, etc. in the `internal` directory are either purely for implementation purposes or not yet
stable enough to be included as part of the public API. As components become more stable they will be moved to the
`public` directory and added to the public API documentation with future `@labkey/component` package versions.

Please see the [Public API Docs](./docs/public.md) for further details.

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
* [Immer](https://immerjs.github.io/immer/docs/introduction) - for immutability of normal JavaScript objects, arrays, Sets, and Maps.
* [Jest](https://jestjs.io/docs/en/getting-started.html) - for unit testing of components
* [Enzyme](https://airbnb.io/enzyme/) - testing utility library
* [Storybook](https://storybook.js.org/) - for use in manual testing and exploration of features outside of an application

Note that we are currently not using the latest versions of Bootstrap, React-Bootstrap and Typescript because there
have been some significant changes between our current version and the latest version of these libraries, so when looking for docs,
be sure to look at the ones corresponding to the version we are using.

And, for building, we use
* [Yarn](https://yarnpkg.com) - package manager and build tool

### Local Development

See the [related document](./docs/localDev.md) for further details on internal processes for doing local
development on this package.
