import React from 'react';
import { fromJS } from 'immutable';
import renderer from 'react-test-renderer';

import { DefaultRenderer } from './DefaultRenderer';
import { QueryColumn } from '../../public/QueryColumn';
import { shallow } from 'enzyme';

describe('DefaultRenderer', () => {
    test('undefined', () => {
        const component = <DefaultRenderer data={undefined} />;
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('string', () => {
        const component = <DefaultRenderer data="test string" />;
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('boolean', () => {
        const component = <DefaultRenderer data={true} />;
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    // TODO MultiValueRenderer
    // test('list', () => {
    //     const component = <DefaultRenderer data={List.of(...)} />;
    //     const tree = renderer.create(component).toJSON();
    //     expect(tree).toMatchSnapshot();
    // });

    test('value', () => {
        const component = <DefaultRenderer data={fromJS({ value: 1 })} />;
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('displayValue', () => {
        const component = <DefaultRenderer data={fromJS({ value: 1, displayValue: 'Value 1' })} />;
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('formattedValue', () => {
        const component = (
            <DefaultRenderer data={fromJS({ value: 1, displayValue: 'Value 1', formattedValue: 'Value 1.00' })} />
        );
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('url', () => {
        const component = <DefaultRenderer data={fromJS({ value: 1, displayValue: 'Value 1', url: 'labkey.com' })} />;
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('new line', () => {
        const component = <DefaultRenderer data={'test1\ntest2'} />;
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('unavailable', () => {
        const component = (
            <DefaultRenderer
                data={fromJS({ value: 1 })}
                col={
                    new QueryColumn({
                        caption: 'Special Column',
                        conceptURI: null,
                        defaultValue: null,
                        fieldKey: 'special_column',
                        fieldKeyArray: ['special_column'],
                        hidden: false,
                        inputType: 'text',
                        isKeyField: false,
                        jsonType: 'string',
                        lookup: {
                            displayColumn: 'Name',
                            isPublic: true,
                            keyColumn: 'Name',
                            queryName: 'Samples',
                            schemaName: 'samples',
                        },
                    })
                }
            />
        );
        const wrapper = shallow(component);
        expect(wrapper.text()).toBe('unavailable');
    });

    test('lookup available with displayValue', () => {
        const component = (
            <DefaultRenderer
                data={fromJS({ value: 1, displayValue: "one" })}
                col={
                    new QueryColumn({
                        caption: 'Special Column',
                        conceptURI: null,
                        defaultValue: null,
                        fieldKey: 'special_column',
                        fieldKeyArray: ['special_column'],
                        hidden: false,
                        inputType: 'text',
                        isKeyField: false,
                        jsonType: 'string',
                        lookup: {
                            displayColumn: 'Name',
                            isPublic: true,
                            keyColumn: 'Name',
                            queryName: 'Samples',
                            schemaName: 'samples',
                        },
                    })
                }
            />
        );
        const wrapper = shallow(component);
        expect(wrapper.text()).toBe('one');
    });

    test('lookup available with url', () => {
        const component = (
            <DefaultRenderer
                data={fromJS({ value: 1, url: "http://look.up" })}
                col={
                    new QueryColumn({
                        caption: 'Special Column',
                        conceptURI: null,
                        defaultValue: null,
                        fieldKey: 'special_column',
                        fieldKeyArray: ['special_column'],
                        hidden: false,
                        inputType: 'text',
                        isKeyField: false,
                        jsonType: 'string',
                        lookup: {
                            displayColumn: 'Name',
                            isPublic: true,
                            keyColumn: 'Name',
                            queryName: 'Samples',
                            schemaName: 'samples',
                        },
                    })
                }
            />
        );
        const wrapper = shallow(component);
        expect(wrapper.text()).toBe('1');
    });

    test('lookup with null value', () => {
        const component = (
            <DefaultRenderer
                data={fromJS({ value: null, url: 'http://look.up' })}
                col={
                    new QueryColumn({
                        caption: 'Special Column',
                        conceptURI: null,
                        defaultValue: null,
                        fieldKey: 'special_column',
                        fieldKeyArray: ['special_column'],
                        hidden: false,
                        inputType: 'text',
                        isKeyField: false,
                        jsonType: 'string',
                        lookup: {
                            displayColumn: 'Name',
                            isPublic: true,
                            keyColumn: 'Name',
                            queryName: 'Samples',
                            schemaName: 'samples',
                        },
                    })
                }
            />
        );
        const wrapper = shallow(component);
        expect(wrapper.text()).toBe('');
    });
});
