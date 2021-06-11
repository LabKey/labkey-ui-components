import React from 'react';
import { List } from 'immutable';
import { mount, ReactWrapper } from 'enzyme';

import { MenuOption, SampleCreationTypeModal, SubMenu } from '../../..';

import { CreateSamplesSubMenuBase } from './CreateSamplesSubMenuBase';

const sampleOptions = [
    {
        key: 'Blood',
        name: 'Blood',
        disabled: false,
        href: '#/samples/new?target=Blood',
    },
    {
        key: 'MixtureBatches',
        name: 'MixtureBatches',
        disabled: false,
        href: '#/samples/new?target=MixtureBatches',
    },
];

const getOptions = (useOnClick: boolean, disabledMsg: string, itemActionFn: (key: string) => any) => {
    return List<MenuOption>(sampleOptions);
};

const DEFAULT_PROPS = {
    navigate: () => {},
    maxParentPerSample: 10,
    getOptions,
    parentType: 'samples',
    isSelectingSamples: (schemaName: string) => {
        return schemaName?.toLowerCase() === 'samples';
    },
};

describe('CreateSamplesSubMenuBase', () => {
    function validate(
        wrapper: ReactWrapper,
        optionCount: number,
        menuText = 'Create Samples',
        currentMenuChoice?: string
    ): List<MenuOption> {
        expect(wrapper.find(SampleCreationTypeModal)).toHaveLength(0);

        const submenu = wrapper.find(SubMenu);
        expect(submenu).toHaveLength(1);
        expect(submenu.prop('text')).toBe(menuText);
        expect(submenu.prop('currentMenuChoice')).toBe(currentMenuChoice);

        const options = submenu.prop('options');
        expect(options.size).toBe(optionCount);
        return options;
    }

    test('default props', () => {
        const wrapper = mount(<CreateSamplesSubMenuBase {...DEFAULT_PROPS} />);
        const options = validate(wrapper, 2);

        expect(options.get(0).name).toBe('Blood');
        expect(options.get(0).disabled).toBe(false);
        expect(options.get(0).disabledMsg).toBe(undefined);
        expect(options.get(0).href).toBe('#/samples/new?target=Blood');
        expect(options.get(0).onClick).toBe(undefined);
        wrapper.unmount();
    });

    test('SubMenu props', () => {
        const wrapper = mount(
            <CreateSamplesSubMenuBase {...DEFAULT_PROPS} menuText="Test1" menuCurrentChoice="MixtureBatches" />
        );
        validate(wrapper, 2, 'Test1', 'MixtureBatches');
        wrapper.unmount();
    });
});
