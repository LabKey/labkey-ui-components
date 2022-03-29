import React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import { fromJS } from 'immutable';

import { CustomPropertiesRenderer } from './LineageDetail';

describe('CustomPropertiesRenderer', () => {
    const DEFAULT_PROPS = {
        data: fromJS([]),
    };

    function validate(wrapper: ReactWrapper, rowCount: number): void {
        expect(wrapper.find('.lineage-detail-prop-table')).toHaveLength(1);
        expect(wrapper.find('tr')).toHaveLength(rowCount);
        expect(wrapper.find('.lineage-detail-prop-cell')).toHaveLength(rowCount * 2);
    }

    test('no data', () => {
        const wrapper = mount(<CustomPropertiesRenderer {...DEFAULT_PROPS} />);
        validate(wrapper, 0);
        wrapper.unmount();
    });

    test('with data', () => {
        const wrapper = mount(
            <CustomPropertiesRenderer
                {...DEFAULT_PROPS}
                data={fromJS([
                    { fieldKey: 'urn:lsid:labkey$Pcom:Vocabulary$PFolder-771:ProtocolDomain#prop1', value: 1 },
                    { fieldKey: 'urn:lsid:labkey$Pcom:Vocabulary$PFolder-771:ProtocolDomain#prop2', value: 'test2' },
                ])}
            />
        );
        validate(wrapper, 2);
        const cells = wrapper.find('.lineage-detail-prop-cell');
        expect(cells.at(0).text()).toBe('prop1');
        expect(cells.at(1).text()).toBe('1');
        expect(cells.at(2).text()).toBe('prop2');
        expect(cells.at(3).text()).toBe('test2');
        wrapper.unmount();
    });
});
