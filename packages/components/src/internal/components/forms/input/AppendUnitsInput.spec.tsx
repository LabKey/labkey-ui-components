import React from 'react';
import { mount } from 'enzyme';

import { QueryColumn } from '../../../../public/QueryColumn';

import { Formsy } from '../formsy';
import { FormsyInput } from './FormsyReactComponents';

import { AppendUnitsInput } from './AppendUnitsInput';

describe('AppendUnitsInput', () => {
    const column = new QueryColumn({
        caption: 'Molecular Weight',
        fieldKey: 'appendUnitsColumn',
        name: 'appendUnitsColumn',
    });

    test('without formsy', () => {
        // Without Formsy it should not crash the page
        const wrapper = mount(<AppendUnitsInput col={column} data={undefined} value={undefined} />);
        expect(wrapper.exists(FormsyInput)).toBeFalsy();
        wrapper.unmount();
    });

    test('with formsy', () => {
        const wrapper = mount(
            <Formsy>
                <AppendUnitsInput col={column} data={undefined} formsy value={undefined} />
            </Formsy>
        );
        expect(wrapper.exists(FormsyInput)).toBeTruthy();
        wrapper.unmount();
    });
});
