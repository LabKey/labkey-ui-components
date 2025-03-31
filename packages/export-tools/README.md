### export-tools

`export-tools` is an unpublished package used to house tools related to managing the imports and exports of our frontend
packages.

# Setup
To install the dependencies used by `export-tools` run `npm install`.

# Tools
## findUnused
The purpose of `findUnused` is to document everything exported by our packages, as well as everything our modules import
from those packages, with the ultimate goal of determining what exports are unused.

### setup
By default, `findUnused` does not search in EHR modules, as not everyone will have those in their enlistment. To include
EHR  modules in your search you need to set the `EHR_MODULE_DIRS` environment variable. If you have the EHR modules in
your  enlistment you should set `EHR_MODULE_DIRS` to `$LABKEY_HOME/server/modules`. If you don't have EHR modules in
your enlistment you can clone them to any alternate directory path and set the `EHR_MODULE_DIRS` to that path.

### usage
To run the tool run `npm run findUnused`. This will parse the `index.ts` file for the `ui-components`, and `ui-premium`
packages to find what they export. It will then search all the known module directories that use `ui-components` or
`ui-premium` for usages of the packages. After the search is complete `findUsages` will write 6 files to the working
directory:

- `components-exports.txt` - The list of all items exported in the `ui-components` `index.ts`
- `components-imports.txt` - The list of all items imported from `ui-components` by modules
- `components-unused.txt` - The list of all exports that are not imported by any modules
- `premium-exports.txt` - The list of all items exported in the `ui-premium` `index.ts`
- `premium-imports.txt` - The list of all items imported from `ui-premium` by modules
- `premium-unused.txt` - The list of all exports that are not imported by any modules

## Future tools
The dependency we used to implemement `findUnused`, `ts-morph`, is an AST toolkit for TypeScript. In the future we could
leverage `ts-morph` to write tools to accomplish the following:

- Sorting our exports
- Automatically remove unused exports
- Rename an export or import (useful if we want to do something like rename a method from `foo` to `fooDeprecated`)
