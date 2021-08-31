import React from 'react';
import { List, Map } from 'immutable';
import { mount, ReactWrapper } from 'enzyme';

import { SelectInput } from '../forms/input/SelectInput';

import { RemoveEntityButton } from '../buttons/RemoveEntityButton';

import { AddEntityButton } from '../buttons/AddEntityButton';

import {
    EntityParentTypeAddEntityButton,
    EntityParentTypeSelectors,
    getAddEntityButtonTitle,
    getUpdatedEntityParentType,
} from './EntityParentTypeSelectors';
import { EntityDataType, EntityParentType, IParentOption } from './models';
import { DataClassDataType, SampleTypeDataType } from './constants';

const DATA_TYPES = List.of(SampleTypeDataType, {
    ...DataClassDataType,
    nounAsParentSingular: 'Source',
} as EntityDataType);
const EMPTY_PARENTS_MAP = DATA_TYPES.reduce((map, type) => {
    map = map.set(type.typeListingSchemaQuery.queryName, List());
    return map;
}, Map<string, List<EntityParentType>>());
const WITH_PARENTS_MAP = DATA_TYPES.reduce((map, type) => {
    map = map.set(
        type.typeListingSchemaQuery.queryName,
        List.of(
            EntityParentType.create({ schema: 'a', query: 'test1', index: 1 }),
            EntityParentType.create({ schema: 'a', query: 'test2', index: 2 })
        )
    );
    return map;
}, Map<string, List<EntityParentType>>());
const EMPTY_OPTIONS_MAP = DATA_TYPES.reduce((map, type) => {
    map = map.set(type.typeListingSchemaQuery.queryName, List());
    return map;
}, Map<string, List<IParentOption>>());

describe('EntityParentTypeSelectors', () => {
    const DEFAULT_PROPS = {
        parentDataTypes: List<EntityDataType>(),
        parentOptionsMap: Map<string, List<IParentOption>>(),
        entityParentsMap: Map<string, List<EntityParentType>>(),
        combineParentTypes: false,
        onAdd: jest.fn,
        onChange: jest.fn,
        onRemove: jest.fn,
    };

    function validate(wrapper: ReactWrapper, inputCount = 0, addBtnCount = 0): void {
        expect(wrapper.find(SelectInput)).toHaveLength(inputCount);
        expect(wrapper.find(RemoveEntityButton)).toHaveLength(inputCount);
        expect(wrapper.find(EntityParentTypeAddEntityButton)).toHaveLength(addBtnCount);
    }

    test('default props', () => {
        const wrapper = mount(<EntityParentTypeSelectors {...DEFAULT_PROPS} />);
        validate(wrapper);
        wrapper.unmount();
    });

    test('parentDataTypes but no existing parents', () => {
        const wrapper = mount(
            <EntityParentTypeSelectors
                {...DEFAULT_PROPS}
                parentDataTypes={DATA_TYPES}
                parentOptionsMap={EMPTY_OPTIONS_MAP}
                entityParentsMap={EMPTY_PARENTS_MAP}
            />
        );
        validate(wrapper, 0, 2);
        wrapper.unmount();
    });

    test('combineParentTypes but no existing parents', () => {
        const wrapper = mount(
            <EntityParentTypeSelectors
                {...DEFAULT_PROPS}
                parentDataTypes={DATA_TYPES}
                parentOptionsMap={EMPTY_OPTIONS_MAP}
                entityParentsMap={EMPTY_PARENTS_MAP}
                combineParentTypes
            />
        );
        validate(wrapper, 0, 1);
        wrapper.unmount();
    });

    test('parentDataTypes with existing parents', () => {
        const wrapper = mount(
            <EntityParentTypeSelectors
                {...DEFAULT_PROPS}
                parentDataTypes={DATA_TYPES}
                parentOptionsMap={EMPTY_OPTIONS_MAP}
                entityParentsMap={WITH_PARENTS_MAP}
            />
        );
        validate(wrapper, 4, 2);

        expect(wrapper.find(SelectInput).first().prop('label')).toBe('Parent 1 Type');
        expect(wrapper.find(SelectInput).last().prop('label')).toBe('Source 2 Type');
        expect(wrapper.find(RemoveEntityButton).first().prop('entity')).toBe('Parent');
        expect(wrapper.find(RemoveEntityButton).last().prop('entity')).toBe('Source');

        wrapper.unmount();
    });

    test('combineParentTypes with existing parents', () => {
        const wrapper = mount(
            <EntityParentTypeSelectors
                {...DEFAULT_PROPS}
                parentDataTypes={DATA_TYPES}
                parentOptionsMap={EMPTY_OPTIONS_MAP}
                entityParentsMap={WITH_PARENTS_MAP}
                combineParentTypes
            />
        );
        validate(wrapper, 4, 1);

        expect(wrapper.find(SelectInput).first().prop('label')).toBe('Parent 1 Type');
        expect(wrapper.find(SelectInput).last().prop('label')).toBe('Parent 4 Type');
        expect(wrapper.find(RemoveEntityButton).first().prop('entity')).toBe('Parent');
        expect(wrapper.find(RemoveEntityButton).last().prop('entity')).toBe('Parent');

        wrapper.unmount();
    });
});

describe('EntityParentTypeAddEntityButton', () => {
    const DEFAULT_PROPS = {
        entityDataType: DATA_TYPES.first(),
        parentOptions: List<IParentOption>(),
        entityParents: List<EntityParentType>(),
        combineParentTypes: false,
        onAdd: jest.fn,
    };

    const PARENT_OPTIONS = List.of({ schema: 'a', query: 'test1' }, { schema: 'a', query: 'test2' });

    function validate(wrapper: ReactWrapper, disabled = false, title?: string): void {
        expect(wrapper.find(AddEntityButton)).toHaveLength(1);
        const button = wrapper.find(AddEntityButton);
        expect(button.prop('entity')).toBe('Parent');
        expect(button.prop('title')).toBe(title);
        expect(button.prop('disabled')).toBe(disabled);
    }

    test('no options', () => {
        const wrapper = mount(<EntityParentTypeAddEntityButton {...DEFAULT_PROPS} />);
        validate(wrapper, true, '0 parent sample types available.');
        wrapper.unmount();
    });

    test('with options', () => {
        const wrapper = mount(<EntityParentTypeAddEntityButton {...DEFAULT_PROPS} parentOptions={PARENT_OPTIONS} />);
        validate(wrapper);
        wrapper.unmount();
    });

    test('with options and matching parents', () => {
        const wrapper = mount(
            <EntityParentTypeAddEntityButton
                {...DEFAULT_PROPS}
                parentOptions={PARENT_OPTIONS}
                entityParents={WITH_PARENTS_MAP.get('SampleSets')}
            />
        );
        validate(wrapper, true, 'Only 2 parent sample types available.');
        wrapper.unmount();
    });
});

describe('getAddEntityButtonTitle', () => {
    test('not disabled', () => {
        expect(getAddEntityButtonTitle(false, 0, SampleTypeDataType)).toBe(undefined);
        expect(getAddEntityButtonTitle(false, 1, SampleTypeDataType)).toBe(undefined);
        expect(getAddEntityButtonTitle(false, 2, SampleTypeDataType)).toBe(undefined);
    });

    test('disabled', () => {
        expect(getAddEntityButtonTitle(true, 0, SampleTypeDataType)).toBe('0 parent sample types available.');
        expect(getAddEntityButtonTitle(true, 1, SampleTypeDataType)).toBe('Only 1 parent sample type available.');
        expect(getAddEntityButtonTitle(true, 2, SampleTypeDataType)).toBe('Only 2 parent sample types available.');
        expect(getAddEntityButtonTitle(true, 1, DataClassDataType)).toBe('Only 1 parent type available.');
        expect(getAddEntityButtonTitle(true, 2, DataClassDataType)).toBe('Only 2 parent types available.');
    });
});

describe('getUpdatedEntityParentType', () => {
    test('removing a selected parent option', () => {
        const { updatedEntityParents, column, existingParent, parentColumnName } = getUpdatedEntityParentType(
            WITH_PARENTS_MAP,
            2,
            'DataClasses',
            'LSID',
            undefined
        );

        expect(parentColumnName).toBe('MaterialInputs/Test2');
        expect(column).toBe(undefined);
        expect(existingParent).toBe(undefined);
        expect(updatedEntityParents.size).toBe(2);
        expect(updatedEntityParents.get('DataClasses').size).toBe(2);
        expect(updatedEntityParents.get('DataClasses').get(1).query).toBe(undefined);
    });

    test('replacing a selected parent option', () => {
        const { updatedEntityParents, column, existingParent, parentColumnName } = getUpdatedEntityParentType(
            WITH_PARENTS_MAP,
            2,
            'DataClasses',
            'LSID',
            { schema: 'a', query: 'test1' }
        );

        expect(parentColumnName).toBe(undefined);
        expect(column.fieldKey).toBe('MaterialInputs/Test1');
        expect(existingParent.query).toBe('test2');
        expect(updatedEntityParents.size).toBe(2);
        expect(updatedEntityParents.get('DataClasses').size).toBe(2);
        expect(updatedEntityParents.get('DataClasses').get(1).query).toBe('test1');
    });

    test('re-selecting parent option', () => {
        const { updatedEntityParents, column, existingParent, parentColumnName } = getUpdatedEntityParentType(
            WITH_PARENTS_MAP,
            2,
            'DataClasses',
            'LSID',
            { schema: 'a', query: 'test2' }
        );

        expect(parentColumnName).toBe(undefined);
        expect(column).toBe(undefined);
        expect(existingParent.query).toBe('test2');
        expect(updatedEntityParents).toBe(undefined);
    });
});
