/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as React from "react";
import {DomainField, DomainFieldError} from "../models";
import {DomainRow} from "./DomainRow";
import { mount } from "enzyme"
import {
    ATTACHMENT_RANGE_URI,
    DATETIME_RANGE_URI, DOMAIN_FIELD_DETAILS,
    DOUBLE_RANGE_URI,
    PARTICIPANTID_CONCEPT_URI, SEVERITY_LEVEL_ERROR, SEVERITY_LEVEL_WARN,
    STRING_RANGE_URI
} from "../constants";
import {DragDropContext, Droppable} from "react-beautiful-dnd";
import toJson from "enzyme-to-json";
import {createFormInputId} from "../actions/actions";

const wrapDraggable = (element) => {
    return (
        <DragDropContext onDragEnd={jest.fn()}>
            <Droppable droppableId='domain-form-droppable'>
                {(provided) => (
                    <div ref={provided.innerRef}
                        {...provided.droppableProps}
                    >
                        {element}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </DragDropContext>
    )

}

describe('DomainRowDisplay', () => {

    test('with empty domain form', () => {
        const field = DomainField.create({});
        const tree = mount(
            wrapDraggable(
                <DomainRow
                    key={'domain-row-key-1'}
                    index={1}
                    field={field}
                    onChange={jest.fn()}
                    onExpand={jest.fn()}
                    onDelete={jest.fn()}
                    expanded={false}
                />));

        expect(toJson(tree)).toMatchSnapshot();
        tree.unmount();
    });

    test('string field', () => {
        const field = DomainField.create({
            name: 'key',
            rangeURI: STRING_RANGE_URI,
            propertyId: 1,
            propertyURI: 'test'
        });

        const tree = mount(
            wrapDraggable(
                <DomainRow
                    key={'domain-row-key-1'}
                    index={1}
                    field={field}
                    onChange={jest.fn()}
                    onExpand={jest.fn()}
                    onDelete={jest.fn()}
                    expanded={false}
                />));

        expect(toJson(tree)).toMatchSnapshot();
        tree.unmount();
    });

    test('decimal field', () => {
        const field = DomainField.create({
            name: 'key',
            rangeURI: DOUBLE_RANGE_URI,
            propertyId: 1,
            propertyURI: 'test'
        });

        const tree = mount(
            wrapDraggable(
                <DomainRow
                    key={'domain-row-key-1'}
                    index={1}
                    field={field}
                    onChange={jest.fn()}
                    onExpand={jest.fn()}
                    onDelete={jest.fn()}
                    expanded={false}
                />));

        expect(toJson(tree)).toMatchSnapshot();
        tree.unmount();
    });

    test('date time field', () => {
        const field = DomainField.create({
            name: 'key',
            rangeURI: DATETIME_RANGE_URI,
            propertyId: 1,
            propertyURI: 'test'
        });

        const tree = mount(
            wrapDraggable(
                <DomainRow
                    key={'domain-row-key-1'}
                    index={1}
                    field={field}
                    onChange={jest.fn()}
                    onExpand={jest.fn()}
                    onDelete={jest.fn()}
                    expanded={false}
                />));

        expect(toJson(tree)).toMatchSnapshot();
        tree.unmount();
    });

    test('participant id field', () => {
        const field = DomainField.create({
            name: 'key',
            rangeURI: STRING_RANGE_URI,
            conceptURI: PARTICIPANTID_CONCEPT_URI,
            propertyId: 1,
            propertyURI: 'test'
        });

        const tree = mount(
            wrapDraggable(
                <DomainRow
                    key={'domain-row-key-1'}
                    index={1}
                    field={field}
                    onChange={jest.fn()}
                    onExpand={jest.fn()}
                    onDelete={jest.fn()}
                    expanded={false}
                />));

        expect(toJson(tree)).toMatchSnapshot();
        tree.unmount();
    });

    test('attachment field', () => {
        const field = DomainField.create({
            name: 'key',
            rangeURI: ATTACHMENT_RANGE_URI,
            propertyId: 1,
            propertyURI: 'test'
        });

        const tree = mount(
            wrapDraggable(
                <DomainRow
                    key={'domain-row-key-1'}
                    index={1}
                    field={field}
                    onChange={jest.fn()}
                    onExpand={jest.fn()}
                    onDelete={jest.fn()}
                    expanded={false}
                />));

        expect(toJson(tree)).toMatchSnapshot();
        tree.unmount();
    });

    test('client side warning on field', () => {

        let message = "SQL queries, R scripts, and other code are easiest to write when field names only contain combination of letters, numbers, and underscores, and start with a letter or underscore.";
        let fieldName = '#ColumnAwesome';
        let severity = SEVERITY_LEVEL_WARN;
        let domainFieldError = new DomainFieldError({message, fieldName, propertyId: undefined, severity, index: 0});

        const field = DomainField.create({
            name: fieldName,
            rangeURI: ATTACHMENT_RANGE_URI,
            propertyId: undefined, //new field
            propertyURI: 'test'
        });

        const row = mount(
            wrapDraggable(
                <DomainRow
                    key={'domain-row-key-1'}
                    index={1}
                    field={field}
                    fieldError={domainFieldError}
                    onChange={jest.fn()}
                    onExpand={jest.fn()}
                    onDelete={jest.fn()}
                    expanded={false}
                />));

        //test row highlighting for a warning
        const warningRowClass = row.find({className: 'domain-field-row-warning '});
        expect(warningRowClass.length).toEqual(1);

        //test warning message
        let rowDetails = row.find({id: createFormInputId(DOMAIN_FIELD_DETAILS, 1), className: 'domain-field-details'});
        expect(rowDetails.length).toEqual(1);
        let received = rowDetails.props().children[0] + rowDetails.props().children[1];
        let expected = "New field, " + message;
        expect(received).toEqual(expected);

        expect(toJson(row)).toMatchSnapshot();
        row.unmount();
    });

    test('server side error on reserved field', () => {

        let message = "'modified' is a reserved field name in 'CancerCuringStudy'";
        let fieldName = 'modified';
        let severity = SEVERITY_LEVEL_ERROR;
        let domainFieldError = new DomainFieldError({message, fieldName, propertyId: undefined, severity, index: 0});

        const field = DomainField.create({
            name: fieldName,
            rangeURI: ATTACHMENT_RANGE_URI,
            propertyId: undefined, //new field
            propertyURI: 'test'
        });

        const row = mount(
            wrapDraggable(
                <DomainRow
                    key={'domain-row-key-1'}
                    index={1}
                    field={field}
                    fieldError={domainFieldError}
                    onChange={jest.fn()}
                    onExpand={jest.fn()}
                    onDelete={jest.fn()}
                    expanded={false}
                />));

        //test row highlighting for error
        const warningRowClass = row.find({className: 'domain-field-row-error '});
        expect(warningRowClass.length).toEqual(1);

        //test error message
        let rowDetails = row.find({id: createFormInputId(DOMAIN_FIELD_DETAILS, 1), className: 'domain-field-details'});
        expect(rowDetails.length).toEqual(1);
        let received = rowDetails.props().children[0] + rowDetails.props().children[1];
        let expected = "New field, " + message;
        expect(received).toEqual(expected);

        expect(toJson(row)).toMatchSnapshot();
        row.unmount();

    });

});