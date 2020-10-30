import React from 'react';

import { LabelHelpTip } from '../../..';

import { getSplitSentence } from './actions';

interface Props {
    label: string;
    required?: boolean;
    helpTipBody?: () => any;
}

export function DomainFieldLabel(props: Props) {
    return (
        <>
            {getSplitSentence(props.label, false)}
            <span className="domain-no-wrap">
                {getSplitSentence(props.label, true)}
                {props.helpTipBody && (
                    <LabelHelpTip title={props.label} body={props.helpTipBody} required={props.required} />
                )}
                {props.required ? ' *' : ''}
            </span>
        </>
    );
}
