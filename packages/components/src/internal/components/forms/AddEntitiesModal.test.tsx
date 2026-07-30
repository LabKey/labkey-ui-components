/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC } from 'react';
import { render, renderHook, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Query } from '@labkey/api';

import { SchemaQuery } from '../../../public/SchemaQuery';
import { ModalRendererProps, registerModalRenderer } from '../../ModalRenderFactory';

import { AddEntitiesFooter, AddEntitiesModal, useIsAddEntitiesEnabled } from './AddEntitiesModal';

const RegisteredRenderer: FC<ModalRendererProps> = ({ schemaQuery }) => (
    <div className="registered-renderer">{schemaQuery.toString(false)}</div>
);

describe('AddEntitiesModal', () => {
    describe('useIsAddEntitiesEnabled', () => {
        test('returns false when schemaQuery is undefined', () => {
            const { result } = renderHook(() => useIsAddEntitiesEnabled(undefined));
            expect(result.current).toBe(false);
        });

        test('returns false when no modal renderer is registered', () => {
            const { result } = renderHook(() =>
                useIsAddEntitiesEnabled(new SchemaQuery('hook.unregistered', 'NoRenderer'))
            );
            expect(result.current).toBe(false);
        });

        test('returns true when a modal renderer is registered and no provider is rendered', () => {
            const sq = new SchemaQuery('hook.registered', 'HasRenderer');
            registerModalRenderer(sq, RegisteredRenderer);

            const { result } = renderHook(() => useIsAddEntitiesEnabled(sq));
            expect(result.current).toBe(true);
        });

        test('returns false for a registered renderer rendered within an AddEntitiesModal', () => {
            const sq = new SchemaQuery('hook.nested', 'NestedRenderer');
            const NestedRenderer: FC<ModalRendererProps> = ({ schemaQuery }) => {
                const enabled = useIsAddEntitiesEnabled(schemaQuery);
                return <div className="nested-enabled">{String(enabled)}</div>;
            };
            registerModalRenderer(sq, NestedRenderer);

            render(
                <AddEntitiesModal
                    containerFilter={Query.ContainerFilter.current}
                    containerPath="/home"
                    onCancel={jest.fn()}
                    onComplete={jest.fn()}
                    schemaQuery={sq}
                />
            );

            expect(document.querySelector('.nested-enabled')).toHaveTextContent('false');
        });
    });

    describe('AddEntitiesFooter', () => {
        test('renders and invokes onClick', async () => {
            const onClick = jest.fn();
            render(<AddEntitiesFooter onClick={onClick} />);

            const footer = document.querySelector('.add-entities-footer');
            expect(footer).toHaveTextContent('Add New');
            expect(footer.querySelector('.fa-plus-circle')).not.toBeNull();

            await userEvent.click(footer);
            expect(onClick).toHaveBeenCalledTimes(1);
        });

        test('reflects keyboard focus via the "focused" prop', () => {
            const { rerender } = render(<AddEntitiesFooter onClick={jest.fn()} />);
            expect(document.querySelector('.add-entities-footer')).not.toHaveClass('is-focused');

            rerender(<AddEntitiesFooter focused onClick={jest.fn()} />);
            expect(document.querySelector('.add-entities-footer')).toHaveClass('is-focused');
        });
    });

    describe('component', () => {
        test('renders a fallback modal when no renderer is registered', async () => {
            const onCancel = jest.fn();
            render(
                <AddEntitiesModal
                    containerFilter={Query.ContainerFilter.current}
                    containerPath="/home"
                    onCancel={onCancel}
                    onComplete={jest.fn()}
                    schemaQuery={new SchemaQuery('modal.unregistered', 'MissingQuery')}
                />
            );

            expect(document.querySelector('.modal-title')).toHaveTextContent('Add New Entities');
            expect(screen.getByText(/not registered for/)).toHaveTextContent('modal.unregistered.MissingQuery');

            await userEvent.click(document.querySelector('button.close'));
            expect(onCancel).toHaveBeenCalledTimes(1);
        });

        test('renders the registered renderer with all props passed through', () => {
            const sq = new SchemaQuery('modal.registered', 'PassThrough');
            const onCancel = jest.fn();
            const onComplete = jest.fn();
            const PropCapture = jest.fn().mockReturnValue(null);
            registerModalRenderer(sq, PropCapture);

            render(
                <AddEntitiesModal
                    containerFilter={Query.ContainerFilter.currentAndSubfolders}
                    containerPath="/project/folder"
                    onCancel={onCancel}
                    onComplete={onComplete}
                    schemaQuery={sq}
                />
            );

            expect(PropCapture).toHaveBeenCalledTimes(1);
            expect(PropCapture.mock.calls[0][0]).toEqual({
                containerFilter: Query.ContainerFilter.currentAndSubfolders,
                containerPath: '/project/folder',
                onCancel,
                onComplete,
                schemaQuery: sq,
            });
        });

        test('does not render the fallback modal when a renderer is registered', () => {
            const sq = new SchemaQuery('modal.rendered', 'RendersRenderer');
            registerModalRenderer(sq, RegisteredRenderer);

            render(
                <AddEntitiesModal
                    containerFilter={Query.ContainerFilter.current}
                    containerPath="/home"
                    onCancel={jest.fn()}
                    onComplete={jest.fn()}
                    schemaQuery={sq}
                />
            );

            expect(document.querySelector('.registered-renderer')).toHaveTextContent(sq.toString(false));
            expect(document.querySelector('.modal-title')).toBeNull();
        });
    });
});
