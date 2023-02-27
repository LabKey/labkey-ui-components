import React from 'react';
import { shallow } from 'enzyme';
import { List } from 'immutable';
import { Button } from 'react-bootstrap';

import { DetailPanelHeader } from '../internal/components/forms/detail/DetailPanelHeader';

import { SchemaQuery } from '../public/SchemaQuery';

import { Alert } from '../internal/components/base/Alert';
import { LoadingSpinner } from '../internal/components/base/LoadingSpinner';

import { DataClassDataType } from '../internal/components/entities/constants';

import { waitForLifecycle } from '../internal/testHelpers';

import { Progress } from '../internal/components/base/Progress';

import { ParentEntityEditPanel, ParentEntityEditPanelProps } from './ParentEntityEditPanel';

describe('ParentEntityEditPanel', () => {
    const schemaQuery = new SchemaQuery('samples', 'example');

    function defaultProps(): ParentEntityEditPanelProps {
        return {
            canUpdate: false,
            childNounSingular: 'Testing',
            childSchemaQuery: schemaQuery,
            getParentTypeDataForLineage: jest.fn().mockResolvedValue({
                parentIdData: {},
                parentTypeOptions: List(),
            }),
            parentDataTypes: [DataClassDataType],
            title: 'Test 123',
        };
    }

    test('loading / error state', async () => {
        const getParentTypeDataForLineage = jest.fn().mockRejectedValue('Throws error!');
        const wrapper = shallow(
            <ParentEntityEditPanel {...defaultProps()} getParentTypeDataForLineage={getParentTypeDataForLineage} />
        );
        expect(wrapper.find(LoadingSpinner).exists()).toBe(true);

        await waitForLifecycle(wrapper);

        expect(wrapper.find(LoadingSpinner).exists()).toBe(false);
        expect(wrapper.find(DetailPanelHeader).exists()).toBe(true);
        expect(wrapper.find(Alert)).toHaveLength(1);
        expect(getParentTypeDataForLineage).toHaveBeenCalled();
        wrapper.unmount();
    });

    test('editing, no data', async () => {
        const wrapper = shallow(<ParentEntityEditPanel {...defaultProps()} canUpdate editOnly />);

        await waitForLifecycle(wrapper);

        const header = wrapper.find(DetailPanelHeader);
        expect(header.prop('isEditable')).toEqual(true);
        expect(header.prop('title')).toEqual('Test 123');
        expect(wrapper.find(Button)).toHaveLength(2);
        expect(wrapper.find(Progress).exists()).toBe(true);

        wrapper.setProps({ hideButtons: true, includePanelHeader: false });
        expect(wrapper.find(Button)).toHaveLength(0);
        expect(wrapper.find(DetailPanelHeader).exists()).toBe(false);

        wrapper.unmount();
    });
});
