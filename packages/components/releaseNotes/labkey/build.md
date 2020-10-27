# @labkey/build

### version 0.1.0
*Released*: 26 October 2020
* Initial package contents with webpack config assets ported over from platform/webpack (with additions to fit scenarios from other modules)
* Conditionalize labkeyUIComponentsPath in webpack/constants.js based on LK_MODULE_CONTAINER
* Add optional npm start port WATCH_PORT webpack env var
* Add optional LINK webpack env var to toggle @labkey/components resolve alias path
* Add optional PROD_SOURCE_MAP webpack env var to allow a module to override the default devtool setting of 'nosources-source-map'
* Allow for entryPoint configs to define "template" property for use in app.view.xml
