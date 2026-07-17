/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, useCallback } from 'react';
import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { Modal } from './Modal';
import { WizardNavButtons } from './components/buttons/WizardNavButtons';
import { FormStep, withFormSteps, WithFormStepsProps } from './components/forms/FormStep';
import { Formsy } from './components/forms/formsy';

const FORM_ID = 'mini-wizard-form';

interface MiniWizardOwnProps {
    onCancel: () => void;
    onFinish: () => void;
    onValidSubmit: jest.Mock;
}

type MiniWizardProps = MiniWizardOwnProps & WithFormStepsProps;

const MiniWizardImpl: FC<MiniWizardProps> = ({ nextStep, onCancel, onFinish, onValidSubmit, previousStep }) => {
    const handleValidSubmit = useCallback(
        (model: unknown): void => {
            onValidSubmit(model);
            nextStep();
        },
        [nextStep, onValidSubmit]
    );

    return (
        <>
            <FormStep stepIndex={1}>
                <Formsy id={FORM_ID} onValidSubmit={handleValidSubmit}>
                    <WizardNavButtons cancel={onCancel} formId={FORM_ID} />
                </Formsy>
            </FormStep>
            <FormStep stepIndex={2}>
                <WizardNavButtons cancel={onCancel} finish nextStep={onFinish} previousStep={previousStep} />
            </FormStep>
        </>
    );
};
MiniWizardImpl.displayName = 'MiniWizard';

const MiniWizard = withFormSteps(MiniWizardImpl);

describe('ModalFooterSlot', () => {
    function footerButtons(): HTMLButtonElement[] {
        return Array.from(document.querySelectorAll('.modal-footer--slot .form-buttons button'));
    }

    test('active wizard step buttons render in the modal footer and navigate steps', async () => {
        const onCancel = jest.fn();
        const onFinish = jest.fn();
        const onValidSubmit = jest.fn();

        render(
            <Modal footerSlot onCancel={onCancel} title="Mini Wizard">
                <MiniWizard onCancel={onCancel} onFinish={onFinish} onValidSubmit={onValidSubmit} />
            </Modal>
        );

        // Step 1: buttons are in the footer slot, not in the modal body, and not sticky
        expect(document.querySelectorAll('.modal-footer--slot .form-buttons')).toHaveLength(1);
        expect(document.querySelector('.modal-body .form-buttons')).toBeNull();
        expect(document.querySelector('.form-buttons--sticky')).toBeNull();
        let buttons = footerButtons();
        expect(buttons.map(b => b.textContent)).toEqual(['Cancel', 'Next']);
        expect(buttons[1]).toHaveAttribute('form', FORM_ID);

        // The submit button lives outside the form's DOM, but the form attribute associates it; clicking it
        // must submit the Formsy form (validating the form-attribute path through Formsy's submit guard)
        await userEvent.click(buttons[1]);
        expect(onValidSubmit).toHaveBeenCalledTimes(1);

        // Step 2: the footer now shows only the confirmation step's buttons
        expect(document.querySelectorAll('.modal-footer--slot .form-buttons')).toHaveLength(1);
        buttons = footerButtons();
        expect(buttons.map(b => b.textContent)).toEqual(['Cancel', 'Back', 'Finish']);

        await userEvent.click(buttons[2]);
        expect(onFinish).toHaveBeenCalledTimes(1);

        // Back returns to step 1's buttons
        await userEvent.click(buttons[1]);
        buttons = footerButtons();
        expect(buttons.map(b => b.textContent)).toEqual(['Cancel', 'Next']);
    });
});
