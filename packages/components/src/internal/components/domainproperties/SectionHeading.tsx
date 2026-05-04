import React, { FC, memo, ReactNode } from 'react';

import { LabelHelpTip } from '../base/LabelHelpTip';

interface Props {
    cls?: string;
    helpTipBody?: ReactNode;
    id?: string;
    title: string;
}

export const SectionHeading: FC<Props> = memo(props => (
    <div className={'domain-field-section-heading' + (props.cls ? ' ' + props.cls : '')} id={props.id}>
        {props.title}
        {props.helpTipBody && <LabelHelpTip title={props.title}>{props.helpTipBody}</LabelHelpTip>}
    </div>
));

SectionHeading.displayName = 'SectionHeading';
