/*
 * Copyright (c) 2017-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo } from 'react';

import { FormButtons } from '../../FormButtons';

interface Props {
    cancel: () => void;
    cancelText?: string;
    canCancel?: boolean;
    canFinish?: boolean;
    canNextStep?: boolean;
    canPreviousStep?: boolean;
    finish?: boolean;
    finishText?: string;
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
        isFinished,
        isFinishedText = 'Finished',
        isFinishing,
        isFinishingText = 'Finishing...',
        nextStep,
        previousStep,
        singularNoun,
    } = props;

    let submitButton;

    if (finish) {
        submitButton = (
            <button className="btn btn-success" disabled={isFinishing || !canFinish} onClick={nextStep} type="submit">
                {isFinished ? isFinishedText : isFinishing ? isFinishingText : finishText}
                {singularNoun ? ' ' + singularNoun : null}
            </button>
        );
    } else {
        submitButton = (
            <button className="btn btn-default" type="submit" onClick={nextStep} disabled={!canNextStep}>
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
                <button className="btn btn-default" onClick={previousStep} disabled={!canPreviousStep} type="button">
                    Back
                </button>
            )}
            {children}
            {submitButton}
        </FormButtons>
    );
});
WizardNavButtons.displayName = 'WizardNavButtons';
