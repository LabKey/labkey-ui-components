/*
 * Copyright (c) 2025-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { LoadingState } from '../../../public/LoadingState';
import { SchemaQuery } from '../../../public/SchemaQuery';

import { SelectionMenuItem } from './SelectionMenuItem';

const getDisabledMessage = (): string => {
    const menuItem = screen.getByRole('presentation');
    expect(menuItem).toHaveClass('disabled');
    fireEvent.mouseEnter(menuItem);
    return document.querySelector('.popover-content').textContent;
};

describe('SelectionMenuItem', () => {
    test('without selections', () => {
        const text = 'Menu Item Text';
        const model = makeTestQueryModel(new SchemaQuery('schema', 'query')).mutate({
            rowCount: 3,
            selections: new Set(),
        });

        render(<SelectionMenuItem nounPlural="items" onClick={jest.fn()} queryModel={model} text={text} />);

        expect(screen.getByRole('presentation')).toHaveTextContent(text);
        expect(getDisabledMessage()).toBe('Select one or more items.');
    });

    test('while selections load', () => {
        const model = makeTestQueryModel(new SchemaQuery('schema', 'query')).mutate({
            rowCount: 3,
            selections: undefined,
            selectionsLoadingState: LoadingState.LOADING,
        });

        render(<SelectionMenuItem nounPlural="items" onClick={jest.fn()} queryModel={model} text="Menu Item Text" />);

        expect(getDisabledMessage()).toBe('Loading selections...');
    });

    test('disabled reason reaches keyboard and screen reader users', () => {
        const model = makeTestQueryModel(new SchemaQuery('schema', 'query')).mutate({
            rowCount: 3,
            selections: new Set(),
        });

        render(<SelectionMenuItem nounPlural="items" onClick={jest.fn()} queryModel={model} text="Menu Item Text" />);

        const menuItem = screen.getByRole('menuitem');
        expect(menuItem).toHaveAccessibleDescription('Select one or more items.');

        fireEvent.focus(menuItem);
        expect(document.querySelector('.popover-content')).toHaveTextContent('Select one or more items.');

        fireEvent.blur(menuItem);
        expect(document.querySelector('.popover-content')).toBeNull();
    });

    test('when selections were never requested', () => {
        const onClick = jest.fn();
        const model = makeTestQueryModel(new SchemaQuery('schema', 'query')).mutate({
            rowCount: 3,
            selections: undefined,
            selectionsLoadingState: LoadingState.INITIALIZED,
        });

        render(<SelectionMenuItem nounPlural="items" onClick={onClick} queryModel={model} text="Menu Item Text" />);

        expect(screen.getByRole('presentation')).not.toHaveClass('disabled');
        fireEvent.click(screen.getByRole('menuitem'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    test('when selections failed to load', () => {
        const model = makeTestQueryModel(new SchemaQuery('schema', 'query')).mutate({
            rowCount: 3,
            selections: undefined,
            selectionsError: 'Failed to load selections',
            selectionsLoadingState: LoadingState.LOADED,
        });

        render(<SelectionMenuItem nounPlural="items" onClick={jest.fn()} queryModel={model} text="Menu Item Text" />);

        expect(getDisabledMessage()).toBe('Select one or more items.');
    });

    test('with selections', () => {
        const text = 'Menu Item Text';
        const model = makeTestQueryModel(new SchemaQuery('schema', 'query')).mutate({
            rowCount: 3,
            selections: new Set(['1', '2']),
        });

        render(<SelectionMenuItem nounPlural="items" onClick={jest.fn()} queryModel={model} text={text} />);

        const menuItem = screen.getByRole('presentation');
        expect(menuItem).toHaveTextContent(text);
        expect(menuItem).not.toHaveClass('disabled');
    });

    test('with maxSelection but not too many', () => {
        const text = 'Menu Item Text';
        const model = makeTestQueryModel(new SchemaQuery('schema', 'query')).mutate({
            rowCount: 5,
            selections: new Set(['1', '2', '3']),
        });

        render(
            <SelectionMenuItem maxSelection={4} nounPlural="items" onClick={jest.fn()} queryModel={model} text={text} />
        );

        const menuItem = screen.getByRole('presentation');
        expect(menuItem).toHaveTextContent(text);
        expect(menuItem).not.toHaveClass('disabled');
    });

    test('with maxSelection too many', () => {
        const text = 'Menu Item Text';
        const model = makeTestQueryModel(new SchemaQuery('schema', 'query')).mutate({
            rowCount: 5,
            selections: new Set(['1', '2', '3']),
        });

        render(
            <SelectionMenuItem maxSelection={2} nounPlural="items" onClick={jest.fn()} queryModel={model} text={text} />
        );

        expect(screen.getByRole('presentation')).toHaveTextContent(text);
        expect(getDisabledMessage()).toBe('At most 2 items can be selected.');
    });

    test('with href', () => {
        const text = 'Menu Item Text';
        const model = makeTestQueryModel(new SchemaQuery('schema', 'query')).mutate({
            rowCount: 5,
            selections: new Set(['1', '2', '3']),
        });
        const href = 'http://my.href.test';

        render(<SelectionMenuItem href={href} maxSelection={2} nounPlural="items" queryModel={model} text={text} />);

        const menuItem = screen.getByRole('menuitem');
        expect(menuItem).toHaveTextContent(text);
        expect(menuItem).toHaveAttribute('href', '#');
    });
});
