import React from 'react';
import { CreateSamplesMenuItem } from './CreateSamplesMenuItem';
import { QueryInfo } from '../public/QueryInfo';
import { mount, ReactWrapper } from 'enzyme';
import { List } from 'immutable';
import { MenuOption, SubMenu } from '../internal/components/menus/SubMenu';
import { SampleCreationTypeModal } from './SampleCreationTypeModal';
import { waitForLifecycle } from '../internal/testHelpers';
import { SchemaQuery } from '../public/SchemaQuery';
import { makeTestQueryModel } from '../public/QueryModel/testUtils';
import { SCHEMAS } from '../internal/schemas';
import { SampleCreationType } from '../internal/components/samples/models';

const DEFAULT_PROPS = {
    loadSampleTypes: jest.fn(async () => [
        new QueryInfo({ insertUrl: '#/b/new', name: 'b', queryLabel: 'B' }),
        new QueryInfo({ insertUrl: '#/a/new', name: 'a', queryLabel: 'A' }),
    ]),
    navigate: jest.fn,
};

describe('CreateSamplesMenuItem', () => {
    function validate(wrapper: ReactWrapper, rendered = true, optionsCount = 2): List<MenuOption> {
        expect(wrapper.find(SubMenu)).toHaveLength(rendered ? 1 : 0);
        expect(wrapper.find(SampleCreationTypeModal)).toHaveLength(0);

        let options;
        if (rendered) {
            options = wrapper.find(SubMenu).prop('options');
            expect(options.size).toBe(optionsCount);
        }
        return options;
    }

    test('without sampleQueryInfos', async () => {
        const loadSampleTypesEmpty = jest.fn(async () => []);
        const wrapper = mount(<CreateSamplesMenuItem {...DEFAULT_PROPS} loadSampleTypes={loadSampleTypesEmpty} />);
        await waitForLifecycle(wrapper);
        validate(wrapper, true, 1);
        wrapper.unmount();
    });

    test('menuText', async () => {
        const wrapper = mount(<CreateSamplesMenuItem {...DEFAULT_PROPS} />);
        await waitForLifecycle(wrapper);
        validate(wrapper);
        expect(wrapper.find(SubMenu).prop('text')).toBe('Create Samples');
        wrapper.setProps({ menuText: 'Other' });
        expect(wrapper.find(SubMenu).prop('text')).toBe('Other');
        wrapper.unmount();
    });

    test('currentSampleSet', async () => {
        const wrapper = mount(<CreateSamplesMenuItem {...DEFAULT_PROPS} />);
        await waitForLifecycle(wrapper);
        validate(wrapper);
        expect(wrapper.find(SubMenu).prop('currentMenuChoice')).toBe(undefined);
        wrapper.setProps({
            selectedQueryInfo: new QueryInfo({
                schemaName: 'samples',
                schemaQuery: SchemaQuery.create('samples', 'Other'),
            }),
        });
        expect(wrapper.find(SubMenu).prop('currentMenuChoice')).toBe('Other');
        wrapper.unmount();
    });

    test('item sorting by queryLabel', async () => {
        const wrapper = mount(<CreateSamplesMenuItem {...DEFAULT_PROPS} />);
        await waitForLifecycle(wrapper);
        const options = validate(wrapper);
        expect(options.get(0).name).toBe('A');
        expect(options.get(1).name).toBe('B');
        wrapper.unmount();
    });

    test('useOnClick, non-media with selections', async () => {
        const model = makeTestQueryModel(SCHEMAS.SAMPLE_SETS.SAMPLES).mutate({ selections: new Set(['1']) });
        const wrapper = mount(
            <CreateSamplesMenuItem
                {...DEFAULT_PROPS}
                selectedQueryInfo={new QueryInfo({ schemaName: 'samples', isMedia: false })}
                parentQueryModel={model}
            />
        );
        await waitForLifecycle(wrapper);
        const options = validate(wrapper);
        expect(options.get(0).disabled).toBeFalsy();
        expect(options.get(0).href).toBeUndefined();
        expect(options.get(0).onClick).toBeDefined();
        wrapper.unmount();
    });

    test('useOnClick, non-media without selections', async () => {
        const model = makeTestQueryModel(SCHEMAS.SAMPLE_SETS.SAMPLES).mutate({ selections: new Set() });
        const wrapper = mount(
            <CreateSamplesMenuItem
                {...DEFAULT_PROPS}
                selectedQueryInfo={new QueryInfo({ schemaName: 'samples', isMedia: false })}
                parentQueryModel={model}
            />
        );
        await waitForLifecycle(wrapper);
        const options = validate(wrapper);
        expect(options.get(0).disabled).toBeTruthy();
        expect(options.get(0).href).toBeUndefined();
        expect(options.get(0).onClick).toBeUndefined();
        wrapper.unmount();
    });

    test('useOnClick, media without selections', async () => {
        const model = makeTestQueryModel(SCHEMAS.SAMPLE_SETS.SAMPLES).mutate({ selections: new Set() });
        const wrapper = mount(
            <CreateSamplesMenuItem
                {...DEFAULT_PROPS}
                selectedQueryInfo={new QueryInfo({ schemaName: 'samples', isMedia: true })}
                parentQueryModel={model}
            />
        );
        await waitForLifecycle(wrapper);
        const options = validate(wrapper);
        expect(options.get(0).disabled).toBeTruthy();
        expect(options.get(0).href).toBeUndefined();
        expect(options.get(0).onClick).toBeUndefined();
        wrapper.unmount();
    });

    test('disabledMsg, non-media with too many parent selections', async () => {
        const model = makeTestQueryModel(SCHEMAS.SAMPLE_SETS.SAMPLES).mutate({
            selections: new Set(['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21'])
        });
        const wrapper = mount(
            <CreateSamplesMenuItem
                {...DEFAULT_PROPS}
                selectedQueryInfo={new QueryInfo({ schemaName: 'samples', isMedia: false })}
                parentQueryModel={model}
                selectedType={SampleCreationType.PooledSamples}
            />
        );
        await waitForLifecycle(wrapper);
        const options = validate(wrapper);
        expect(options.get(0).disabled).toBeTruthy();
        expect(options.get(0).disabledMsg).toBe('At most 20 samples can be selected for pooling');
        expect(options.get(0).href).toBeUndefined();
        expect(options.get(0).onClick).toBeUndefined();
        wrapper.unmount();
    });
});
