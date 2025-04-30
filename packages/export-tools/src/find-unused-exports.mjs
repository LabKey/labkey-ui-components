import { Project } from 'ts-morph';
import { writeFile } from './utils.mjs';

function getEnvVar(name) {
    let envVar = process.env[name];

    if (envVar === undefined) throw new Error(`Missing env var ${name}`);
    if (!envVar.endsWith('/')) envVar += '/';
    return envVar;
}

const labkeyHome = getEnvVar('LABKEY_HOME');
const componentsHome =  getEnvVar('LABKEY_UI_COMPONENTS_HOME');
const premiumHome = getEnvVar('LABKEY_UI_PREMIUM_HOME');

const components = `${componentsHome}packages/components/src`;
const premium = `${premiumHome}src`;
let ehrComponents;
const modules = `${labkeyHome}server/modules`
const limsModules = `${modules}/limsModules`;
const biologics = `${limsModules}/biologics`;
const sampleManagement = `${limsModules}/sampleManagement`;
const inventory = `${limsModules}/inventory`;
const puppeteer = `${limsModules}/puppeteer`;
const labbook = `${limsModules}/labbook`;
const premiumModules = `${modules}/premiumModules`;
const ontology = `${premiumModules}/ontology`;
// Note: explicitly ignoring premiumModules/provenance
const platform = `${modules}/platform`;
const core = `${platform}/core`;
const assay = `${platform}/assay`;
const experiment = `${platform}/experiment`;
const pipeline = `${platform}/pipeline`;
const moduleEditor = `${modules}/premiumModules/moduleEditor`;
const reactExamples = `${modules}/tutorialModules/reactExamples`;
const elisa = `${modules}/commonAssays/elisa`;

let modulePaths = [
    biologics,
    sampleManagement,
    inventory,
    puppeteer,
    labbook,
    ontology,
    core,
    assay,
    experiment,
    pipeline,
    moduleEditor,
    reactExamples,
    elisa,
]

// This allows you to pull down various EHR Modules without having to keep them in your enlistment and build them. If
// they are in your enlistment set this path to $LABKEY_HOME/server/modules
if (process.env.EHR_MODULE_DIRS !== undefined) {
    const baseEHRPath = process.env.EHR_MODULE_DIRS;
    console.log(`EHR modules configured, searching in ${baseEHRPath}`);
    const ehrModules = `${baseEHRPath}/ehrModules`;
    ehrComponents = `${ehrModules}/labkey-ui-ehr/src`;
    modulePaths.push(`${ehrModules}/ehr`);
    modulePaths.push(`${ehrModules}/EHR_App`);
    modulePaths.push(`${baseEHRPath}/snprcEHRModules/snprc_ehr`);
    modulePaths.push(`${baseEHRPath}/wnprc-modules/WNPRC_Purchasing`);
}

modulePaths = modulePaths.map(path => `${path}/src/client`);

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

const componentsImportPaths = [...modulePaths, premium];

if (ehrComponents) componentsImportPaths.push(ehrComponents);

findUnusedExports('components', components, componentsImportPaths);
findUnusedExports('premium', premium, modulePaths);
