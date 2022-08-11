import React from 'react';
import { DropdownButton } from 'react-bootstrap';
import { ReactWrapper } from 'enzyme';

import { ProductMenuModel } from '../navigation/model';
import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { mountWithServerContext } from '../../testHelpers';
import { SubMenuItem } from '../menus/SubMenuItem';
import { TEST_USER_EDITOR, TEST_USER_READER } from '../../userFixtures';

import { SamplesDeriveButtonBase } from './SamplesDeriveButtonBase';
import { CreateSamplesSubMenu } from './CreateSamplesSubMenu';

describe('SamplesDeriveButtonBase', () => {
    const DEFAULT_PROPS = {
        menu: new ProductMenuModel(),
        user: TEST_USER_EDITOR,
        model: makeTestQueryModel(SchemaQuery.create('schema', 'query')),
        navigate: jest.fn(),
        goBack: jest.fn(),
        menuInit: jest.fn(),
        menuInvalidate: jest.fn(),
        setReloadRequired: jest.fn(),
        isSelectingSamples: () => true,
    };

    function validate(wrapper: ReactWrapper, rendered = true, asSubMenu = false): void {
        expect(wrapper.find(DropdownButton)).toHaveLength(rendered && !asSubMenu ? 1 : 0);
        expect(wrapper.find(CreateSamplesSubMenu)).toHaveLength(rendered ? 3 : 0);
    }

    test('default props', () => {
        const wrapper = mountWithServerContext(<SamplesDeriveButtonBase {...DEFAULT_PROPS} />, {
            user: TEST_USER_EDITOR,
        });
        validate(wrapper);
        expect(wrapper.find(SubMenuItem)).toHaveLength(3);
        wrapper.unmount();
    });

    test('asSubMenu', () => {
        const wrapper = mountWithServerContext(<SamplesDeriveButtonBase {...DEFAULT_PROPS} asSubMenu />, {
            user: TEST_USER_EDITOR,
        });
        validate(wrapper, true, true);
        expect(wrapper.find(SubMenuItem)).toHaveLength(4);
        wrapper.unmount();
    });

    test('reader', () => {
        const wrapper = mountWithServerContext(<SamplesDeriveButtonBase {...DEFAULT_PROPS} />, {
            user: TEST_USER_READER,
        });
        validate(wrapper, false);
        expect(wrapper.find(SubMenuItem)).toHaveLength(0);
        wrapper.unmount();
    });
});
