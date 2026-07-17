/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, PropsWithChildren, ReactNode } from 'react';

import { FormButtons } from '../../FormButtons';

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

    let submitButton: ReactNode;

    if (finish) {
        submitButton = (
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
        );
    } else {
        submitButton = (
            <button className="btn btn-default" disabled={!canNextStep} form={formId} onClick={nextStep} type="submit">
                Next
            </button>
        );
    }

    return (
        <FormButtons>
            <button className="btn btn-default" disabled={!canCancel} onClick={cancel} type="button">
                {cancelText}
            </button>
            {previousStep !== undefined && (
                <button className="btn btn-default" disabled={!canPreviousStep} onClick={previousStep} type="button">
                    Back
                </button>
            )}
            {children}
            {submitButton}
        </FormButtons>
    );
});
WizardNavButtons.displayName = 'WizardNavButtons';
