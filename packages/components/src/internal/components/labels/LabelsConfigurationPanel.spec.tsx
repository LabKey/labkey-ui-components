import React from 'react';

import { getTestAPIWrapper } from '../../APIWrapper';

import { mountWithAppServerContext } from '../../testHelpers';

import { ChoicesListItem } from '../base/ChoicesListItem';

import { getLabelPrintingTestAPIWrapper } from './APIWrapper';
import { LabelsConfigurationPanel, LabelTemplateDetails, LabelTemplatesList } from './LabelsConfigurationPanel';
import { LabelTemplate } from './models';

describe('LabelsConfigurationPanel', () => {
    const DEFAULT_PROPS = {
        api: getTestAPIWrapper(jest.fn(), {
            labelprinting: getLabelPrintingTestAPIWrapper(jest.fn),
        }),
        defaultLabel: undefined,
    };

    test('default props', () => {
        const wrapper = mountWithAppServerContext(<LabelsConfigurationPanel {...DEFAULT_PROPS} />);

        expect(wrapper.find(LabelTemplatesList)).toHaveLength(1);
        expect(wrapper.find(LabelTemplateDetails)).toHaveLength(1);
    });
});

describe('LabelTemplatesList', () => {
    const DEFAULT_PROPS = {
        onSelect: jest.fn(),
        selected: undefined,
        templates: [],
    };

    test('default props', () => {
        const wrapper = mountWithAppServerContext(<LabelTemplatesList {...DEFAULT_PROPS} />);

        expect(wrapper.find('.choices-list__empty-message')).toHaveLength(1);
        expect(wrapper.find(ChoicesListItem)).toHaveLength(0);
    });

    test('Single Item', () => {
        const wrapper = mountWithAppServerContext(
            <LabelTemplatesList
                {...DEFAULT_PROPS}
                templates={[
                    new LabelTemplate({
                        name: 'T1',
                        path: 'T1_path',
                        rowId: 0,
                    }),
                ]}
            />
        );

        expect(wrapper.find('.choices-list__empty-message')).toHaveLength(0);
        expect(wrapper.find(ChoicesListItem)).toHaveLength(1);
    });

    test('Two Items', () => {
        const wrapper = mountWithAppServerContext(
            <LabelTemplatesList
                {...DEFAULT_PROPS}
                templates={[
                    new LabelTemplate({
                        name: 'T1',
                        path: 'T1_path',
                        rowId: 0,
                    }),
                    new LabelTemplate({
                        name: 'T2',
                        path: 'T2_path',
                        rowId: 1,
                    }),
                ]}
            />
        );

        expect(wrapper.find('.choices-list__empty-message')).toHaveLength(0);
        expect(wrapper.find(ChoicesListItem)).toHaveLength(2);
    });

    test('Two Items, with default', () => {
        const wrapper = mountWithAppServerContext(
            <LabelTemplatesList
                {...DEFAULT_PROPS}
                defaultLabel={0}
                templates={[
                    new LabelTemplate({
                        name: 'T1',
                        path: 'T1_path',
                        rowId: 0,
                    }),
                    new LabelTemplate({
                        name: 'T2',
                        path: 'T2_path',
                        rowId: 1,
                    }),
                ]}
            />
        );

        expect(wrapper.find('.choices-list__empty-message')).toHaveLength(0);
        expect(wrapper.find(ChoicesListItem)).toHaveLength(2);
        expect(wrapper.find('.badge')).toHaveLength(1);
        expect(wrapper.find('.badge').text()).toBe('default');
    });
});

describe('LabelTemplateDetails', () => {
    const DEFAULT_PROPS = {
        api: getTestAPIWrapper(jest.fn(), {
            labelprinting: getLabelPrintingTestAPIWrapper(jest.fn),
        }),
        defaultLabel: undefined,
        isNew: false,
        onActionCompleted: jest.fn(),
        onDefaultChanged: jest.fn(),
        onChange: jest.fn(),
        template: null,
        isDefaultable: false,
    };

    test('default props', () => {
        const wrapper = mountWithAppServerContext(<LabelTemplateDetails {...DEFAULT_PROPS} />);
        expect(wrapper.find('.choices-detail__empty-message')).toHaveLength(0);
    });

    test('Nothing selected message', () => {
        const wrapper = mountWithAppServerContext(<LabelTemplateDetails {...DEFAULT_PROPS} template={undefined} />);
        expect(wrapper.find('.choices-detail__empty-message')).toHaveLength(1);
    });

    test('Template Selected, cant be default', () => {
        const wrapper = mountWithAppServerContext(
            <LabelTemplateDetails
                {...DEFAULT_PROPS}
                isNew={true}
                template={
                    new LabelTemplate({
                        name: '',
                        path: '',
                        description: '',
                        container: '',
                    })
                }
            />
        );

        expect(wrapper.find('.choices-detail__empty-message')).toHaveLength(0);
        expect(wrapper.find('FormGroup')).toHaveLength(3);
    });

    // test('Template Selected, w/ default', () => {
    //     const wrapper = mountWithAppServerContext(
    //         <LabelTemplateDetails
    //             {...DEFAULT_PROPS}
    //             isNew={true}
    //             template={
    //                 new LabelTemplate({
    //                     name: '',
    //                     path: '',
    //                     description: '',
    //                     container: '',
    //                 })
    //             }
    //             isDefaultable={true}
    //         />,
    //         undefined,
    //         {
    //             container: '',
    //         } as Partial<ServerContext>
    //     );
    //
    //     expect(wrapper.find('.choices-detail__empty-message')).toHaveLength(0);
    //     expect(wrapper.find('FormGroup')).toHaveLength(4);
    // });
});
