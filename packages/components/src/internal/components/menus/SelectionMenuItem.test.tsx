/*
 * Copyright (c) 2025-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';

import { SelectionMenuItem } from './SelectionMenuItem';

describe('SelectionMenuItem', () => {
    test('without selections', () => {
        const text = 'Menu Item Text';
        const model = makeTestQueryModel(new SchemaQuery('schema', 'query')).mutate({
            rowCount: 3,
            selections: new Set(),
        });

        render(<SelectionMenuItem nounPlural="items" onClick={jest.fn()} queryModel={model} text={text} />);

        const menuItem = screen.getByRole('presentation');
        expect(menuItem).toHaveTextContent(text);
        expect(menuItem).toHaveClass('disabled');
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

        const menuItem = screen.getByRole('presentation');
        expect(menuItem).toHaveTextContent(text);
        expect(menuItem).toHaveClass('disabled');
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
