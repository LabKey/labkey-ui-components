
import * as React from "react";
import renderer from 'react-test-renderer'
import {DomainField} from "../models";
import {DomainRow} from "./DomainRow";
import { mount } from "enzyme"
import {
    ATTACHMENT_RANGE_URI,
    DATETIME_RANGE_URI,
    DOUBLE_RANGE_URI,
    PARTICIPANTID_CONCEPT_URI,
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
        const field = new DomainField();
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
        const field = new DomainField({
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
        const field = new DomainField({
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
        const field = new DomainField({
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
        const field = new DomainField({
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
        const field = new DomainField({
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
    })
});