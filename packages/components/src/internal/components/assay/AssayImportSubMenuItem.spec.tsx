import React from 'react';
import { MenuItem, OverlayTrigger } from 'react-bootstrap';
import { mount } from 'enzyme';
import { List } from 'immutable';

import { AssayImportSubMenuItemImpl } from './AssayImportSubMenuItem';
import { TEST_ASSAY_STATE_MODEL } from '../../../test/data/constants';
import { GENERAL_ASSAY_PROVIDER_NAME, QueryGridModel, SubMenuItem } from '../../..';

const DEFAULT_PROPS = {
    assayModel: TEST_ASSAY_STATE_MODEL,
    requireSelection: false,
    reloadAssays: jest.fn,
    assayDefinition: undefined,
    assayProtocol: undefined,
};

describe('AssayImportSubMenuItem', () => {
    test('loading', () => {
        const wrapper = mount(
            <AssayImportSubMenuItemImpl
                {...DEFAULT_PROPS}
                isLoaded={false}
            />
        );

        expect(wrapper.find('.fa-spinner')).toHaveLength(1);
        expect(wrapper.find(MenuItem)).toHaveLength(1);
        expect(wrapper.find(SubMenuItem)).toHaveLength(0);
        expect(wrapper.find(OverlayTrigger)).toHaveLength(0);

        wrapper.unmount();
    });

    test('with items', () => {
        const wrapper = mount(
            <AssayImportSubMenuItemImpl
                {...DEFAULT_PROPS}
                providerType={GENERAL_ASSAY_PROVIDER_NAME}
            />
        );

        expect(wrapper.find('.fa-spinner')).toHaveLength(0);
        expect(wrapper.find(MenuItem)).toHaveLength(0);
        expect(wrapper.find(SubMenuItem)).toHaveLength(1);
        expect(wrapper.find(OverlayTrigger)).toHaveLength(0);

        wrapper.unmount();
    });

    test('no items', () => {
        const wrapper = mount(
            <AssayImportSubMenuItemImpl
                {...DEFAULT_PROPS}
                providerType="BOGUS"
            />
        );

        expect(wrapper.find('.fa-spinner')).toHaveLength(0);
        expect(wrapper.find(MenuItem)).toHaveLength(0);
        expect(wrapper.find(SubMenuItem)).toHaveLength(0);
        expect(wrapper.find(OverlayTrigger)).toHaveLength(0);

        wrapper.unmount();
    });

    test('requireSelection with too few selected', () => {
        const wrapper = mount(
            <AssayImportSubMenuItemImpl
                {...DEFAULT_PROPS}
                requireSelection={true}
                model={new QueryGridModel({ selectedIds: List<string>() })}
            />
        );

        expect(wrapper.find('.fa-spinner')).toHaveLength(0);
        expect(wrapper.find(SubMenuItem)).toHaveLength(0);

        const menuitem = wrapper.find(MenuItem);
        expect(menuitem).toHaveLength(1);
        expect(menuitem.text()).toBe('Upload Assay Data');
        expect(menuitem.props().disabled).toBeTruthy();
        const trigger = wrapper.find(OverlayTrigger);
        expect(trigger).toHaveLength(1);

        wrapper.unmount();
    });

    test('requireSelection with proper number selected', () => {
        const wrapper = mount(
            <AssayImportSubMenuItemImpl
                {...DEFAULT_PROPS}
                text="Test Assay Import"
                requireSelection={true}
                model={new QueryGridModel({ selectedIds: List<string>(['test']) })}
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
