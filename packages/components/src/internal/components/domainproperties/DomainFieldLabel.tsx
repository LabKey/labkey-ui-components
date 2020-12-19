import React, { FC, ReactNode } from 'react';

import { LabelHelpTip } from '../../..';

import { getSplitSentence } from './actions';

export interface DomainFieldLabelProps {
    helpTipBody?: ReactNode;
    label: string;
    required?: boolean;
}

export const DomainFieldLabel: FC<DomainFieldLabelProps> = props => {
    return (
        <>
            {getSplitSentence(props.label, false)}
            <span className="domain-no-wrap">
                {getSplitSentence(props.label, true)}
                {props.helpTipBody && (
                    <LabelHelpTip title={props.label} required={props.required}>
                        {props.helpTipBody}
                    </LabelHelpTip>
                )}
                {props.required ? ' *' : ''}
            </span>
        </>
    );
};
