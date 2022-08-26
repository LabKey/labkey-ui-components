import React from 'react';
import { List } from 'immutable';
import { mount, ReactWrapper } from 'enzyme';

import { SAMPLES_KEY } from '../../app/constants';

import { TEST_USER_APP_ADMIN } from '../../userFixtures';

import { CreateSamplesSubMenuBase } from './CreateSamplesSubMenuBase';
import {CreateSamplesSubMenu, MAX_PARENTS_PER_SAMPLE} from './CreateSamplesSubMenu';
import {MenuOption, SubMenu} from "../menus/SubMenu";
import {SchemaQuery} from "../../../public/SchemaQuery";
import {SampleCreationTypeModal} from "./SampleCreationTypeModal";
import {MenuSectionModel, ProductMenuModel} from "../navigation/model";
import {makeTestQueryModel} from "../../../public/QueryModel/testUtils";

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
    isSelectingSamples: (schemaQuery: SchemaQuery) => {
        return schemaQuery?.schemaName.toLowerCase() === 'samples';
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

let menu = new ProductMenuModel({ currentProductId: 'jest-test' });
menu = menu.setLoadedSections(
    List<MenuSectionModel>([
        MenuSectionModel.create({
            key: SAMPLES_KEY,
            label: 'Samples',
            totalCount: 2,
            items: [
                { id: 100, key: 'a', label: 'SampleSetA' },
                { id: 200, key: 'b', label: 'SampleSetAB' },
            ],
            sectionKey: SAMPLES_KEY,
        }),
    ])
);

const DEFAULT_PROPS_MENU = {
    menu,
    user: TEST_USER_APP_ADMIN,
    parentType: 'samples',
    isSelectingSamples: () => false,
    navigate: jest.fn(),
};

describe('CreateSamplesSubMenu', () => {
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
        const wrapper = mount(<CreateSamplesSubMenu {...DEFAULT_PROPS_MENU} />);
        const options = validate(wrapper, 2);
        expect(options.get(0).name).toBe('SampleSetA');
        expect(options.get(0).disabled).toBe(false);
        expect(options.get(0).disabledMsg).toBe(undefined);
        expect(options.get(0).href).toBe('#/samples/new?target=a');
        expect(options.get(0).onClick).toBe(undefined);
        wrapper.unmount();
    });

    test('useOnClick for parentKey', () => {
        const wrapper = mount(<CreateSamplesSubMenu {...DEFAULT_PROPS_MENU} parentKey="123" />);
        const options = validate(wrapper, 2);
        expect(options.get(0).href).toBe(undefined);
        expect(options.get(0).onClick).toBeDefined();
        wrapper.unmount();
    });

    test('useOnClick for parentQueryModel with selection', () => {
        const model = makeTestQueryModel(SchemaQuery.create('samples', 'Test')).mutate({ selections: new Set('1') });
        const wrapper = mount(
            <CreateSamplesSubMenu {...DEFAULT_PROPS_MENU} parentQueryModel={model} isSelectingSamples={() => true} />
        );
        const options = validate(wrapper, 2);
        expect(options.get(0).href).toBe(undefined);
        expect(options.get(0).onClick).toBeDefined();
        wrapper.unmount();
    });

    test('use href for parentQueryModel with non sample or source schema', () => {
        const model = makeTestQueryModel(SchemaQuery.create('other', 'Test')).mutate({ selections: new Set('1') });
        const wrapper = mount(<CreateSamplesSubMenu {...DEFAULT_PROPS_MENU} parentQueryModel={model} />);
        const options = validate(wrapper, 2);
        expect(options.get(0).href).toBe('#/samples/new?target=a&selectionKey=model');
        expect(options.get(0).onClick).toBe(undefined);
        wrapper.unmount();
    });

    test('disabledMsg', () => {
        const selections = new Set<string>();
        for (var i = 0; i < MAX_PARENTS_PER_SAMPLE + 1; i++) {
            selections.add('' + i);
        }
        const model = makeTestQueryModel(SchemaQuery.create('samples', 'Test')).mutate({ selections });
        const wrapper = mount(<CreateSamplesSubMenu {...DEFAULT_PROPS_MENU} parentQueryModel={model} />);
        const options = validate(wrapper, 2);
        expect(options.get(0).disabled).toBe(true);
        expect(options.get(0).disabledMsg).toBeDefined();
        expect(options.get(0).href).toBe(undefined);
        expect(options.get(0).onClick).toBe(undefined);
        wrapper.unmount();
    });

    test('subMenuText', () => {
        const wrapper = mount(<CreateSamplesSubMenu {...DEFAULT_PROPS_MENU} subMenuText="subMenuText" />);
        const options = validate(wrapper, 1, null);
        expect(options.get(0).name).toBe('subMenuText');
        expect(options.get(0).disabled).toBe(false);
        expect(options.get(0).disabledMsg).toBe(undefined);
        expect(options.get(0).href).toBe('#/samples/new');
        expect(options.get(0).onClick).toBe(undefined);
        wrapper.unmount();
    });
});
