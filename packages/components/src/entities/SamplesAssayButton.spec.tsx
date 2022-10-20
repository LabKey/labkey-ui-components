import React from 'react';
import { DropdownButton } from 'react-bootstrap';
import { ReactWrapper } from 'enzyme';

import { makeTestQueryModel } from '../public/QueryModel/testUtils';
import { SchemaQuery } from '../public/SchemaQuery';
import { QueryInfo } from '../public/QueryInfo';
import { mountWithServerContext } from '../internal/testHelpers';
import { TEST_USER_EDITOR, TEST_USER_READER } from '../internal/userFixtures';
import { SCHEMAS } from '../internal/schemas';
import { AssayImportSubMenuItem } from './AssayImportSubMenuItem';

import { GENERAL_ASSAY_PROVIDER_NAME } from '../internal/components/assay/actions';

import { TEST_ASSAY_STATE_MODEL } from '../test/data/constants';

import { SamplesAssayButtonImpl } from './SamplesAssayButton';

describe('SamplesAssayButton', () => {
    const DEFAULT_PROPS = {
        assayModel: TEST_ASSAY_STATE_MODEL,
        reloadAssays: jest.fn,
        assayDefinition: undefined,
        assayProtocol: undefined,
        model: makeTestQueryModel(
            SCHEMAS.SAMPLE_SETS.SAMPLES,
            QueryInfo.create({ importUrl: 'testimporturl', insertUrl: 'testinserturl' })
        ).mutate({ selections: new Set(['1']) }),
    };

    function validate(wrapper: ReactWrapper, rendered = true, asSubMenu = false): void {
        expect(wrapper.find(DropdownButton)).toHaveLength(rendered && !asSubMenu ? 1 : 0);
        expect(wrapper.find(AssayImportSubMenuItem)).toHaveLength(rendered ? 1 : 0);
    }

    test('default props', () => {
        const wrapper = mountWithServerContext(<SamplesAssayButtonImpl {...DEFAULT_PROPS} />, {
            user: TEST_USER_EDITOR,
        });
        validate(wrapper);
        expect(wrapper.find(AssayImportSubMenuItem).prop('providerType')).toBe(undefined);
        wrapper.unmount();
    });

    test('providerType', () => {
        const wrapper = mountWithServerContext(
            <SamplesAssayButtonImpl {...DEFAULT_PROPS} providerType={GENERAL_ASSAY_PROVIDER_NAME} />,
            { user: TEST_USER_EDITOR }
        );
        validate(wrapper);
        expect(wrapper.find(AssayImportSubMenuItem).prop('providerType')).toBe(GENERAL_ASSAY_PROVIDER_NAME);
        wrapper.unmount();
    });

    test('not isSamplesSchema', () => {
        const model = makeTestQueryModel(
            SchemaQuery.create('schema', 'query'),
            QueryInfo.create({ importUrl: 'testimporturl', insertUrl: 'testinserturl' })
        ).mutate({ selections: new Set(['1']) });
        const wrapper = mountWithServerContext(<SamplesAssayButtonImpl {...DEFAULT_PROPS} model={model} />, {
            user: TEST_USER_EDITOR,
        });
        validate(wrapper, false);
        wrapper.unmount();
    });

    test('reader', () => {
        const wrapper = mountWithServerContext(<SamplesAssayButtonImpl {...DEFAULT_PROPS} />, {
            user: TEST_USER_READER,
        });
        validate(wrapper, false);
        wrapper.unmount();
    });

    test('asSubMenu', () => {
        const wrapper = mountWithServerContext(<SamplesAssayButtonImpl {...DEFAULT_PROPS} asSubMenu />, {
            user: TEST_USER_EDITOR,
        });
        validate(wrapper, true, true);
        wrapper.unmount();
    });
});
