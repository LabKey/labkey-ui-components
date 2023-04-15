import React from 'react';
import { List } from 'immutable';
import { mount, ReactWrapper } from 'enzyme';

import { QueryColumn } from '../public/QueryColumn';
import { QueryInfo } from '../public/QueryInfo';
import { Alert } from '../internal/components/base/Alert';

import { EntityInsertGridRequiredFieldAlert, getFieldKeysOfRequiredCols } from './EntityInsertGridRequiredFieldAlert';

const DEFAULT_PROPS = {
    type: 'Sample Type',
    queryInfo: undefined,
};

describe('EntityInsertGridRequiredFieldAlert', () => {
    function validate(wrapper: ReactWrapper, isLoading = true, hasMissing = false): void {
        expect(wrapper.find(Alert)).toHaveLength(isLoading || !hasMissing ? 0 : 1);
    }

    test('without queryInfo', () => {
        const wrapper = mount(<EntityInsertGridRequiredFieldAlert {...DEFAULT_PROPS} />);
        validate(wrapper);
        wrapper.unmount();
    });

    test('queryInfo isLoading', () => {
        const wrapper = mount(
            <EntityInsertGridRequiredFieldAlert {...DEFAULT_PROPS} queryInfo={QueryInfo.create({ isLoading: true })} />
        );
        validate(wrapper);
        wrapper.unmount();
    });

    test('without missing required cols', () => {
        const wrapper = mount(
            <EntityInsertGridRequiredFieldAlert
                {...DEFAULT_PROPS}
                queryInfo={QueryInfo.fromJSON({
                    columns: [
                        {
                            fieldKey: 'a',
                            fieldKeyArray: ['a'],
                            caption: 'FieldA',
                            shownInInsertView: true,
                            shownInUpdateView: true,
                            userEditable: true,
                            required: true,
                            inputType: 'text',
                        },
                    ],
                })}
            />
        );
        validate(wrapper, false);
        wrapper.unmount();
    });

    test('with missing required cols', () => {
        const wrapper = mount(
            <EntityInsertGridRequiredFieldAlert
                {...DEFAULT_PROPS}
                queryInfo={QueryInfo.fromJSON({
                    columns: [
                        {
                            fieldKey: 'a',
                            fieldKeyArray: ['a'],
                            caption: 'FieldA',
                            shownInInsertView: false,
                            shownInUpdateView: true,
                            userEditable: true,
                            required: true,
                            inputType: 'text',
                        },
                    ],
                })}
            />
        );
        validate(wrapper, false, true);
        const alertText = wrapper.find(Alert).text();
        expect(alertText).toContain('the selected Sample Type has required fields');
        expect(alertText).toContain(': FieldA');
        wrapper.unmount();
    });
});

describe('getFieldKeysOfRequiredCols', () => {
    test('editable and required', () => {
        expect(
            getFieldKeysOfRequiredCols(
                List.of(
                    new QueryColumn({
                        fieldKey: 'col1',
                        fieldKeyArray: ['col1'],
                        readOnly: false,
                        userEditable: true,
                        shownInUpdateView: true,
                        required: true,
                    })
                )
            ).length
        ).toBe(1);

        expect(
            getFieldKeysOfRequiredCols(
                List.of(
                    new QueryColumn({
                        fieldKey: 'col1',
                        fieldKeyArray: ['col1'],
                        readOnly: false,
                        userEditable: true,
                        shownInUpdateView: true,
                        required: true,
                    })
                )
            )[0]
        ).toBe('col1');
    });

    test('editable and not required', () => {
        expect(
            getFieldKeysOfRequiredCols(
                List.of(
                    new QueryColumn({
                        fieldKey: 'col1',
                        fieldKeyArray: ['col1'],
                        readOnly: false,
                        userEditable: true,
                        shownInUpdateView: true,
                        required: false,
                    })
                )
            ).length
        ).toBe(0);
    });

    test('not editable and required', () => {
        expect(
            getFieldKeysOfRequiredCols(
                List.of(
                    new QueryColumn({
                        fieldKey: 'col1',
                        fieldKeyArray: ['col1'],
                        readOnly: false,
                        userEditable: false,
                        shownInUpdateView: true,
                        required: true,
                    })
                )
            ).length
        ).toBe(0);
    });

    test('not editable and not required', () => {
        expect(
            getFieldKeysOfRequiredCols(
                List.of(
                    new QueryColumn({
                        fieldKey: 'col1',
                        fieldKeyArray: ['col1'],
                        readOnly: false,
                        userEditable: false,
                        shownInUpdateView: true,
                        required: false,
                    })
                )
            ).length
        ).toBe(0);
    });

    test('editable, required lookup field', () => {
        expect(
            getFieldKeysOfRequiredCols(
                List.of(
                    new QueryColumn({
                        fieldKey: 'lookup/col1',
                        fieldKeyArray: ['lookup', 'col1'],
                        readOnly: false,
                        userEditable: true,
                        shownInUpdateView: true,
                        required: true,
                    })
                )
            ).length
        ).toBe(0);
    });
});
