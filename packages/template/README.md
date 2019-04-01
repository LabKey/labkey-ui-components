This directory provides a template for generating new packages.  
Use the template as follows:
1. Make a directory that is a sibling of the template directory (that is, a child of `packages`)
1. Copy the contents of this directory to the new directory and then 
remove the copied README.md
1. Replace all occurrences of `PACKAGE_NAME` with the name of the new package
1. Replace `PACkAGE_DESCRIPTION` in the `package.json` file with a description of the package
1. Replace `AUTHOR_NAME` in the `package.json` file with the author's name

Once the new package is set up, add it as a workspace in the top-level `package.json` file.
