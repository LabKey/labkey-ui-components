import React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import { List } from 'immutable';

import { Query } from '@labkey/api';

import { QueryColumn, QueryLookup } from '../../../public/QueryColumn';
import { TextChoiceInput } from '../forms/input/TextChoiceInput';
import { QuerySelect } from '../forms/QuerySelect';

import { ValueDescriptor } from './models';

import { LookupCell, LookupCellProps } from './LookupCell';

describe('LookupCell', () => {
    function defaultProps(): LookupCellProps {
        return {
            col: new QueryColumn({
                lookup: new QueryLookup({
                    schemaName: 'schema',
                    queryName: 'query',
                    displayColumn: 'display',
                    keyColumn: 'key',
                }),
            }),
            colIdx: 0,
            forUpdate: false,
            modifyCell: jest.fn(),
            row: undefined,
            rowIdx: 0,
            select: jest.fn(),
            values: List.of({ raw: 'a' } as ValueDescriptor, { raw: 'b' } as ValueDescriptor, {} as ValueDescriptor),
        };
    }

    function validate(wrapper: ReactWrapper, asTextChoice = false): void {
        expect(wrapper.find(TextChoiceInput)).toHaveLength(asTextChoice ? 1 : 0);
        expect(wrapper.find(QuerySelect)).toHaveLength(!asTextChoice ? 1 : 0);
    }

    test('QuerySelect default props', () => {
        const wrapper = mount(<LookupCell {...defaultProps()} />);
        validate(wrapper);
        expect(wrapper.find(QuerySelect).prop('value')).toBe('a');
        expect(wrapper.find(QuerySelect).prop('disabled')).toBeFalsy();
        expect(wrapper.find(QuerySelect).prop('queryFilters').toArray()).toHaveLength(0);
        wrapper.unmount();
    });

    test('QuerySelect all samples lookup', () => {
        const wrapper = mount(
            <LookupCell
                {...defaultProps()}
                col={
                    new QueryColumn({
                        lookup: new QueryLookup({
                            schemaName: 'exp',
                            queryName: 'materials',
                            displayColumn: 'display',
                            keyColumn: 'key',
                        }),
                    })
                }
            />
        );
        validate(wrapper);
        expect(wrapper.find(QuerySelect).prop('value')).toBe('a');
        expect(wrapper.find(QuerySelect).prop('disabled')).toBeFalsy();
        expect(wrapper.find(QuerySelect).prop('queryFilters').toArray()).toHaveLength(1);
        wrapper.unmount();
    });

    test('QuerySelect disabled', () => {
        const wrapper = mount(<LookupCell {...defaultProps()} disabled />);
        validate(wrapper);
        expect(wrapper.find(QuerySelect).prop('disabled')).toBeTruthy();
        wrapper.unmount();
    });

    test('QuerySelect multi value', () => {
        const wrapper = mount(
            <LookupCell
                {...defaultProps()}
                col={
                    new QueryColumn({
                        lookup: new QueryLookup({ schemaName: 'schema', queryName: 'query', multiValued: 'junction' }),
                    })
                }
            />
        );
        validate(wrapper);
        expect(wrapper.find(QuerySelect).prop('value')).toStrictEqual(['a', 'b']);
        wrapper.unmount();
    });

    test('QuerySelect filteredLookupKeys', () => {
        const wrapper = mount(<LookupCell {...defaultProps()} filteredLookupKeys={List.of(1, 2)} />);
        validate(wrapper);
        const filters = wrapper.find(QuerySelect).prop('queryFilters');
        expect(filters.size).toBe(1);
        expect(filters.get(0).getURLParameterName()).toBe('query.key~in');
        expect(filters.get(0).getValue()).toStrictEqual([1, 2]);
        wrapper.unmount();
    });

    test('QuerySelect filteredLookupValues', () => {
        const wrapper = mount(<LookupCell {...defaultProps()} filteredLookupValues={List.of('a', 'b')} />);
        validate(wrapper);
        const filters = wrapper.find(QuerySelect).prop('queryFilters');
        expect(filters.size).toBe(1);
        expect(filters.get(0).getURLParameterName()).toBe('query.display~in');
        expect(filters.get(0).getValue()).toStrictEqual(['a', 'b']);
        wrapper.unmount();
    });

    test('QuerySelect default container filter without projects', () => {
        const wrapper = mount(<LookupCell {...defaultProps()} />);
        const containerFilter = wrapper.find(QuerySelect).prop('containerFilter');
        expect(containerFilter).toBe(undefined);
    });

    test('QuerySelect lookup with container filter', () => {
        const wrapper = mount(
            <LookupCell
                {...defaultProps()}
                col={
                    new QueryColumn({
                        lookup: new QueryLookup({
                            schemaName: 'schema',
                            queryName: 'query',
                            displayColumn: 'display',
                            keyColumn: 'key',
                            containerFilter: Query.ContainerFilter.current,
                        }),
                    })
                }
                containerFilter={Query.ContainerFilter.allFolders}
            />
        );
        const containerFilter = wrapper.find(QuerySelect).prop('containerFilter');
        expect(containerFilter).toBe(Query.ContainerFilter.current);
    });

    test('QuerySelect container filter prop', () => {
        const wrapper = mount(<LookupCell {...defaultProps()} containerFilter={Query.ContainerFilter.current} />);
        const containerFilter = wrapper.find(QuerySelect).prop('containerFilter');
        expect(containerFilter).toBe(Query.ContainerFilter.current);
    });

    test('QuerySelect default container filter with projects', () => {
        LABKEY.moduleContext.query = {
            isProductProjectsEnabled: true,
        };
        const wrapper = mount(<LookupCell {...defaultProps()} />);
        const containerFilter = wrapper.find(QuerySelect).prop('containerFilter');
        expect(containerFilter).toBe(Query.ContainerFilter.currentPlusProjectAndShared);
    });

    test('col with validValues', () => {
        const wrapper = mount(
            <LookupCell
                {...defaultProps()}
                col={
                    new QueryColumn({
                        validValues: ['a', 'b'],
                    })
                }
            />
        );
        validate(wrapper, true);
        expect(wrapper.find(TextChoiceInput).prop('value')).toBe('a');
        expect(wrapper.find(TextChoiceInput).prop('disabled')).toBeFalsy();
        wrapper.unmount();
    });
});
