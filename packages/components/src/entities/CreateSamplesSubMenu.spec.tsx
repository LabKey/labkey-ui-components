import React from 'react';
import { List } from 'immutable';
import { mount, ReactWrapper } from 'enzyme';

import { MenuOption, SubMenu } from '../internal/components/menus/SubMenu';
import { SchemaQuery } from '../public/SchemaQuery';

import { makeTestQueryModel } from '../public/QueryModel/testUtils';

import { SampleCreationType } from '../internal/components/samples/models';
import { SCHEMAS } from '../internal/schemas';
import { QueryInfo } from '../public/QueryInfo';
import { mountWithAppServerContext, waitForLifecycle } from '../internal/testHelpers';

import { CreateSamplesSubMenuBase } from './CreateSamplesSubMenuBase';
import { CreateSamplesSubMenu, MAX_PARENTS_PER_SAMPLE } from './CreateSamplesSubMenu';
import { SampleCreationTypeModal } from './SampleCreationTypeModal';

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
    loadSampleTypes: jest.fn(async () => [
        new QueryInfo({ insertUrl: '#/b/new', name: 'b', queryLabel: 'B' }),
        new QueryInfo({ insertUrl: '#/a/new', name: 'a', queryLabel: 'A' }),
    ]),
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

    test('default props', async () => {
        const wrapper = mountWithAppServerContext(<CreateSamplesSubMenu {...DEFAULT_PROPS} />);
        await waitForLifecycle(wrapper);
        const options = validate(wrapper, 2);
        expect(options.get(0).name).toBe('A');
        expect(options.get(0).disabled).toBe(false);
        expect(options.get(0).disabledMsg).toBe(undefined);
        expect(options.get(0).href).toBe('#/samples/new?target=a');
        expect(options.get(0).onClick).toBe(undefined);
        wrapper.unmount();
    });

    test('without sampleQueryInfos', async () => {
        const loadSampleTypesEmpty = jest.fn(async () => []);
        const wrapper = mountWithAppServerContext(
            <CreateSamplesSubMenu {...DEFAULT_PROPS} loadSampleTypes={loadSampleTypesEmpty} />
        );
        await waitForLifecycle(wrapper);
        validate(wrapper, 1);
        wrapper.unmount();
    });

    test('menuText', async () => {
        const wrapper = mountWithAppServerContext(<CreateSamplesSubMenu {...DEFAULT_PROPS} />);
        await waitForLifecycle(wrapper);
        validate(wrapper, 2);
        expect(wrapper.find(SubMenu).prop('text')).toBe('Create Samples');
        wrapper.setProps({ menuText: 'Other' });
        expect(wrapper.find(SubMenu).prop('text')).toBe('Other');
        wrapper.unmount();
    });

    test('current sample type', async () => {
        const wrapper = mountWithAppServerContext(
            <CreateSamplesSubMenu
                {...DEFAULT_PROPS}
                selectedQueryInfo={
                    new QueryInfo({
                        schemaName: 'samples',
                        schemaQuery: SchemaQuery.create('samples', 'Other'),
                    })
                }
            />
        );
        await waitForLifecycle(wrapper);
        validate(wrapper, 2, 'Create Samples', 'Other');
        expect(wrapper.find(SubMenu).prop('currentMenuChoice')).toBe('Other');
        wrapper.unmount();
    });

    test('item sorting by queryLabel', async () => {
        const wrapper = mountWithAppServerContext(<CreateSamplesSubMenu {...DEFAULT_PROPS} />);
        await waitForLifecycle(wrapper);
        const options = validate(wrapper, 2);
        expect(options.get(0).name).toBe('A');
        expect(options.get(1).name).toBe('B');
        wrapper.unmount();
    });

    test('useOnClick for parentKey', async () => {
        const wrapper = mountWithAppServerContext(<CreateSamplesSubMenu {...DEFAULT_PROPS} parentKey="123" />);
        await waitForLifecycle(wrapper);
        const options = validate(wrapper, 2);
        expect(options.get(0).href).toBe(undefined);
        expect(options.get(0).onClick).toBeDefined();
        wrapper.unmount();
    });

    test('useOnClick for parentQueryModel with selection', async () => {
        const model = makeTestQueryModel(SchemaQuery.create('samples', 'Test')).mutate({ selections: new Set('1') });
        const wrapper = mountWithAppServerContext(
            <CreateSamplesSubMenu {...DEFAULT_PROPS} parentQueryModel={model} isSelectingSamples={() => true} />
        );
        await waitForLifecycle(wrapper);
        const options = validate(wrapper, 2);
        expect(options.get(0).href).toBe(undefined);
        expect(options.get(0).onClick).toBeDefined();
        wrapper.unmount();
    });

    test('useOnClick, media without selections', async () => {
        const model = makeTestQueryModel(SCHEMAS.SAMPLE_SETS.SAMPLES).mutate({ selections: new Set() });
        const wrapper = mountWithAppServerContext(
            <CreateSamplesSubMenu
                {...DEFAULT_PROPS}
                selectedQueryInfo={new QueryInfo({ schemaName: 'samples', isMedia: true })}
                parentQueryModel={model}
            />
        );
        await waitForLifecycle(wrapper);
        const options = validate(wrapper, 2);
        expect(options.get(0).disabled).toBeTruthy();
        expect(options.get(0).href).toBeUndefined();
        expect(options.get(0).onClick).toBeUndefined();
        wrapper.unmount();
    });

    test('use href for parentQueryModel with non sample or source schema', async () => {
        const model = makeTestQueryModel(SchemaQuery.create('other', 'Test')).mutate({ selections: new Set('1') });
        const wrapper = mountWithAppServerContext(<CreateSamplesSubMenu {...DEFAULT_PROPS} parentQueryModel={model} />);
        await waitForLifecycle(wrapper);
        const options = validate(wrapper, 2);
        expect(options.get(0).href).toBe('#/samples/new?target=a&selectionKey=model');
        expect(options.get(0).onClick).toBe(undefined);
        wrapper.unmount();
    });

    test('disabledMsg', async () => {
        const selections = new Set<string>();
        for (var i = 0; i < MAX_PARENTS_PER_SAMPLE + 1; i++) {
            selections.add('' + i);
        }
        const model = makeTestQueryModel(SchemaQuery.create('samples', 'Test')).mutate({ selections });
        const wrapper = mountWithAppServerContext(
            <CreateSamplesSubMenu
                {...DEFAULT_PROPS}
                parentQueryModel={model}
                selectedType={SampleCreationType.PooledSamples}
            />
        );
        await waitForLifecycle(wrapper);
        const options = validate(wrapper, 2);
        expect(options.get(0).disabled).toBe(true);
        expect(options.get(0).disabledMsg).toBeDefined();
        expect(options.get(0).href).toBe(undefined);
        expect(options.get(0).onClick).toBe(undefined);
        wrapper.unmount();
    });

    test('subMenuText', () => {
        const wrapper = mountWithAppServerContext(
            <CreateSamplesSubMenu {...DEFAULT_PROPS} subMenuText="subMenuText" />
        );
        const options = validate(wrapper, 1, null);
        expect(options.get(0).name).toBe('subMenuText');
        expect(options.get(0).disabled).toBe(false);
        expect(options.get(0).disabledMsg).toBe(undefined);
        expect(options.get(0).href).toBe('#/samples/new');
        expect(options.get(0).onClick).toBe(undefined);
        wrapper.unmount();
    });
});
