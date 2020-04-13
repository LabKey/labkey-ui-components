
const execa = require('execa');

const fileExtensions = ['.tsx', '.ts'];  // linted file types

// This is the difference from where the top of the git repo is and where this script is run from. Will
// need to be updated for other repos.
const repoPath = 'packages/components/';

// Default path to the directory to be checked for changes
let lintPath = 'src/';

// Default lint target (--fix changes to lint-fix)
let yarnTarget = 'lint';

// Parameters all optional.
// --fix: this will perform eslint --fix instead of regular eslint
// File path if wanting to do a lint-diff on a specific directory or file
if (process.argv.length > 2) {
    const param1 = process.argv[2];
    if (param1 === '--fix') {
        yarnTarget = 'lint-fix';
    }
    else {
        lintPath = param1;
    }

    if (process.argv.length > 3) {
        lintPath = process.argv[3];
    }
}

(async () => {
    let {stdout} = await execa('git', ['diff', '--name-only', lintPath]);
    if (!stdout) {
        console.log('No changed files at ' + lintPath);
    }
    else {
        let filtered = stdout.split('\n');

        // Filter by file extension
        filtered = filtered.filter(file => {
            file = file.trim();
            return fileExtensions.findIndex(ext => (file.endsWith(ext))) !== -1;
        });

        if (filtered.length < 1) {
            console.log('No changed files match the file extension.')
        }
        else {

            // Remove file path relative to git repo
            filtered = filtered.map(file => {
                return file.substring(repoPath.length);
            });

            try {
                await execa('yarn', ['run', yarnTarget, ...filtered]).stdout.pipe(process.stdout);
            }
            catch (error) {
                console.error("Lint error: ", error);
            }
        }
    }
})();
