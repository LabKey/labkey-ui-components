# @labkey/eslint-config-base

This package provides LabKey's base JS ESLint configuration (without React plugins) as an extensible shared config.

## Installing

```bash
$ npm install --save-dev --save-exact @labkey/eslint-config-base
```

You'll need to also install all of the dependencies.  On OSX or Linux, you can use this snippet to install all of the dependencies:

```bash
$ npm info @labkey/eslint-config-base peerDependencies --json | command sed 's/[\{\},]//g ; s/: /@/g' | xargs npm install --save-dev --save-exact --dry-run
```

When you have inspected the output, you can remove the `--dry-run` flag to actually perform the install.


## Usage

Create an .eslintrc.json file with the following contents

```jsonp
{
  "extends": "@labkey/eslint-config-base"
}
```
# Linting and Prettifying

First, install the `@labkey/eslint-config-base` or `@labkey/eslint-config-react` as appropriate.  Once configured, you can run eslint in a variety of ways

## Exclude some directories and files

Add a .eslintignore to only lint src/client and .js, .jsx, .ts, .tsx files:

```
# exclude everything by default
*.*

# exclude these directories
resources/web/gen
src/java
src/api-src
test/
webpack/

# white-list files
!*.js
!*.jsx
!*.ts
!*.tsx
```

## Manually

You can start by running eslint manually on a single file or a collection of files:

```bash
$ npx eslint src/client/util/utilities.ts

$ npx eslint src/client/util/*.ts

$ npx eslint --ext '.ts,.tsx' src/client/util
```

Review the errors and either manually fix them up, [disable rules for the line](https://eslint.org/docs/user-guide/configuring#disabling-rules-with-inline-comments) , or run eslint with `--fix` to have automatic corrections applied.

## Run on all files

You can add some scripts to package.json to invoke the linter as well.  For example:

```jsonp
{
  "scripts": {
    "lint": "eslint --ext '*.ts,*.tsx'",
    "lint-all": "eslint --ext '*.ts,*.tsx' src/client",
    "lint-fix": "eslint --fix --ext '*.ts,*.tsx'"
  },
}
```


## Run on staged files

To only run eslint on staged files (the files that have been 'git added'), include [lint-staged](https://github.com/okonet/lint-staged) package in your project.json:

```bash
$ npm install --save-dev --save-exact lint-staged
```

and call the lint script:

```jsonp
{
  "lint-staged": {
    "*": "npm run lint --"
  }
}
```

It is still manual, but you can now run the linter on just the git staged files:

```bash
$ ... hack hack
$ git add src/client/file1.ts
$ git add src/client/file2.ts
$ npx lint-staged
```

:warning: Be aware that `lint-staged` will stash any other changes not 'git added' to the index prior to running the linter.  This means that some code or configurations might not be picked up when eslint is run.  It does give you the power to run the eslint over just the staged hunks, however.  See this [blog post](https://medium.com/@okonetchnikov/announcing-lint-staged-with-support-for-partially-staged-files-abc24a40d3ff) for more.

:construction: It would be nice to have `lint-staged` run on the non-staged files as well.  For now, you can run the linter on them manually or use IntelliJ.  See this [issue](https://github.com/okonet/lint-staged/issues/150) for more.


## Pre-Commit Hook

You can require that the linter to pass before commit by adding a git pre-commit hook using [husky](https://github.com/typicode/husky).

Install:

```bash
$ npm install --save-dev --save-exact husky
```

Configure:

```jsonp
{
  "husky": {
    "hooks": {
      "pre-commit": "npm test && lint-staged"
    }
  }
}
```

You can also require the tests to pass and all files pass lint before pushing:

```jsonp
{
  "husky": {
    "hooks": {
      "pre-push": "npm test && npm run lint-all"
    }
  }
}
```


## IntelliJ

I highly recommend turning on ESLint within IntelliJ.  It's as simple as going to 'Settings > Languages & Frameworks > JavaScript > Code Quality Tools > ESLint' and choose the 'Automatic ESLint Configuration' option.  Once enabled, the eslint warnings and errors will show up in the gutter bar and can be autocorrected from within IntelliJ.

For more: https://www.jetbrains.com/help/idea/eslint.html


# Coding Conventions

As you enable the linting, you will encounter some preferred code changes.

## React Stateless Functional Components

You may encounter the [react/prefer-stateless-function](https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/prefer-stateless-function.md) rule.  In the past, we've written lots of compoents by just extending `React.Component` without much thought creating a pure stateless component.  It turns out it's a pretty easy code transformation to make.  See this [StackOverflow answer](https://stackoverflow.com/questions/39470467/how-to-define-defaultprops-for-a-stateless-react-component-in-typescript/54569933#54569933) for more.

Original code:

```tsx
interface XProps {
    onClick: () => void;
}

export class XButton extends React.Component<XProps, any> {

    render() {
        const { onClick } = this.props;

        return (
            <div className="sample--group-remove-button">
                <span onClick={onClick}>
                    <i className="fa fa-times"/>
                </span>
            </div>
        );
    }
}
```

Functional component (the `XProps` interface is unchanged):

```tsx
export const XButton: SFC<XProps> = ({ onClick }) => (
    <div className="sample--group-remove-button">
        <span onClick={onClick}>
            <i className="fa fa-times" />
        </span>
    </div>
);
```

If there are default props, you can use destructuring and a default value:

Original:

```tsx
interface XProps {
    onClick: () => void;
    className: string;
}

export class XButton extends React.Component<XProps, any> {
    static defaultProps = {
        className: 'fa fa-times',
    };
    render() {
        const { onClick, className } = this.props;

        return (
            <div className="sample--group-remove-button">
                <span onClick={onClick}>
                    <i className={className} />
                </span>
            </div>
        );
    }
}
```

Function component with default argument values:

```tsx
export const XButton: SFC<XProps> = ({ onClick, className = 'fa fa-times' }) => {
    return (
        <div className="sample--group-remove-button">
            <span onClick={onClick}>
                <i className={className} />
            </span>
        </div>
    );
};
```

Or using an implicit return value:

```tsx
export const XButton: SFC<XProps> = ({ onClick, className = 'fa fa-times' }) => (
    <div className="sample--group-remove-button">
        <span onClick={onClick}>
            <i className={className} />
        </span>
    </div>
);
```

## TypeScript + Immutable.JS Records

The [@typescript-eslint/interface-name-prefix](https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/interface-name-prefix.md) rule encourages interfaces to not start with the letter 'I'.  This is a hold over from C# coding convention and isn't necessary in Typescript (which has distinct `extends` and `implements` keywords).  In the past we used this convention primarily with Immutable.JS Records.  *The rule is disabled for now* but going forward, the Record interface should be renamed to include a `Props` suffix instead.  In addition, we should use `readonly` modifier on the Record fields as well as the `Partial<RecordTypeProps>` in the constructor.  For now, we will need to turn off the eslint `no-useless-constructor` rule for the Record constructor.

Original code:

```ts
interface IPerson {
    name: string;
    int: age;
}

class Person extends Record({
    name: '',
    int: 0
}) implements IPerson {
    name: string;
    age: int;

    constructor(values?: { [key: string]: any }) {
        super(values);
    }
}
```

Refactored:

```ts
interface PersonProps {
    name: string;
    int: age;
}

const defaultPersonProps: PersonProps = {
    name: '',
    int: 0
};

class Person extends Record(defaultPersonProps) implements PersonProps {
    name: string;
    age: int;

    constructor(values?: Partial<PersonProps>) {
        super(values);
    }
}
```



