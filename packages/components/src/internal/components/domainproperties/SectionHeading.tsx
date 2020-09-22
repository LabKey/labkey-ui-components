import React from 'react';

import { LabelHelpTip } from '../../../index';

interface Props {
    title: string;
    cls?: string;
    helpTipBody?: () => any;
}

export function SectionHeading(props: Props) {
    return (
        <div className={'domain-field-section-heading' + (props.cls ? ' ' + props.cls : '')}>
            {props.title}

            {props.helpTipBody && <LabelHelpTip title={props.title} body={props.helpTipBody} />}
        </div>
    );
}
