import React from 'react';
import { MenuItem, OverlayTrigger } from 'react-bootstrap';
import { mount } from 'enzyme';

import { TEST_ASSAY_STATE_MODEL } from '../test/data/constants';

import { SubMenuItem } from '../internal/components/menus/SubMenuItem';

import { makeTestQueryModel } from '../public/QueryModel/testUtils';
import { SchemaQuery } from '../public/SchemaQuery';

import { GENERAL_ASSAY_PROVIDER_NAME } from '../internal/components/assay/constants';

import { DisableableMenuItem } from '../internal/components/samples/DisableableMenuItem';

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

        expect(wrapper.find(SubMenuItem)).toHaveLength(0);
        expect(wrapper.find(DisableableMenuItem)).toHaveLength(0);

        expect(wrapper.find('.fa-spinner')).toHaveLength(1);
        expect(wrapper.find(MenuItem)).toHaveLength(1);
        expect(wrapper.find(MenuItem).text()).toBe(' Loading assays...');

        wrapper.unmount();
    });

    test('disabled', () => {
        const wrapper = mount(<AssayImportSubMenuItemImpl {...DEFAULT_PROPS} disabled />);

        expect(wrapper.find('.fa-spinner')).toHaveLength(0);
        expect(wrapper.find(SubMenuItem)).toHaveLength(0);
        expect(wrapper.find(MenuItem)).toHaveLength(1);
        expect(wrapper.find(DisableableMenuItem)).toHaveLength(1);

        wrapper.unmount();
    });

    test('with items', () => {
        const wrapper = mount(
            <AssayImportSubMenuItemImpl {...DEFAULT_PROPS} providerType={GENERAL_ASSAY_PROVIDER_NAME} />
        );

        expect(wrapper.find('.fa-spinner')).toHaveLength(0);
        expect(wrapper.find(MenuItem)).toHaveLength(0);
        expect(wrapper.find(DisableableMenuItem)).toHaveLength(0);

        const submenuitem = wrapper.find(SubMenuItem);
        expect(submenuitem).toHaveLength(1);
        expect(submenuitem.text()).toBe('Import Assay Data');
        expect(submenuitem.prop('disabled')).toBeFalsy();

        const assayitems = submenuitem.prop('items');
        expect(assayitems.length).toBe(2);
        expect(assayitems[0].disabled).toBeFalsy();

        wrapper.unmount();
    });

    test('no items', () => {
        const wrapper = mount(<AssayImportSubMenuItemImpl {...DEFAULT_PROPS} providerType="BOGUS" />);

        expect(wrapper.find('.fa-spinner')).toHaveLength(0);
        expect(wrapper.find(MenuItem)).toHaveLength(0);
        expect(wrapper.find(SubMenuItem)).toHaveLength(0);
        expect(wrapper.find(DisableableMenuItem)).toHaveLength(0);

        wrapper.unmount();
    });

    test('requireSelection with too few selected', () => {
        const model = makeTestQueryModel(new SchemaQuery('schema', 'query')).mutate({ selections: new Set() });
        const wrapper = mount(
            <AssayImportSubMenuItemImpl {...DEFAULT_PROPS} requireSelection={true} queryModel={model} />
        );

        expect(wrapper.find('.fa-spinner')).toHaveLength(0);
        expect(wrapper.find(MenuItem)).toHaveLength(0);
        expect(wrapper.find(DisableableMenuItem)).toHaveLength(0);

        const submenuitem = wrapper.find(SubMenuItem);
        expect(submenuitem).toHaveLength(1);
        expect(submenuitem.text()).toBe('Import Assay Data');
        expect(submenuitem.prop('disabled')).toBeFalsy();

        const assayitems = submenuitem.prop('items');
        expect(assayitems.length).toBe(5);
        expect(assayitems[0].disabled).toBeTruthy();
        expect(assayitems[0].disabledMsg).toBe('Select one or more items.');

        wrapper.unmount();
    });

    test('requireSelection with proper number selected', () => {
        const model = makeTestQueryModel(new SchemaQuery('schema', 'query')).mutate({
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
        expect(wrapper.find(DisableableMenuItem)).toHaveLength(0);

        const submenuitem = wrapper.find(SubMenuItem);
        expect(submenuitem).toHaveLength(1);
        expect(submenuitem.text()).toBe('Test Assay Import');
        expect(submenuitem.prop('disabled')).toBeFalsy();

        const assayitems = submenuitem.prop('items');
        expect(assayitems.length).toBe(5);
        expect(assayitems[0].disabled).toBeFalsy();

        wrapper.unmount();
    });
});
