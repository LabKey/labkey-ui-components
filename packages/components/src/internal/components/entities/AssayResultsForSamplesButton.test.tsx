import React from 'react';

import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { QueryInfo } from '../../../public/QueryInfo';
import { TEST_USER_READER, TEST_USER_STORAGE_EDITOR } from '../../userFixtures';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { AssayResultsForSamplesMenuItem } from './AssayResultsForSamplesButton';

const MODEL = makeTestQueryModel(new SchemaQuery('samples', 'query'), new QueryInfo({}));

describe('AssayResultsForSamplesButton', () => {
    const DEFAULT_PROPS = {
        model: MODEL,
        user: TEST_USER_READER,
    };

    test('default props', () => {
        renderWithAppContext(<AssayResultsForSamplesMenuItem {...DEFAULT_PROPS} asSubMenu />);
        expect(document.querySelector('.lk-menu-item a')).toBeInTheDocument();
        // expect(document.querySelectorAll('.lk-menu-item').prop('nounPlural')).toBe('samples');
        expect(document.querySelector('.lk-menu-item a')).toHaveAttribute(
            'href',
            '/assays/sampleresults?selectionKey=model'
        );
    });

    test('for picklist', () => {
        renderWithAppContext(<AssayResultsForSamplesMenuItem {...DEFAULT_PROPS} asSubMenu isPicklist />);
        expect(document.querySelector('.lk-menu-item a')).toBeInTheDocument();
        expect(document.querySelector('.lk-menu-item a')).toHaveAttribute(
            'href',
            '/assays/sampleresults?selectionKey=model&picklistName=query'
        );
    });

    test('without read assay perm', () => {
        renderWithAppContext(
            <AssayResultsForSamplesMenuItem {...DEFAULT_PROPS} asSubMenu user={TEST_USER_STORAGE_EDITOR} />
        );
        expect(document.querySelector('.lk-menu-item a')).not.toBeInTheDocument();
    });
});
