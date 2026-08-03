/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, PropsWithChildren } from 'react';
import { createPortal } from 'react-dom';

import { FormButtons } from '../../FormButtons';
import { useModalFooter } from '../../ModalFooterContext';
import { useFormStepActive } from '../forms/FormStep';

interface Props extends PropsWithChildren {
    canCancel?: boolean;
    cancel: () => void;
    cancelText?: string;
    canFinish?: boolean;
    canNextStep?: boolean;
    canPreviousStep?: boolean;
    finish?: boolean;
    finishText?: string;
    formId?: string;
    isFinished?: boolean;
    isFinishedText?: string;
    isFinishing?: boolean;
    isFinishingText?: string;
    nextStep?: (evt: any) => void;
    previousStep?: (evt: any) => void;
    singularNoun?: string;
}

export const WizardNavButtons: FC<Props> = memo(props => {
    const {
        cancel,
        cancelText = 'Cancel',
        canCancel = true,
        canFinish = true,
        canNextStep = true,
        canPreviousStep = true,
        children,
        finish = false,
        finishText = 'Finish',
        formId,
        isFinished,
        isFinishedText = 'Finished',
        isFinishing,
        isFinishingText = 'Finishing...',
        nextStep,
        previousStep,
        singularNoun,
    } = props;
    const footerEl = useModalFooter();
    const stepActive = useFormStepActive();

    const formButtons = (
        <FormButtons sticky={!footerEl}>
            <button className="btn btn-default" disabled={!canCancel} onClick={cancel} type="button">
                {cancelText}
            </button>
            {previousStep !== undefined && (
                <button className="btn btn-default" disabled={!canPreviousStep} onClick={previousStep} type="button">
                    Back
                </button>
            )}
            {children}
            {finish && (
                <button
                    className="btn btn-success"
                    disabled={isFinishing || !canFinish}
                    form={formId}
                    onClick={nextStep}
                    type="submit"
                >
                    {isFinished ? isFinishedText : isFinishing ? isFinishingText : finishText}
                    {singularNoun ? ' ' + singularNoun : null}
                </button>
            )}
            {!finish && (
                <button
                    className="btn btn-default"
                    disabled={!canNextStep}
                    form={formId}
                    onClick={nextStep}
                    type="submit"
                >
                    Next
                </button>
            )}
        </FormButtons>
    );

    // When rendered inside a modal that provides a footer element (see ModalFooterContext), portal the buttons into
    // the actual footer so the footer stays a true sibling of the modal body rather than nested within it.
    // If used in combination with FormStep, only render the buttons for the active step. If not in a FormStep, then
    // stepActive will be true.
    if (footerEl) {
        if (!stepActive) return null;
        return createPortal(formButtons, footerEl);
    }

    return formButtons;
});
WizardNavButtons.displayName = 'WizardNavButtons';
