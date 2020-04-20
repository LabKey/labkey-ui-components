/*
 * Copyright (c) 2017-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { Button } from 'react-bootstrap';
import { Utils } from '@labkey/api';

interface Props {
    cancel: Function | string;
    cancelText?: string;
    canCancel?: boolean;
    canFinish?: boolean;
    canNextStep?: boolean;
    canPreviousStep?: boolean;
    containerClassName?: string;
    finish?: boolean;
    finishStyle?: string;
    finishText?: string;
    includeNext?: boolean;
    isFinished?: boolean;
    isFinishedText?: string;
    isFinishing?: boolean;
    isFinishingText?: string;
    nextStep?: (evt: any) => any;
    nextStyle?: string;
    previousStep?: (evt: any) => any;
    singularNoun?: string;
}

export class WizardNavButtons extends React.Component<Props, any> {
    static defaultProps = {
        cancelText: 'Cancel',
        canCancel: true,
        canFinish: true,
        canNextStep: true,
        canPreviousStep: true,
        containerClassName: 'col-sm-12',
        finishStyle: 'success',
        finishText: 'Finish',
        includeNext: true,
        isFinishedText: 'Finished',
        isFinishingText: 'Finishing...',
        nextStyle: 'default',
    };

    render() {
        const {
            cancel,
            cancelText,
            canCancel,
            canFinish,
            canNextStep,
            canPreviousStep,
            children,
            containerClassName,
            finish,
            finishStyle,
            finishText,
            includeNext,
            isFinished,
            isFinishedText,
            isFinishing,
            isFinishingText,
            nextStep,
            nextStyle,
            previousStep,
            singularNoun,
        } = this.props;

        const cancelProps: any = {
            disabled: !canCancel,
        };

        if (Utils.isFunction(cancel)) {
            cancelProps.onClick = cancel;
        } else if (Utils.isString(cancel)) {
            cancelProps.href = cancel;
        } else {
            throw 'You must supply either a function or string to allow user to cancel!';
        }

        return (
            <div className="form-group no-margin-bottom">
                <div className={containerClassName}>
                    <div className="pull-left">
                        <Button {...cancelProps}>{cancelText}</Button>
                    </div>
                    <div className="btn-group pull-right">
                        {previousStep !== undefined && (
                            <Button onClick={previousStep} disabled={!canPreviousStep}>
                                Back
                            </Button>
                        )}
                        {!finish && includeNext && (
                            <Button bsStyle={nextStyle} type="submit" onClick={nextStep} disabled={!canNextStep}>
                                Next
                            </Button>
                        )}
                        {children}
                        {finish && (
                            <Button
                                bsStyle={finishStyle}
                                disabled={isFinishing ? isFinishing : !canFinish}
                                onClick={nextStep}
                                type="submit"
                            >
                                {isFinished ? isFinishedText : isFinishing ? isFinishingText : finishText}
                                {singularNoun ? ' ' + singularNoun : null}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        );
    }
}
