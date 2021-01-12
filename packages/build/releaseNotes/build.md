# @labkey/build

### version TBD
*Released*: TBD
* Remove postcss-loader

### version 1.1.0
*Released*: 11 January 2021
* Add option to add permissionClasses to entry points

### version 1.0.0
*Released*: 7 January 2021
* postcss-loader: inline the postcss.config.js properties

### version 0.5.1
*Released*: 22 December 2020
* Dependabot package updates

### version 0.5.0
*Released*: 16 December 2020
* Item 8226: Add support for webpack aliasing of @labkey/workflow package

### version 0.4.1
*Released*: 11 November 2020
* Add tsconfig path for freezerManagerPath

### version 0.4.0
*Released*: 28 October 2020
* Add explicit package.json dependencies for @labkey/build

### version 0.3.0
*Released*: 28 October 2020
* Generate files into views/gen instead of views for better cleaning and caching possibilities

### 0.2.0
*Released*: 27 October 2020
* Use a LABKEY_UI_COMPONENTS_HOME environment variable from the user's setup to define the
    path for the webpack aliasing of @labkey packages when using "npm run start-link"

### version 0.1.0
*Released*: 26 October 2020
* Initial package contents with webpack config assets ported over from platform/webpack (with additions to fit scenarios from other modules)
* Conditionalize labkeyUIComponentsPath in webpack/constants.js based on LK_MODULE_CONTAINER
* Add optional npm start port WATCH_PORT webpack env var
* Add optional LINK webpack env var to toggle @labkey/components resolve alias path
* Add optional PROD_SOURCE_MAP webpack env var to allow a module to override the default devtool setting of 'nosources-source-map'
* Allow for entryPoint configs to define "template" property for use in app.view.xml
