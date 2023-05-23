import React from 'react';

import { SelectionMenuItem } from '../menus/SelectionMenuItem';

import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { QueryInfo } from '../../../public/QueryInfo';
import { mountWithAppServerContext } from '../../testHelpers';
import { TEST_USER_READER, TEST_USER_STORAGE_EDITOR } from '../../userFixtures';

import { AssayResultsForSamplesMenuItem } from './AssayResultsForSamplesButton';

const MODEL = makeTestQueryModel(new SchemaQuery('samples', 'query'), new QueryInfo({}));

describe('AssayResultsForSamplesButton', () => {
    const DEFAULT_PROPS = {
        model: MODEL,
        user: TEST_USER_READER,
    };

    test('default props', () => {
        const wrapper = mountWithAppServerContext(<AssayResultsForSamplesMenuItem {...DEFAULT_PROPS} asSubMenu />);
        expect(wrapper.find(SelectionMenuItem)).toHaveLength(1);
        expect(wrapper.find(SelectionMenuItem).prop('nounPlural')).toBe('samples');
        expect(wrapper.find(SelectionMenuItem).prop('href')).toBe('#/assays/sampleresults?selectionKey=model');
        wrapper.unmount();
    });

    test('for picklist', () => {
        const wrapper = mountWithAppServerContext(
            <AssayResultsForSamplesMenuItem {...DEFAULT_PROPS} asSubMenu isPicklist />
        );
        expect(wrapper.find(SelectionMenuItem)).toHaveLength(1);
        expect(wrapper.find(SelectionMenuItem).prop('href')).toBe(
            '#/assays/sampleresults?selectionKey=model&picklistName=query'
        );
        wrapper.unmount();
    });

    test('for different product id', () => {
        const wrapper = mountWithAppServerContext(
            <AssayResultsForSamplesMenuItem {...DEFAULT_PROPS} asSubMenu currentProductId="A" targetProductId="B" />
        );
        expect(wrapper.find(SelectionMenuItem)).toHaveLength(1);
        expect(wrapper.find(SelectionMenuItem).prop('href')).toBe(
            '/labkey/b/app.view#/assays/sampleresults?selectionKey=model'
        );
        wrapper.unmount();
    });

    test('without read assay perm', () => {
        const wrapper = mountWithAppServerContext(
            <AssayResultsForSamplesMenuItem {...DEFAULT_PROPS} asSubMenu user={TEST_USER_STORAGE_EDITOR} />
        );
        expect(wrapper.find(SelectionMenuItem)).toHaveLength(0);
        wrapper.unmount();
    });
});
