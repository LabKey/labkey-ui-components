import React from 'react';
import { List, Map } from 'immutable';
import { mount } from 'enzyme';
import renderer from 'react-test-renderer';
import toJson from 'enzyme-to-json';

import { Alert } from '../../base/Alert';
import { PROPERTIES_PANEL_ERROR_MSG } from '../constants';
import DomainForm from '../DomainForm';

import { FileAttachmentForm } from '../../files/FileAttachmentForm';

import { DomainDetails, DomainField } from '../models';

import { SampleTypePropertiesPanel } from './SampleTypePropertiesPanel';
import { SampleTypeDesigner } from './SampleTypeDesigner';

const BASE_PROPS = {
    initModel: undefined,
    onComplete: jest.fn(),
    onCancel: jest.fn(),
};

describe('SampleTypeDesigner', () => {
    test('default properties', () => {
        const form = <SampleTypeDesigner {...BASE_PROPS} />;

        const tree = renderer.create(form).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('custom properties', () => {
        const form = (
            <SampleTypeDesigner
                {...BASE_PROPS}
                nounSingular="Some Sample"
                nounPlural="Some Samples"
                nameExpressionInfoUrl="https://www.labkey.org/Documentation"
                nameExpressionPlaceholder="name expression placeholder test"
                headerText="header text test"
                useTheme={true}
                containerTop={10}
                appPropertiesOnly={false}
                successBsStyle="primary"
                saveBtnText="Finish it up"
            />
        );

        const tree = renderer.create(form).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('initModel with name URL props', () => {
        const form = (
            <SampleTypeDesigner
                {...BASE_PROPS}
                initModel={DomainDetails.create(
                    Map<string, any>({
                        domainDesign: {
                            name: 'Test Name',
                            fields: [{ name: 'testfield' }],
                        },
                        nameReadOnly: true,
                    })
                )}
            />
        );
        const wrapped = mount(form);

        expect(wrapped.find(SampleTypePropertiesPanel)).toHaveLength(1);
        expect(wrapped.find(DomainForm)).toHaveLength(1);
        expect(wrapped.find(FileAttachmentForm)).toHaveLength(0);
        expect(toJson(wrapped)).toMatchSnapshot();
        wrapped.unmount();
    });

    test('open fields panel', () => {
        const wrapped = mount(<SampleTypeDesigner {...BASE_PROPS} />);

        const panelHeader = wrapped.find('div#domain-header');
        expect(wrapped.find('#domain-header').at(2).hasClass('domain-panel-header-collapsed')).toBeTruthy();
        panelHeader.simulate('click');
        expect(wrapped.find('#domain-header').at(2).hasClass('domain-panel-header-expanded')).toBeTruthy();
        expect(wrapped.find(FileAttachmentForm)).toHaveLength(1);

        expect(wrapped.find(Alert)).toHaveLength(2);
        expect(wrapped.find(Alert).at(0).text()).toEqual(PROPERTIES_PANEL_ERROR_MSG);
        expect(wrapped.find(Alert).at(1).text()).toEqual(
            'Please correct errors in the properties panel before saving.'
        );
        wrapped.unmount();
    });
});
