import React from 'react';
import { DropdownButton, MenuItem } from 'react-bootstrap';
import { ReactWrapper } from 'enzyme';

import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { QueryInfo } from '../../../public/QueryInfo';
import { mountWithServerContext } from '../../testHelpers';
import { TEST_USER_EDITOR, TEST_USER_READER } from '../../userFixtures';

import { SubMenuItem } from '../menus/SubMenuItem';

import { SamplesAddButton } from './SamplesAddButton';

describe('SamplesAddButton', () => {
    const DEFAULT_PROPS = {
        model: makeTestQueryModel(
            SchemaQuery.create('schema', 'query'),
            QueryInfo.create({ importUrl: 'testimporturl', insertUrl: 'testinserturl' })
        ),
    };

    function validate(
        wrapper: ReactWrapper,
        allowInsert = true,
        allowImport = true,
        insertHref?: string,
        importHref?: string
    ): void {
        expect(wrapper.find(DropdownButton)).toHaveLength(allowInsert || allowImport ? 1 : 0);
        let menuCount = 0;
        if (allowInsert) menuCount++;
        if (allowImport) menuCount++;
        expect(wrapper.find(MenuItem)).toHaveLength(menuCount);
        if (allowInsert) {
            expect(wrapper.find(MenuItem).first().text()).toBe('Add Manually');
            expect(wrapper.find(MenuItem).first().prop('href')).toBe(insertHref ?? '#/samples/new?target=undefined');
        }
        if (allowImport) {
            expect(wrapper.find(MenuItem).last().text()).toBe('Import from File');
            expect(wrapper.find(MenuItem).last().prop('href')).toBe(
                importHref ?? '#/samples/new?target=undefined&tab=2'
            );
        }
    }

    test('default props', () => {
        const wrapper = mountWithServerContext(<SamplesAddButton {...DEFAULT_PROPS} />, { user: TEST_USER_EDITOR });
        validate(wrapper);
        wrapper.unmount();
    });

    test('with currentProductId and targetProductId', () => {
        const wrapper = mountWithServerContext(
            <SamplesAddButton {...DEFAULT_PROPS} currentProductId="from" targetProductId="to" />,
            { user: TEST_USER_EDITOR }
        );
        validate(
            wrapper,
            true,
            true,
            '/labkey/to/app.view#/samples/new?target=undefined',
            '/labkey/to/app.view#/samples/new?target=undefined&tab=2'
        );
        wrapper.unmount();
    });

    test('reader', () => {
        const wrapper = mountWithServerContext(<SamplesAddButton {...DEFAULT_PROPS} />, { user: TEST_USER_READER });
        validate(wrapper, false, false);
        wrapper.unmount();
    });

    test('hideImport', () => {
        const wrapper = mountWithServerContext(<SamplesAddButton {...DEFAULT_PROPS} hideImport />, {
            user: TEST_USER_EDITOR,
        });
        validate(wrapper, true, false);
        wrapper.unmount();
    });

    test('not showInsertNewButton on queryInfo', () => {
        const model = makeTestQueryModel(
            SchemaQuery.create('schema', 'query'),
            QueryInfo.create({ importUrl: 'testimporturl', insertUrl: 'testinserturl', showInsertNewButton: false })
        );
        const wrapper = mountWithServerContext(<SamplesAddButton {...DEFAULT_PROPS} model={model} />, {
            user: TEST_USER_EDITOR,
        });
        validate(wrapper, false, false);
        wrapper.unmount();
    });

    test('no importUrl on queryInfo', () => {
        const model = makeTestQueryModel(
            SchemaQuery.create('schema', 'query'),
            QueryInfo.create({ importUrl: undefined, insertUrl: 'testinserturl' })
        );
        const wrapper = mountWithServerContext(<SamplesAddButton {...DEFAULT_PROPS} model={model} />, {
            user: TEST_USER_EDITOR,
        });
        validate(wrapper, true, false);
        wrapper.unmount();
    });

    test('asSubMenu', () => {
        const model = makeTestQueryModel(
            SchemaQuery.create('schema', 'query'),
            QueryInfo.create({ importUrl: undefined, insertUrl: 'testinserturl' })
        );
        const wrapper = mountWithServerContext(<SamplesAddButton {...DEFAULT_PROPS} model={model} asSubMenu />, {
            user: TEST_USER_EDITOR,
        });
        expect(wrapper.find(DropdownButton)).toHaveLength(0);
        expect(wrapper.find(SubMenuItem)).toHaveLength(1);
    });
});
