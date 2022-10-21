import React from 'react';
import { MenuItem, OverlayTrigger } from 'react-bootstrap';
import { mount } from 'enzyme';

import { TEST_ASSAY_STATE_MODEL } from '../test/data/constants';

import { SubMenuItem } from '../internal/components/menus/SubMenuItem';

import { makeTestQueryModel } from '../public/QueryModel/testUtils';
import { SchemaQuery } from '../public/SchemaQuery';

import { GENERAL_ASSAY_PROVIDER_NAME } from '../internal/components/assay/actions';
import { AssayImportSubMenuItemImpl } from './AssayImportSubMenuItem';

const DEFAULT_PROPS = {
    assayModel: TEST_ASSAY_STATE_MODEL,
    requireSelection: false,
    reloadAssays: jest.fn,
    assayDefinition: undefined,
    assayProtocol: undefined,
    queryModel: undefined,
};

describe('AssayImportSubMenuItem', () => {
    test('loading', () => {
        const wrapper = mount(<AssayImportSubMenuItemImpl {...DEFAULT_PROPS} isLoaded={false} />);

        expect(wrapper.find('.fa-spinner')).toHaveLength(1);
        expect(wrapper.find(MenuItem)).toHaveLength(1);
        expect(wrapper.find(SubMenuItem)).toHaveLength(0);
        expect(wrapper.find(OverlayTrigger)).toHaveLength(0);

        wrapper.unmount();
    });

    test('with items', () => {
        const wrapper = mount(
            <AssayImportSubMenuItemImpl {...DEFAULT_PROPS} providerType={GENERAL_ASSAY_PROVIDER_NAME} />
        );

        expect(wrapper.find('.fa-spinner')).toHaveLength(0);
        expect(wrapper.find(MenuItem)).toHaveLength(0);
        expect(wrapper.find(SubMenuItem)).toHaveLength(1);
        expect(wrapper.find(OverlayTrigger)).toHaveLength(0);

        wrapper.unmount();
    });

    test('no items', () => {
        const wrapper = mount(<AssayImportSubMenuItemImpl {...DEFAULT_PROPS} providerType="BOGUS" />);

        expect(wrapper.find('.fa-spinner')).toHaveLength(0);
        expect(wrapper.find(MenuItem)).toHaveLength(0);
        expect(wrapper.find(SubMenuItem)).toHaveLength(0);
        expect(wrapper.find(OverlayTrigger)).toHaveLength(0);

        wrapper.unmount();
    });

    test('requireSelection with too few selected', () => {
        const model = makeTestQueryModel(SchemaQuery.create('schema', 'query')).mutate({ selections: new Set() });
        const wrapper = mount(
            <AssayImportSubMenuItemImpl {...DEFAULT_PROPS} requireSelection={true} queryModel={model} />
        );

        expect(wrapper.find('.fa-spinner')).toHaveLength(0);
        expect(wrapper.find(SubMenuItem)).toHaveLength(0);

        const menuitem = wrapper.find(MenuItem);
        expect(menuitem).toHaveLength(1);
        expect(menuitem.text()).toBe('Import Assay Data');
        expect(menuitem.props().disabled).toBeTruthy();
        const trigger = wrapper.find(OverlayTrigger);
        expect(trigger).toHaveLength(1);

        wrapper.unmount();
    });

    test('requireSelection with proper number selected', () => {
        const model = makeTestQueryModel(SchemaQuery.create('schema', 'query')).mutate({
            selections: new Set(['test']),
        });
        const wrapper = mount(
            <AssayImportSubMenuItemImpl
                {...DEFAULT_PROPS}
                text="Test Assay Import"
                requireSelection={true}
                queryModel={model}
            />
        );

        expect(wrapper.find('.fa-spinner')).toHaveLength(0);
        expect(wrapper.find(MenuItem)).toHaveLength(0);
        expect(wrapper.find(OverlayTrigger)).toHaveLength(0);

        const submenu = wrapper.find(SubMenuItem);
        expect(submenu).toHaveLength(1);
        expect(submenu.text()).toBe('Test Assay Import');
        expect(submenu.props().disabled).toBeFalsy();

        wrapper.unmount();
    });
});
