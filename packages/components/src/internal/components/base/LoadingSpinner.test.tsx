/*
 * Copyright (c) 2023-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

import { LoadingSpinner } from './LoadingSpinner';

describe('LoadingSpinner', () => {
    test('render without properties', () => {
        render(<LoadingSpinner />);
        expect(screen.getByText('Loading...')).toBeInTheDocument();
        expect(document.querySelectorAll('.fa-spinner')).toHaveLength(1);
    });

    test('render with text message', () => {
        render(<LoadingSpinner msg="my message here" />);
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        expect(screen.getByText('my message here')).toBeInTheDocument();
        expect(document.querySelectorAll('.fa-spinner')).toHaveLength(1);
    });

    test('render with react node message', () => {
        const messageNode = <div className="special-class">A div message</div>;
        render(<LoadingSpinner msg={messageNode} />);
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        expect(screen.getByText('A div message')).toBeInTheDocument();
        expect(document.querySelectorAll('.fa-spinner')).toHaveLength(1);
    });
});
