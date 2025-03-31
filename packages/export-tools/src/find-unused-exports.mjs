import { Project } from 'ts-morph';
import { writeFile } from './utils.mjs';

// 1. Locate ui-components, ui-premium, and labkey home via env-vars (consult labkey build code)
// 2. Find all exports from ui-components, ui-premium (use ts-morph)
// 3. Find all imports of ui-components and ui-premium in known locations based on env-vars (use ts-morph)
// 4. Diff the exports and imports, output the diffs (one file per package)
// 5. Consider using ts-morph to modify the AST and remove the unused exports (consult ts-morph docs)
//     - Only do this when --write flag is present, don't output diff files when write is true
//     - Bonus points: consider using ts-morph to export everything in sorted order.

// S-1, S-999
// S-1, S-2

if (process.env.LABKEY_HOME === undefined) {
    throw new Error('Missing env var LABKEY_HOME');
}

if (process.env.LABKEY_UI_COMPONENTS_HOME === undefined) {
    throw new Error('Missing env var LABKEY_UI_COMPONENTS_HOME');
}

if (process.env.LABKEY_UI_PREMIUM_HOME === undefined) {
    throw new Error('Missing env var LABKEY_UI_PREMIUM_HOME');
}

const components = `${process.env.LABKEY_UI_COMPONENTS_HOME}packages/components/src`;
const premium = `${process.env.LABKEY_UI_PREMIUM_HOME}src`;
const modules = `${process.env.LABKEY_HOME}server/modules`
const limsModules = `${modules}/limsModules`;
const biologics = `${limsModules}/biologics`;
const sampleManagement = `${limsModules}/sampleManagement`;
const inventory = `${limsModules}/inventory`;
const puppeteer = `${limsModules}/puppeteer`;
const labbook = `${limsModules}/labbook`;
const platform = `${modules}/platform`;
const core = `${platform}/core`;
const assay = `${platform}/assay`;
const experiment = `${platform}/experiment`;
const pipeline = `${platform}/pipeline`;
const moduleEditor = `${modules}/premiumModules/moduleEditor`;
const reactExamples = `${modules}/tutorialModules/reactExamples`;
// TODO: there are probably more modules using ui-components that I am missing

const modulePaths = [
    biologics,
    sampleManagement,
    inventory,
    puppeteer,
    labbook,
    core,
    assay,
    experiment,
    pipeline,
    moduleEditor,
    reactExamples,
].map(path => `${path}/src/client`);

function findExports(packagePath) {
    const project = new Project();
    const glob = `${packagePath}/index.ts`;
    project.addSourceFilesAtPaths([glob]);
    const namedExports = new Set();

    project.getSourceFiles().forEach((sourceFile) => {
        sourceFile.getExportDeclarations().forEach((exportDeclaration) => {
            exportDeclaration.getNamedExports().forEach((namedExport) => {
                namedExports.add(namedExport.getName());
            })
        });
    });

    return namedExports;
}

function findImports(packageName, paths) {
    const fullPackageName = `@labkey/${packageName}`;
    const project = new Project();
    const globs = paths.reduce((reduction, path) => {
        reduction.push(`${path}/**/*.ts`);
        reduction.push(`${path}/**/*.tsx`);
        return reduction;
    }, []);
    project.addSourceFilesAtPaths(globs);
    const imports = new Set();

    project.getSourceFiles().forEach((sourceFile) => {
        // console.log(`Searching ${sourceFile.getFilePath()}`);
        sourceFile.getImportDeclarations().forEach((importDeclaration) => {
            if (importDeclaration.getModuleSpecifierValue() === fullPackageName) {
                importDeclaration.getNamedImports().forEach((namedImport) => {
                    imports.add(namedImport.getName());
                });
                if(importDeclaration.getDefaultImport()){
                    imports.add(importDeclaration.getDefaultImport().getText());
                }
                if(importDeclaration.getNamespaceImport()){
                    imports.add(importDeclaration.getNamespaceImport().getText());
                }
            }
        });
    });

    return imports;
}

function findUnusedExports(packageName, packagePath, pathsToSearch) {
    const namedExports = findExports(packagePath);
    writeFile(`${packageName}-exports.txt`, namedExports);
    const namedImports = findImports(packageName, pathsToSearch);
    writeFile(`${packageName}-imports.txt`, namedImports);
    const unusedExports = Array.from(namedExports).filter(e => !namedImports.has(e));
    writeFile(`${packageName}-unused.txt`, unusedExports);
}

findUnusedExports('components', components, [...modulePaths, premium]);
// TODO: imports for premium is empty, which is for sure wrong.
findUnusedExports('premium', premium, modulePaths);
