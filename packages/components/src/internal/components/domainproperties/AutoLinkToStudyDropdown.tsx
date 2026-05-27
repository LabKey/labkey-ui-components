import React, { FC, memo } from 'react';

import { Container } from '../base/models/Container';
import { LoadingSpinner } from '../base/LoadingSpinner';

interface Props {
    ariaLabelledBy: string;
    autoLinkTarget: string;
    containers: Container[];
    onChange: (evt: any) => void;
    value: string;
}

export const AutoLinkToStudyDropdown: FC<Props> = memo(({ ariaLabelledBy, autoLinkTarget, containers, onChange, value }) => {
    if (containers === undefined) return <LoadingSpinner />;
    return (
            <select
                aria-labelledby={ariaLabelledBy}
                className="form-control"
                id={autoLinkTarget}
                onChange={onChange}
                value={value || ''}
            >
            <option value={null} />
            {containers.map(container => (
                <option key={container.id} value={container.id}>
                    {container.path}
                </option>
            ))}
        </select>
    );
});
AutoLinkToStudyDropdown.displayName = 'AutoLinkToStudyDropdown';
