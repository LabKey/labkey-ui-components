import React from 'react';
import { mount } from 'enzyme';

import { App, AssayDefinitionModel, AssayStateModel, initQueryGridState, LoadingState } from '../../..';

import { RecentAssayPanelImpl } from './RecentAssayPanel';

describe('<RecentAssayPanel/>', () => {
    initQueryGridState();

    const generalAssays = [
        new AssayDefinitionModel({ id: 17, name: 'First Assay', type: 'General' }),
        new AssayDefinitionModel({ id: 41, name: '41st', type: 'General' }),
    ];

    const assayModel = new AssayStateModel({
        definitions: generalAssays.concat([
            new AssayDefinitionModel({ id: 1, name: 'Some Luminex Assay', type: 'Luminex' }),
        ]),
        definitionsLoadingState: LoadingState.LOADED,
    });

    test('author all assays', () => {
        const wrapper = mount(
            <RecentAssayPanelImpl
                assayDefinition={undefined}
                assayModel={assayModel}
                assayProtocol={undefined}
                reloadAssays={jest.fn()}
                user={App.TEST_USER_AUTHOR}
            />
        );

        // Ensure all assay items appear in drop down
        const assayMenuItems = wrapper.find('MenuItem a');
        expect(assayMenuItems.length).toEqual(generalAssays.length + 1);

        // select an assay
        assayMenuItems.at(1).simulate('click');

        // Expect author is shown button to import data
        expect(wrapper.find('.recent-assays_import-btn').exists()).toEqual(true);
    });

    test('reader all assays', () => {
        const wrapper = mount(
            <RecentAssayPanelImpl
                assayDefinition={undefined}
                assayModel={assayModel}
                assayProtocol={undefined}
                reloadAssays={jest.fn()}
                user={App.TEST_USER_READER}
            />
        );

        // Ensure all assay items appear in drop down
        const assayMenuItems = wrapper.find('MenuItem a');
        expect(assayMenuItems.length).toEqual(generalAssays.length + 1);

        // select an assay
        assayMenuItems.at(1).simulate('click');

        // Expect author is shown button to import data
        expect(wrapper.find('.recent-assays_import-btn').exists()).toEqual(false);
    });

    test('empty assays', () => {
        const wrapper = mount(
            <RecentAssayPanelImpl
                assayDefinition={undefined}
                assayModel={assayModel.mutate({ definitions: [] })}
                assayProtocol={undefined}
                reloadAssays={jest.fn()}
                user={App.TEST_USER_AUTHOR}
            />
        );

        // Dropdown does not appear
        expect(wrapper.find('MenuItem').exists()).toEqual(false);

        // Expect <AssayDesignEmptyAlert /> to be displayed
        expect(wrapper.find('.assay-design-empty').exists()).toEqual(true);
    });
});
