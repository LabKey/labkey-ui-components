import React, { FC, memo } from 'react';

import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { LabelHelpTip } from '../base/LabelHelpTip';

interface Props {
    extraInfo?: string;
    index: number;
    msg: string;
    name: string;
    severity: string;
}

export const DomainRowWarning: FC<Props> = memo(props => {
    const { extraInfo, severity, name, index, msg } = props;

    return (
        <>
            {extraInfo && (
                <LabelHelpTip
                    iconComponent={<FontAwesomeIcon icon={faExclamationCircle} className="domain-warning-icon" />}
                    title={severity}
                >
                    {extraInfo}
                </LabelHelpTip>
            )}
            {extraInfo && <span>&nbsp;</span>}
            <b key={name + '_' + index}>{msg}</b>
        </>
    );
});
