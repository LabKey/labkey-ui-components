# Jest Testing

[Jest](https://jestjs.io/docs/en/getting-started.html) is a JavaScript Testing Framework that we use for unit testing
our React components, models, and utility functions. It is in use in this labkey-ui-components package along with
several LabKey modules that have React pages.

Jest tests are quick to run and are a good tool for doing unit testing of React components, properties and methods of
a model, utility functions, among other things. Jest tests in conjunction with other integration testing options (like
the [@labkey/test](../../test/README.md) package and Selenium
testing) can help us to get the full test coverage that we need for LabKey features / stories.

We use [enzyme](https://enzymejs.github.io/enzyme/) in many of our jest test cases to test non-rendering functions and
rendering of components with different sets of parameters.

## Recommendations
1. During or immediately after development (i.e. before a feature branch pull request is merged), review your set of
    changes to see what test cases should be added for any new or changed code.
    1. This includes simple bug fixes as a test case can often be added to prevent regressions of that bug with
    future changes.
1. Keep as much logic out of your React component as possible and put that code in utility functions or method functions
    for your model objects.
    1. This allows for much easier function level unit tests to be written which are separate
    from the component level test cases.
1. Use enzyme [shallow rendering](https://enzymejs.github.io/enzyme/docs/api/shallow.html) (via `shallow(...)`)
    if you want to constrain your testing to just the given component (and not any of its child components) and
    [full rendering](https://enzymejs.github.io/enzyme/docs/api/mount.html) (via `mount(...)`) for components that
    interact with DOM APIs or for components wrapped in higher order components.
    1. Use the `.find()` method to verify that expected DOM elements or child components are included in your rendered
        components wrapper.
    1. Different types of [selectors](https://enzymejs.github.io/enzyme/docs/api/selector.html) can be used to find what
        you are looking for including: css selector, component names, or object properties.
    1. See the following cheat sheets
        1. https://devhints.io/jest
        1. https://devhints.io/enzyme
1. Use jest [snapshot tests](https://jestjs.io/docs/en/snapshot-testing) for making sure the UI for your component
    doesn't change unexpectedly during development of related features. We recommend that snapshot tests be constrained
    to **small display only React components**.
    1. **NOTICE:** our preference is for using `mount()` with `find()` and other state checks for your components. We have
        see that those test cases are much easier to maintain and reason about when a test fails / regresses. If you have
        any logic in your component, try using enzyme testing and reserve snapshot testing for those truly display components only.
    1. Using snapshot tests for large nested components can results in very large snapshot files which are hard to
        review when it comes time to change something or update that snapshot
    1. Don't forget to commit the related `.snap` files for your test cases. Without these, TeamCity will have trouble
        verifying that your tests are valid.
    1. Treat the `.snap` files as code when it comes to changes made to existing snapshots and newly created test cases.
        This means that you should review the new `.snap` files when a new case is added to make sure the contents exist
        and are as expected. This also means that changes to these files should be reviewed during code review of a
        pull request.
    1. Don't manually update `.snap` files. Review the content of the failure for an existing test and then use the
        `yarn test -u` option to update the files. Note that if you are running the test case manually from IntelliJ,
        there is an "update snapshot" link you can click that will use this option for you.
    1. If you are getting local test failures and unexpected changes to a `.snap` file that seems unrelated to your set
        of changes in your feature branch, be sure to locally run the `yarn install` command from the
        `/packages/components` directory. There have been a few cases where an update to a package dependency can result
        in some DOM changes, and without having those package updates installed locally, you can get conflicting results.
1. You can run individual jest test cases from IntelliJ directly. When run in debug mode, you can set breakpoints in
    the jest test code but also in the React component code or functions.
    1. When doing enzyme testing, using `wrapper.debug()` can be used to show HTML for debugging purposes.
    1. Note that under certain circumstances, like a series of snapshots tests, there may be a case where a test will
        pass when run individually but fail when run with the rest of the related test cases. For these reason it is
        good to run the full `yarn test` command on the `packages/components` directory before pushing your changes.

## Mocks
We have several examples of tests using `xhr-mock` for reading in realistic data that can be captured from the
LabKey server to use in the various test cases. Having a jest spec file call `initUnitTestMocks()` in its setup
(i.e. `beforeAll()`) will use the same mock data that `storybook` uses for mocking up responses to various API calls
made during a component lifecycle.

Note that several of our current tests run without mocking up all of the functions / APIs that they call. When this
happens, it is still possible for a test to run and pass, but you will likely see outputs in the test run that look
like the following:
```
Cannot log after tests are done. Did you forget to wait for something async in your test?
```

In addition to mocking data with `xhr-mock`, the `LABKEY` context variable can be mocked / populated with data to use
during jest test execution. Setting this variable is done in the `package.json` file. You can see an example of this
from the [package.json](../package.json) file in this `@labkey/components` package. Note that a LabKey module that
has its own jest tests will currently need to mock the `LABKEY` object if that modules uses any components from the
`@labkey/components` package. This will hopefully be fixed in the `@labkey/components` package soon.


## Examples
1. Testing of utility functions
    1. [util/Date.spec.ts](../src/util/Date.spec.ts)
    1. [internal/app/utils.spec.ts](../src/internal/app/utils.spec.ts)
1. Enzyme examples of using `.find()`
    1. [base/ConfirmModal.spec.tsx](../src/components/base/ConfirmModal.spec.tsx)
    1. [assay/RunPropertiesPanel.spec.tsx](../src/components/assay/RunPropertiesPanel.spec.tsx)
1. Enzyme examples for using component `.props()` and/or `.state()`
    1. [domainproperties/AdvancedSettings.spec.tsx](../src/components/domainproperties/AdvancedSettings.spec.tsx)
    1. [omnibox/OmniBox.spec.tsx](../src/components/omnibox/OmniBox.spec.tsx)
1. Enzyme examples that `.simulate()` events (i.e. `click` or `change`)
    1. [QueryModel/GridPanel.spec.tsx](../src/QueryModel/GridPanel.spec.tsx)
1. Snapshot examples using `renderer` and `toMatchSnapshot()`
    1. [input/ColorPickerInput.spec.tsx](../src/components/forms/input/ColorPickerInput.spec.tsx)
1. Using `async` with `await sleep()`
    1. [QueryModel/withQueryModels.spec.tsx](../src/QueryModel/withQueryModels.spec.tsx)
1. Using `jest.mock`
    1. [pagination/Pagination.spec.tsx](../src/components/pagination/Pagination.spec.tsx)
    1. [components/QueryGrid.spec.tsx](../src/components/QueryGrid.spec.tsx)
1. Using `xhr-mock` via `initUnitTestMocks()`
    1. [editable/Cell.spec.tsx](../src/components/editable/Cell.spec.tsx)
1. Using `jest.spyOn` for an Ajax request to check param contents:
    1. [query/SelectRows.spec.ts](https://github.com/LabKey/labkey-api-js/blob/main/src/labkey/query/SelectRows.spec.ts)
