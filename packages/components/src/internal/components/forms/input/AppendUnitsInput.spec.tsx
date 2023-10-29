import React from 'react';
import { mount } from 'enzyme';
import Formsy from 'formsy-react';

import { QueryColumn } from '../../../../public/QueryColumn';

import { Input } from './FormsyReactComponents';

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
        expect(wrapper.exists(Input)).toBeFalsy();
        wrapper.unmount();
    });

    test('with formsy', () => {
        const wrapper = mount(
            <Formsy>
                <AppendUnitsInput col={column} data={undefined} formsy value={undefined} />
            </Formsy>
        );
        expect(wrapper.exists(Input)).toBeTruthy();
        wrapper.unmount();
    });
});
