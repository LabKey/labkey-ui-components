# LabKey Module React Page Development

This directory contains the shared [webpack] configurations to develop and build
[React] pages within a LabKey module. These files include configurations for
building both production and development mode LabKey React Pages in a standard way.

Note that if build customizations are needed for a given module, the module can opt out of these shared
configurations by setting up its own webpack config files and pointing the build scripts in the
module's `package.json` file at them.

### How to use the shared webpack config files

1. Add the `@labkey/build` package to your module's `package.json` devDependencies.
1. Add/update the `scripts` in your `package.json` to reference the relevant config file in
    `node_modules/@labkey/build/webpack`. See examples from the [experiment] module.
    1. use one of the three configuration files based on your script target: `prod.config.js`, `dev.config.js`,
        `package.config.js`, or `watch.config.js`
    1. make sure to pass the following environment variables as part of your webpack command:
        1. `NODE_ENV` - development or production
        2. `PROD_SOURCE_MAP` - optional source map setting for the production webpack config to use,
           defaults to `nosources-source-map`

### How it works

Each new LabKey React page `entryPoint` will be defined within the module where the relevant actions
and code live. Each `entryPoint` will have output files generated as part of the
[LabKey Gradle build] steps for that module. The artifacts will be generated and placed into the
standard LabKey `views` directory to make the pages available to the server through the module's
controller. The generated `<entryPoint>.html` and `<entryPoint>.view.xml` files will be placed in the
`<module>/resources/views/gen` directory and the generated JS/CSS artifacts will be placed in the
`<module>/resources/web/gen` directory.

If your `entryPoint` is to be used in a JSP or included in another LabKey page and you don't want to expose it
directly as its own `view`, you can set the `generateLib` property for your `entryPoint`. This will generate
the same JS/CSS artifacts in the `<module>/resources/web/gen` directory but will skip the `resources/views`
generation step and instead create an `<entryPoint>.lib.xml` file in the `<module>/resources/web/gen` directory.
This lib.xml can then be used in your JSP or other LabKey page. You can see an example of this in the experiment
[entryPoints.js] file.

### Setting up a LabKey module

To configure a LabKey module to participant in the React page build process:
1. Add the following files to your module's main directory:
    1. `package.json` - Defines your module's npm build scripts, see [experiment] module example, and npm package
        dependencies. Note that after your first successful build of this module after adding this,
        a new `package-lock.json` file will be generated. You will want to add that file to your git repo
        and check it in as well. Note that in this file the `npm clean` command might need to be adjusted
        if your module already has files in the `resources/views` directory.
    1. `.npmrc` - Defines the Artifactory registry path for the `@labkey` scope, if you
        plan to use any of the Labkey npm packages for your page.
        See example in study module's [.npmrc] file.
    1. `README.md` - Add your own README file for your module and have it point back to this page
        for the steps in the [Adding a new entryPoint](#adding-a-new-entrypoint) section of this document.
1. Create the `<module>/src/client` directories and add a file named `entryPoints.js`, more on this in
    the [Adding a new entryPoint](#adding-a-new-entrypoint) section of this doc.
1. Update the `<module>/.gitignore` file so that it knows to ignore your module's `node_modules` directory
    and generated JS/CSS artifacts.

You can see examples of each of these files in the following LabKey modules:
[assay], [experiment], and [pipeline].

### Building LabKey React pages

You can install the necessary npm packages and build the module by running the standard module
gradlew tasks, `./gradlew deployApp` or `./gradlew :server:modules:<module>:deployModule`.
You can also run one of the following npm commands directly from the module's main directory:
```
npm run setup
npm run build
npm run build-dev
npm run build-prod
```

To clean the generated client-side artifacts from the module:
```
npm run clean
```

### Adding a new entryPoint

To add a new `entryPoint` for a LabKey React page:
1. Create a new directory for your client code and React components at `<module>/src/client/<ENTRYPOINT_NAME>`.
1. Add a new entry point definition to the `<module>/src/client/entryPoints.js` file. This will allow
    for the client-side build process to pick up your new files and generated the relevant artifacts.
    For the new entry point, set the following properties:
    1. `name=<action name for the entryPoint page>`
    1. `title=<page title>`
    1. `permissionClasses=[<view.xml permissionClassType>]` (optional)
    1. `path=<entryPoint code path from step #1>`
1. In your `src/client/<ENTRYPOINT_NAME>` dir, create an `app.tsx` file and a `dev.tsx` file based on
    an example from one of the existing app pages. Add your main app React component file,
    `<ENTRYPOINT_NAME>.tsx`, and any other components, models, actions,
    etc. in the `<module>/src/client/<ENTRYPOINT_NAME>` directory.
1. Run the `./gradlew deployModule` command for your module and verify that your new generated files
    are created in your module's `resources` directory.

### Developing with Hot Module Reloading (HMR)

To allow updates made to TypeScript, JavaScript, CSS, and SCSS files to take effect on your LabKey
React page without having to manually build the changes each time, you can develop with Hot Module
Reloading (HMR) enabled via a webpack development server. You can run the HMR server from the
`trunk/server/modules/<module>` directory via the `npm start` command. Once started, you
will need to access your page via an alternate action name to view the changes. The server action
is `module-entryPointDev.view` instead of the normal `module-entryPoint.view`.

Note that by default modules that use this shared configurations package for the webpack development
server are set to use the same port number for the HMR environment. This means that you can have
only one module's HMR mode enabled at a time. If you try to run `npm start` for a second module, you
will get an error message saying that the `address is already in use`.

To enable HMR:
```
cd trunk/server/modules/<module>
npm run start
```

For those modules that use other @labkey packages (e.g., `@labkey/components` or `@labkey/workflow`), you can run
the start command with linking enabled so that the HMR environment will alias to the source repository `/src` directory.
This means that the source code from those packages will be included in the HMR for the module so that changes in those
packages are automatically seen and re-built into the application.

In order to use this linking option, you must set a `LABKEY_UI_COMPONENTS_HOME` environment variable on your
machine with the absolute path to your `labkey-ui-components` enlistment.

To enable HMR with @labkey package linking:
```
npm run start-link
```

### Making changes to these webpack configuration files

If you need to make changes to these webpack configuration files and want to test them in your module client-side
build before publishing a new `@labkey/build` version, you can do one of the following:

1. Make direct edits in your module's `node_modules/@labkey/build/webpack` directory
2. Make changes in this directory and then copy the `/webpack` directory contents to your module's
    `node_modules/@labkey/build/webpack` directory

[React]: https://reactjs.org
[webpack]: https://webpack.js.org/
[LabKey Gradle build]: https://www.labkey.org/Documentation/wiki-page.view?name=gradleBuild
[assay]: https://github.com/LabKey/platform/tree/develop/assay
[experiment]: https://github.com/LabKey/platform/tree/develop/experiment
[pipeline]: https://github.com/LabKey/platform/tree/develop/pipeline
[experiment]: https://github.com/LabKey/platform/blob/develop/experiment/package.json
[entryPoints.js]: https://github.com/LabKey/platform/blob/develop/experiment/src/client/entryPoints.js
[.npmrc]: https://github.com/LabKey/platform/blob/develop/experiment/.npmrc
