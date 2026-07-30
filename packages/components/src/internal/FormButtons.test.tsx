/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { render } from '@testing-library/react';

import { FormButtons } from './FormButtons';

describe('FormButtons', () => {
    function renderButtons(): React.ReactElement {
        return (
            <FormButtons>
                <button className="test-cancel" type="button">
                    Cancel
                </button>
                <button className="test-submit" type="submit">
                    Submit
                </button>
            </FormButtons>
        );
    }

    test('renders inline and sticky by default', () => {
        const { container } = render(renderButtons());
        const buttons = container.querySelector('.form-buttons');
        expect(buttons).not.toBeNull();
        expect(buttons).toHaveClass('form-buttons--sticky');
        expect(buttons.querySelector('.form-buttons__left .test-cancel')).not.toBeNull();
        expect(buttons.querySelector('.form-buttons__right .test-submit')).not.toBeNull();
    });

    test('respects sticky={false}', () => {
        const { container } = render(
            <FormButtons sticky={false}>
                <button type="submit">Submit</button>
            </FormButtons>
        );
        const buttons = container.querySelector('.form-buttons');
        expect(buttons).not.toBeNull();
        expect(buttons).not.toHaveClass('form-buttons--sticky');
    });
});
