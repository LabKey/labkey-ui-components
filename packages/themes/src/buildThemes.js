/*
 * Copyright (c) 2017-2020 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
const { execSync } = require('child_process');
const fs = require('fs');

const SOURCE_THEME_DIR = 'themes/';
const TARGET_THEME_DIR = 'styles/themeVariables/';
const TEMP_VARIABLE_FILE = '_variables.scss';
const OUTPUT_DIR = 'dist/';

const BASE_BUILD_CMD = 'webpack --config src/style.config.js --progress';

// files that should not be removed during cleanup
const VALID_JS_OUTPUTS = ['core.js'];

const themeDirs = fs.readdirSync(SOURCE_THEME_DIR);
if (!fs.existsSync(TARGET_THEME_DIR)) {
    fs.mkdirSync(TARGET_THEME_DIR);
}

let cmd = BASE_BUILD_CMD + ' --env.buildDependency=true';
console.log('\n\nBuilding core resources');
execSync(cmd, { stdio: [0,1,2] }); // use option {stdio:[0,1,2]} to print stdout

for (let i=0; i < themeDirs.length; i++) {
    const themeDir = themeDirs[i];
    const themeVarFullPath = SOURCE_THEME_DIR + themeDir + '/' + TEMP_VARIABLE_FILE;
    if (!fs.existsSync(themeVarFullPath)) {
        console.log('\x1b[31m', '\n\nError: ' + themeVarFullPath + ' does not exist! Skipping theme building.', '\x1b[0m');
        continue;
    }
    console.log('\n\nBuilding theme: ' + themeDir);
    fs.writeFileSync(TARGET_THEME_DIR + TEMP_VARIABLE_FILE, fs.readFileSync(themeVarFullPath));

    cmd = BASE_BUILD_CMD + ' --env.theme=' + themeDir;
    execSync(cmd, { stdio: [0,1,2] }); // use option {stdio:[0,1,2]} to print stdout
}

// clean up js files
const outputFiles = fs.readdirSync(OUTPUT_DIR);
for (let i=0; i < outputFiles.length; i++) {
    const fileName = outputFiles[i];
    if (fileName.indexOf('.js', fileName.length - '.js'.length) !== -1) {
        if (VALID_JS_OUTPUTS.indexOf(fileName) === -1) {
            fs.unlinkSync(OUTPUT_DIR + fileName);
        }
    }
    else if (fileName.indexOf('.js.map', fileName.length - '.js.map'.length) !== -1) {
        fs.unlinkSync(OUTPUT_DIR + fileName);
    }
}
