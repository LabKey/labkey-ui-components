/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SchemaQuery } from '../public/SchemaQuery';
import { EMPTY_COMPOUND_WARNING, EMPTY_NS_SEQUENCE_WARNING, EMPTY_PS_SEQUENCE_WARNING } from './constants';
import { SCHEMAS } from './schemas';
import { UnidentifiedPill } from './UnidentifiedPill';

describe('UnidentifiedPill', () => {
    test('renders with correct CSS classes', () => {
        const { container } = render(<UnidentifiedPill schemaQuery={SCHEMAS.DATA_CLASSES.PROTEIN_SEQUENCE} />);
        const pill = container.querySelector('.unidentified-sequence-pill');
        expect(pill).toBeInTheDocument();
        expect(pill).toHaveClass('status-pill', 'info');
    });

    test('always renders Unidentified text', () => {
        const { container } = render(<UnidentifiedPill schemaQuery={new SchemaQuery('other', 'Other')} />);
        expect(container.querySelector('.unidentified-sequence-pill')).toHaveTextContent('Unidentified');
    });

    describe('question mark icon', () => {
        test('renders for PROTEIN_SEQUENCE schema', () => {
            const { container } = render(<UnidentifiedPill schemaQuery={SCHEMAS.DATA_CLASSES.PROTEIN_SEQUENCE} />);
            expect(container.querySelector('.fa-question-circle')).toBeInTheDocument();
        });

        test('renders for NUC_SEQUENCE schema', () => {
            const { container } = render(<UnidentifiedPill schemaQuery={SCHEMAS.DATA_CLASSES.NUC_SEQUENCE} />);
            expect(container.querySelector('.fa-question-circle')).toBeInTheDocument();
        });

        test('renders for COMPOUND schema', () => {
            const { container } = render(<UnidentifiedPill schemaQuery={SCHEMAS.DATA_CLASSES.COMPOUND} />);
            expect(container.querySelector('.fa-question-circle')).toBeInTheDocument();
        });

        test('does not render for unrecognized schema', () => {
            const { container } = render(<UnidentifiedPill schemaQuery={new SchemaQuery('other', 'Other')} />);
            expect(container.querySelector('.fa-question-circle')).not.toBeInTheDocument();
        });
    });

    describe('popover on hover', () => {
        test('shows EMPTY_PS_SEQUENCE_WARNING for PROTEIN_SEQUENCE', async () => {
            const user = userEvent.setup();
            const { container } = render(<UnidentifiedPill schemaQuery={SCHEMAS.DATA_CLASSES.PROTEIN_SEQUENCE} />);
            await user.hover(container.querySelector('.unidentified-sequence-pill'));
            expect(screen.getByText(EMPTY_PS_SEQUENCE_WARNING)).toBeInTheDocument();
        });

        test('shows EMPTY_NS_SEQUENCE_WARNING for NUC_SEQUENCE', async () => {
            const user = userEvent.setup();
            const { container } = render(<UnidentifiedPill schemaQuery={SCHEMAS.DATA_CLASSES.NUC_SEQUENCE} />);
            await user.hover(container.querySelector('.unidentified-sequence-pill'));
            expect(screen.getByText(EMPTY_NS_SEQUENCE_WARNING)).toBeInTheDocument();
        });

        test('shows EMPTY_COMPOUND_WARNING for COMPOUND', async () => {
            const user = userEvent.setup();
            const { container } = render(<UnidentifiedPill schemaQuery={SCHEMAS.DATA_CLASSES.COMPOUND} />);
            await user.hover(container.querySelector('.unidentified-sequence-pill'));
            expect(screen.getByText(EMPTY_COMPOUND_WARNING)).toBeInTheDocument();
        });

        test('does not show popover for unrecognized schema', async () => {
            const user = userEvent.setup();
            const { container } = render(<UnidentifiedPill schemaQuery={new SchemaQuery('other', 'Other')} />);
            await user.hover(container.querySelector('.unidentified-sequence-pill'));
            expect(document.querySelector('.unidentified-sequence-popover')).not.toBeInTheDocument();
        });

        test('hides popover when mouse leaves', async () => {
            const user = userEvent.setup();
            const { container } = render(<UnidentifiedPill schemaQuery={SCHEMAS.DATA_CLASSES.PROTEIN_SEQUENCE} />);
            const pill = container.querySelector('.unidentified-sequence-pill');
            await user.hover(pill);
            expect(screen.getByText(EMPTY_PS_SEQUENCE_WARNING)).toBeInTheDocument();
            await user.unhover(pill);
            expect(screen.queryByText(EMPTY_PS_SEQUENCE_WARNING)).not.toBeInTheDocument();
        });
    });
});
