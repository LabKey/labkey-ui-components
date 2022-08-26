import React, { FC, ReactNode } from 'react';

import { getSplitSentence } from './actions';
import {LabelHelpTip} from "../base/LabelHelpTip";

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
