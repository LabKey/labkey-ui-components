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
import {DomainField} from "../models";
import {DomainRow} from "./DomainRow";
import { mount } from "enzyme"
import {
    ATTACHMENT_RANGE_URI,
    DATETIME_RANGE_URI,
    DOUBLE_RANGE_URI,
    PARTICIPANTID_CONCEPT_URI, PHILEVEL_RESTRICTED_PHI,
    STRING_RANGE_URI
} from "../constants";
import {DragDropContext, Droppable} from "react-beautiful-dnd";
import toJson from "enzyme-to-json";

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
                    maxPhiLevel={PHILEVEL_RESTRICTED_PHI}
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
                    maxPhiLevel={PHILEVEL_RESTRICTED_PHI}
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
                    maxPhiLevel={PHILEVEL_RESTRICTED_PHI}
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
                    maxPhiLevel={PHILEVEL_RESTRICTED_PHI}
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
                    maxPhiLevel={PHILEVEL_RESTRICTED_PHI}
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
                    maxPhiLevel={PHILEVEL_RESTRICTED_PHI}
                />));

        expect(toJson(tree)).toMatchSnapshot();
        tree.unmount();
    })
});