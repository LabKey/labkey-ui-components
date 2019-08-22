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
import {ATTACHMENT_TYPE, DATETIME_TYPE, DomainField, DomainFieldError, DOUBLE_TYPE, PARTICIPANT_TYPE, TEXT_TYPE} from "../models";
import {DomainRow} from "./DomainRow";
import { mount } from "enzyme"
import {
    ATTACHMENT_RANGE_URI,
    DOMAIN_FIELD_ADV,
    DOMAIN_FIELD_DELETE,
    DOMAIN_FIELD_EXPAND,
    DOMAIN_FIELD_NAME,
    DOMAIN_FIELD_REQUIRED,
    DOMAIN_FIELD_TYPE,
    PHILEVEL_RESTRICTED_PHI,
    DOMAIN_FIELD_DETAILS,
    SEVERITY_LEVEL_ERROR,
    SEVERITY_LEVEL_WARN,
    EXPAND_TRANSITION
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

};

describe('DomainRow', () => {

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
                    expandTransition={EXPAND_TRANSITION}
                    maxPhiLevel={PHILEVEL_RESTRICTED_PHI}
                />));

        expect(toJson(tree)).toMatchSnapshot();
        tree.unmount();
    });

    test('string field test', () => {
        const _index = 1;
        const _name = 'stringField';
        const _propDesc = TEXT_TYPE;

        const field = DomainField.create({
            name: _name,
            rangeURI: _propDesc.rangeURI,
            propertyId: 1,
            propertyURI: 'test'
        });

        const row = mount(
            wrapDraggable(
                <DomainRow
                    key={'domain-row-key-1'}
                    index={_index}
                    field={field}
                    onChange={jest.fn()}
                    onExpand={jest.fn()}
                    onDelete={jest.fn()}
                    expanded={false}
                    expandTransition={EXPAND_TRANSITION}
                    maxPhiLevel={PHILEVEL_RESTRICTED_PHI}
                />));

        const type = row.find({id: createFormInputId(DOMAIN_FIELD_TYPE, _index), bsClass: 'form-control'});
        expect(type.length).toEqual(1);
        expect(type.props().value).toEqual(_propDesc.name);

        const name = row.find({id: createFormInputId(DOMAIN_FIELD_NAME, _index), bsClass: 'form-control'});
        expect(name.length).toEqual(1);
        expect(name.props().value).toEqual(_name);

        const req = row.find({id: createFormInputId(DOMAIN_FIELD_REQUIRED, _index), bsClass: 'checkbox'});
        expect(req.length).toEqual(1);
        expect(req.props().checked).toEqual(false);

        expect(toJson(row)).toMatchSnapshot();
        row.unmount();
    });

    test('decimal field', () => {
        const _index = 2;
        const _name = 'decimalField';
        const _propDesc = DOUBLE_TYPE;

        const field = DomainField.create({
            name: _name,
            rangeURI: _propDesc.rangeURI,
            propertyId: 1,
            propertyURI: 'test',
            required: true
        });

        const row = mount(
            wrapDraggable(
                <DomainRow
                    key={'domain-row-key-1'}
                    index={_index}
                    field={field}
                    onChange={jest.fn()}
                    onExpand={jest.fn()}
                    onDelete={jest.fn()}
                    expanded={false}
                    expandTransition={EXPAND_TRANSITION}
                    maxPhiLevel={PHILEVEL_RESTRICTED_PHI}
                />));

        const type = row.find({id: createFormInputId(DOMAIN_FIELD_TYPE, _index), bsClass: 'form-control'});
        expect(type.length).toEqual(1);
        expect(type.props().value).toEqual(_propDesc.name);

        const name = row.find({id: createFormInputId(DOMAIN_FIELD_NAME, _index), bsClass: 'form-control'});
        expect(name.length).toEqual(1);
        expect(name.props().value).toEqual(_name);

        const req = row.find({id: createFormInputId(DOMAIN_FIELD_REQUIRED, _index), bsClass: 'checkbox'});
        expect(req.length).toEqual(1);
        expect(req.props().checked).toEqual(true);

        expect(toJson(row)).toMatchSnapshot();
        row.unmount();
    });

    test('date time field', () => {
        const _index = 0;
        const _name = 'dateTimeField';
        const _propDesc = DATETIME_TYPE;

        const field = DomainField.create({
            name: _name,
            rangeURI: _propDesc.rangeURI,
            propertyId: 1,
            propertyURI: 'test',
            required: false
        });

        const row = mount(
            wrapDraggable(
                <DomainRow
                    key={'domain-row-key-1'}
                    index={_index}
                    field={field}
                    onChange={jest.fn()}
                    onExpand={jest.fn()}
                    onDelete={jest.fn()}
                    expanded={false}
                    expandTransition={EXPAND_TRANSITION}
                    maxPhiLevel={PHILEVEL_RESTRICTED_PHI}
                />));

        const type = row.find({id: createFormInputId(DOMAIN_FIELD_TYPE, _index), bsClass: 'form-control'});
        expect(type.length).toEqual(1);
        expect(type.props().value).toEqual(_propDesc.name);

        const name = row.find({id: createFormInputId(DOMAIN_FIELD_NAME, _index), bsClass: 'form-control'});
        expect(name.length).toEqual(1);
        expect(name.props().value).toEqual(_name);

        const req = row.find({id: createFormInputId(DOMAIN_FIELD_REQUIRED, _index), bsClass: 'checkbox'});
        expect(req.length).toEqual(1);
        expect(req.props().checked).toEqual(false);

        expect(toJson(row)).toMatchSnapshot();
        row.unmount();
    });

    test('participant id field', () => {
        const _index = 0;
        const _name = 'participantField';
        const _propDesc = PARTICIPANT_TYPE;

        const field = DomainField.create({
            name: _name,
            rangeURI: _propDesc.rangeURI,
            conceptURI: _propDesc.conceptURI,
            propertyId: 1,
            propertyURI: 'test'
        });

        const row = mount(
            wrapDraggable(
                <DomainRow
                    key={'domain-row-key-1'}
                    index={_index}
                    field={field}
                    onChange={jest.fn()}
                    onExpand={jest.fn()}
                    onDelete={jest.fn()}
                    expanded={false}
                    expandTransition={EXPAND_TRANSITION}
                    maxPhiLevel={PHILEVEL_RESTRICTED_PHI}
                />));

        const type = row.find({id: createFormInputId(DOMAIN_FIELD_TYPE, _index), bsClass: 'form-control'});
        expect(type.length).toEqual(1);
        expect(type.props().value).toEqual(_propDesc.name);

        const name = row.find({id: createFormInputId(DOMAIN_FIELD_NAME, _index), bsClass: 'form-control'});
        expect(name.length).toEqual(1);
        expect(name.props().value).toEqual(_name);

        const req = row.find({id: createFormInputId(DOMAIN_FIELD_REQUIRED, _index), bsClass: 'checkbox'});
        expect(req.length).toEqual(1);
        expect(req.props().checked).toEqual(false);

        // Verify not expanded
        let expandButton = row.find({id: createFormInputId(DOMAIN_FIELD_EXPAND, _index)});
        expect(expandButton.length).toEqual(1);

        let deleteButton = row.find({id: createFormInputId(DOMAIN_FIELD_DELETE, _index)});
        expect(deleteButton.length).toEqual(0);

        let advButton = row.find({id: createFormInputId(DOMAIN_FIELD_ADV, _index)});
        expect(advButton.length).toEqual(0);

        let sectionLabel = row.find({className: 'domain-field-section-heading'});
        expect(sectionLabel.length).toEqual(1);

        expect(toJson(row)).toMatchSnapshot();
        row.unmount();
    });

    test('attachment field', () => {
        const _index = 0;
        const _name = 'attachmentField';
        const _propDesc = ATTACHMENT_TYPE;

        const field = DomainField.create({
            name: _name,
            rangeURI: _propDesc.rangeURI,
            propertyId: 1,
            propertyURI: 'test'
        });

        const row = mount(
            wrapDraggable(
                <DomainRow
                    key={'domain-row-key-1'}
                    index={_index}
                    field={field}
                    onChange={jest.fn()}
                    onExpand={jest.fn()}
                    onDelete={jest.fn()}
                    expanded={true}
                    expandTransition={EXPAND_TRANSITION}
                    maxPhiLevel={PHILEVEL_RESTRICTED_PHI}
                />));

        const type = row.find({id: createFormInputId(DOMAIN_FIELD_TYPE, _index), bsClass: 'form-control'});
        expect(type.length).toEqual(1);
        expect(type.props().value).toEqual(_propDesc.name);

        const name = row.find({id: createFormInputId(DOMAIN_FIELD_NAME, _index), bsClass: 'form-control'});
        expect(name.length).toEqual(1);
        expect(name.props().value).toEqual(_name);

        const req = row.find({id: createFormInputId(DOMAIN_FIELD_REQUIRED, _index), bsClass: 'checkbox'});
        expect(req.length).toEqual(1);
        expect(req.props().checked).toEqual(false);

        // Verify expanded
        let expandButton = row.find({id: createFormInputId(DOMAIN_FIELD_EXPAND, _index)});
        expect(expandButton.length).toEqual(1);

        let deleteButton = row.find({id: createFormInputId(DOMAIN_FIELD_DELETE, _index), bsStyle: 'danger'});
        expect(deleteButton.length).toEqual(1);

        let advButton = row.find({id: createFormInputId(DOMAIN_FIELD_ADV, _index), bsStyle: 'default'});
        expect(advButton.length).toEqual(1);

        let sectionLabel = row.find({className: 'domain-field-section-heading'});
        expect(sectionLabel.length).toEqual(1);

    });

    test('client side warning on field', () => {

        const message = "SQL queries, R scripts, and other code are easiest to write when field names only contain combination of letters, numbers, and underscores, and start with a letter or underscore.";
        const fieldName = '#ColumnAwesome';
        const severity = SEVERITY_LEVEL_WARN;
        const domainFieldError = new DomainFieldError({message, fieldName, propertyId: undefined, severity, index: 0});

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
                    expandTransition={EXPAND_TRANSITION}
                    maxPhiLevel={PHILEVEL_RESTRICTED_PHI}
                />));

        //test row highlighting for a warning
        const warningRowClass = row.find({className: 'domain-field-row-warning '});
        expect(warningRowClass.length).toEqual(1);

        //test warning message
        const rowDetails = row.find({id: createFormInputId(DOMAIN_FIELD_DETAILS, 1), className: 'domain-field-details'});
        expect(rowDetails.length).toEqual(1);
        const received = rowDetails.props().children[0] + rowDetails.props().children[1] + rowDetails.props().children[2].props.children;
        const expected = "New field. " + severity + ": " + message;
        expect(received).toEqual(expected);

        expect(toJson(row)).toMatchSnapshot();
        row.unmount();
    });

    test('server side error on reserved field', () => {

        const message = "'modified' is a reserved field name in 'CancerCuringStudy'";
        const fieldName = 'modified';
        const severity = SEVERITY_LEVEL_ERROR;
        const domainFieldError = new DomainFieldError({message, fieldName, propertyId: undefined, severity, index: 0});

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
                    expandTransition={EXPAND_TRANSITION}
                    maxPhiLevel={PHILEVEL_RESTRICTED_PHI}
                />));

        //test row highlighting for error
        const warningRowClass = row.find({className: 'domain-field-row-error '});
        expect(warningRowClass.length).toEqual(1);

        //test error message
        const rowDetails = row.find({id: createFormInputId(DOMAIN_FIELD_DETAILS, 1), className: 'domain-field-details'});
        expect(rowDetails.length).toEqual(1);
        const received = rowDetails.props().children[0] + rowDetails.props().children[1] + rowDetails.props().children[2].props.children;
        const expected = "New field. " + severity + ": " + message;
        expect(received).toEqual(expected);

        expect(toJson(row)).toMatchSnapshot();
        row.unmount();

    });

});