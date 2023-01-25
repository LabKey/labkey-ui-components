import React from 'react';
import { DropdownButton } from 'react-bootstrap';
import { ReactWrapper } from 'enzyme';

import { makeTestQueryModel } from '../public/QueryModel/testUtils';
import { SchemaQuery } from '../public/SchemaQuery';
import { mountWithServerContext } from '../internal/testHelpers';
import { SubMenuItem } from '../internal/components/menus/SubMenuItem';
import { TEST_USER_EDITOR, TEST_USER_READER } from '../internal/userFixtures';

import { DisableableButton } from '../internal/components/buttons/DisableableButton';

import { SamplesDeriveButtonBase, SamplesDeriveButtonBaseProps } from './SamplesDeriveButtonBase';
import { CreateSamplesSubMenu } from './CreateSamplesSubMenu';

describe('SamplesDeriveButtonBase', () => {
    function defaultProps(): SamplesDeriveButtonBaseProps {
        return {
            model: makeTestQueryModel(SchemaQuery.create('schema', 'query')),
            isSelectingSamples: jest.fn().mockReturnValue(true),
        };
    }

    function validate(wrapper: ReactWrapper, rendered = true, asSubMenu = false, disabled = false): void {
        expect(wrapper.find(DropdownButton)).toHaveLength(rendered && !asSubMenu && !disabled ? 1 : 0);
        expect(wrapper.find(CreateSamplesSubMenu)).toHaveLength(rendered && !disabled ? 3 : 0);
        expect(wrapper.find(DisableableButton)).toHaveLength(disabled ? 1 : 0);
    }

    test('default props', () => {
        const wrapper = mountWithServerContext(<SamplesDeriveButtonBase {...defaultProps()} />, {
            user: TEST_USER_EDITOR,
        });
        validate(wrapper);
        expect(wrapper.find(SubMenuItem)).toHaveLength(3);
        wrapper.unmount();
    });

    test('asSubMenu', () => {
        const wrapper = mountWithServerContext(<SamplesDeriveButtonBase {...defaultProps()} asSubMenu />, {
            user: TEST_USER_EDITOR,
        });
        validate(wrapper, true, true);
        expect(wrapper.find(SubMenuItem)).toHaveLength(4);
        wrapper.unmount();
    });

    test('reader', () => {
        const wrapper = mountWithServerContext(<SamplesDeriveButtonBase {...defaultProps()} />, {
            user: TEST_USER_READER,
        });
        validate(wrapper, false);
        expect(wrapper.find(SubMenuItem)).toHaveLength(0);
        wrapper.unmount();
    });

    test('over max selections', () => {
        const model = makeTestQueryModel(SchemaQuery.create('schema', 'query')).mutate({
            selections: new Set(Array.from(Array(1001).keys()).map(key => key + '')),
        });
        const wrapper = mountWithServerContext(<SamplesDeriveButtonBase {...defaultProps()} model={model} />, {
            user: TEST_USER_EDITOR,
        });
        validate(wrapper, false, false, true);
        expect(wrapper.find(SubMenuItem)).toHaveLength(0);
        wrapper.unmount();
    });
});
