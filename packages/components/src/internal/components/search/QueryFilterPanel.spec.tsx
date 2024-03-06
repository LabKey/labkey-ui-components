import React from 'react';
import { NavItem } from 'react-bootstrap';
import { mount, ReactWrapper } from 'enzyme';
import { Filter } from '@labkey/api';

import { ExtendedMap } from '../../../public/ExtendedMap';

import { QueryInfo } from '../../../public/QueryInfo';
import { ChoicesListItem } from '../base/ChoicesListItem';
import sampleSetAllFieldTypesQueryInfo from '../../../test/data/sampleSetAllFieldTypes-getQueryDetails.json';

import { waitForLifecycle } from '../../test/enzymeTestHelpers';

import { getTestAPIWrapper } from '../../APIWrapper';

import { AssayResultDataType } from '../entities/constants';

import { QueryColumn } from '../../../public/QueryColumn';

import { QueryFilterPanel } from './QueryFilterPanel';
import { FieldFilter } from './models';

describe('QueryFilterPanel', () => {
    const DEFAULT_PROPS = {
        api: getTestAPIWrapper(jest.fn, {}),
        filters: {},
        queryInfo: QueryInfo.fromJsonForTests(sampleSetAllFieldTypesQueryInfo, true),
        onFilterUpdate: jest.fn,
    };

    function validate(
        wrapper: ReactWrapper,
        fieldItems: number,
        showFilterExpression = false,
        showChooseValues = false
    ): void {
        expect(wrapper.find('.filter-modal__col_fields').hostNodes()).toHaveLength(1);
        expect(wrapper.find('.filter-modal__col_filter_exp').hostNodes()).toHaveLength(1);
        expect(wrapper.find(ChoicesListItem)).toHaveLength(fieldItems);

        if (showFilterExpression) {
            expect(wrapper.find('li[role="presentation"]').at(0).prop('className')).toBe('active');
        }

        if (showChooseValues) {
            expect(wrapper.find('li[role="presentation"]').at(1).prop('className')).toBe('active');
        }
    }

    test('default props', () => {
        const wrapper = mount(<QueryFilterPanel {...DEFAULT_PROPS} />);
        validate(wrapper, 10);
        expect(wrapper.find('.filter-modal__container')).toHaveLength(0);
        wrapper.unmount();
    });

    test('skipDefaultViewCheck', async () => {
        const wrapper = mount(<QueryFilterPanel {...DEFAULT_PROPS} skipDefaultViewCheck />);
        await waitForLifecycle(wrapper);
        validate(wrapper, 28);
        wrapper.unmount();
    });

    test('asRow', () => {
        const wrapper = mount(<QueryFilterPanel {...DEFAULT_PROPS} asRow />);
        validate(wrapper, 10);
        expect(wrapper.find('.field-modal__container').hostNodes()).toHaveLength(1);
        wrapper.unmount();
    });

    test('no queryName emptyMsg', () => {
        const wrapper = mount(<QueryFilterPanel {...DEFAULT_PROPS} queryInfo={undefined} emptyMsg="Select a query" />);
        validate(wrapper, 0);
        expect(wrapper.find('.field-modal__empty-msg').hostNodes()).toHaveLength(1);
        expect(wrapper.find('.field-modal__empty-msg').hostNodes().text()).toBe('Select a query');
        wrapper.unmount();
    });

    test('fullWidth', async () => {
        const wrapper = mount(<QueryFilterPanel {...DEFAULT_PROPS} />);
        validate(wrapper, 10);
        expect(wrapper.find(Col)).toHaveLength(2);
        expect(wrapper.find(Col).first().prop('sm')).toBe(3);
        expect(wrapper.find(Col).last().prop('sm')).toBe(6);
        wrapper.setProps({ fullWidth: true });
        await waitForLifecycle(wrapper);
        expect(wrapper.find(Col).first().prop('sm')).toBe(4);
        expect(wrapper.find(Col).last().prop('sm')).toBe(8);
        wrapper.unmount();
    });

    test('viewName', () => {
        const wrapper = mount(<QueryFilterPanel {...DEFAULT_PROPS} viewName="testview" />);
        validate(wrapper, 2);
        wrapper.unmount();
    });

    test('validFilterField', () => {
        const wrapper = mount(
            <QueryFilterPanel {...DEFAULT_PROPS} validFilterField={(field, queryInfo) => field.jsonType === 'string'} />
        );
        validate(wrapper, 6);
        wrapper.unmount();
    });

    test('one field not filterable', () => {
        const props = { ...DEFAULT_PROPS };
        let queryInfo = props.queryInfo;
        let col: QueryColumn = queryInfo.getDisplayColumns().find(field => field.jsonType === 'string');
        col = col.mutate({ filterable: false });
        const columns = new ExtendedMap<string, QueryColumn>(queryInfo.columns);
        columns.set(col.fieldKey.toLowerCase(), col);
        queryInfo = queryInfo.mutate({ columns });
        props.queryInfo = queryInfo;
        const wrapper = mount(
            <QueryFilterPanel {...props} validFilterField={(field, queryInfo) => field.jsonType === 'string'} />
        );
        validate(wrapper, 5);
    });

    test('with text activeField', () => {
        const wrapper = mount(<QueryFilterPanel {...DEFAULT_PROPS} fieldKey="Text" />);
        validate(wrapper, 10, false, true);
        expect(wrapper.find('.list-group-item.active').text()).toBe('Text');
        expect(wrapper.find('.field-modal__col-sub-title').first().text()).toBe('Find values for Text');
        expect(wrapper.find('.field-modal__empty-msg').hostNodes()).toHaveLength(0);
        expect(wrapper.find('a[role="tab"]')).toHaveLength(2);
        expect(wrapper.find('.field-modal__field_dot')).toHaveLength(0);
        wrapper.unmount();
    });

    test('with non-text activeField', () => {
        const wrapper = mount(<QueryFilterPanel {...DEFAULT_PROPS} fieldKey="Integer" />);
        validate(wrapper, 10, true, false);
        expect(wrapper.find('.list-group-item.active').text()).toBe('Integer');
        expect(wrapper.find('.field-modal__col-sub-title').text()).toBe('Find values for Integer');
        expect(wrapper.find('.field-modal__empty-msg').hostNodes()).toHaveLength(0);
        expect(wrapper.find('a[role="tab"]')).toHaveLength(1);
        wrapper.unmount();
    });

    test('text activeField with non-equal filter', () => {
        const wrapper = mount(
            <QueryFilterPanel
                {...DEFAULT_PROPS}
                fieldKey="Text"
                filters={{
                    [DEFAULT_PROPS.queryInfo.name.toLowerCase()]: [
                        {
                            fieldKey: 'Text',
                            filter: Filter.create('Text', 'a', Filter.Types.GREATER_THAN),
                        } as FieldFilter,
                    ],
                }}
            />
        );
        validate(wrapper, 10, true, false);
        expect(wrapper.find('.list-group-item.active').text()).toBe('Text');
        expect(wrapper.find('.field-modal__col-sub-title').first().text()).toBe('Find values for Text');
        expect(wrapper.find('.field-modal__empty-msg').hostNodes()).toHaveLength(0);
        expect(wrapper.find('a[role="tab"]')).toHaveLength(2);
        expect(wrapper.find('.field-modal__field_dot')).toHaveLength(1);
        wrapper.unmount();
    });

    test('hasNoValueInQuery checkbox, not checked', () => {
        const hasNotInQueryFilterLabel = 'Sample Without assay data';
        const wrapper = mount(
            <QueryFilterPanel
                {...DEFAULT_PROPS}
                entityDataType={AssayResultDataType}
                emptyMsg="Select a query"
                hasNotInQueryFilterLabel={hasNotInQueryFilterLabel}
            />
        );
        validate(wrapper, 10);
        expect(wrapper.find('.filter-modal__fields-col-nodata-msg').hostNodes().text()).toBe(hasNotInQueryFilterLabel);
        expect(wrapper.find('.field-modal__col-content-disabled').hostNodes()).toHaveLength(0);

        wrapper.unmount();
    });

    test('hasNoValueInQuery checkbox, checked', () => {
        const wrapper = mount(
            <QueryFilterPanel
                {...DEFAULT_PROPS}
                entityDataType={AssayResultDataType}
                emptyMsg="Select a query"
                hasNotInQueryFilter={true}
            />
        );
        validate(wrapper, 10);
        expect(wrapper.find('.filter-modal__fields-col-nodata-msg').hostNodes().text()).toBe(
            'Without data from this type'
        );
        expect(wrapper.find('.field-modal__col-content-disabled').hostNodes()).toHaveLength(1);

        wrapper.unmount();
    });

    test('hasNoValueInQuery checkbox, checked, has active field and filters', () => {
        const wrapper = mount(
            <QueryFilterPanel
                {...DEFAULT_PROPS}
                entityDataType={AssayResultDataType}
                emptyMsg="Select a query"
                hasNotInQueryFilter={true}
                fieldKey="Text"
                filters={{
                    [DEFAULT_PROPS.queryInfo.name.toLowerCase()]: [
                        {
                            fieldKey: 'Text',
                            filter: Filter.create('Text', 'a', Filter.Types.GREATER_THAN),
                        } as FieldFilter,
                    ],
                }}
            />
        );
        expect(wrapper.find('.filter-modal__fields-col-nodata-msg').hostNodes().text()).toBe(
            'Without data from this type'
        );
        expect(wrapper.find('.field-modal__col-content-disabled').hostNodes()).toHaveLength(2);

        wrapper.unmount();
    });
});
