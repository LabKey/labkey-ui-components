import React, { FC } from 'react';

import { Container } from '../base/models/Container';
import { LoadingSpinner } from '../base/LoadingSpinner';

interface Props {
    autoLinkTarget: string;
    containers: Container[];
    onChange: (evt: any) => void;
    value: string;
}

export const AutoLinkToStudyDropdown: FC<Props> = props => {
    return (
        <>
            {props.containers === undefined ? (
                <LoadingSpinner />
            ) : (
                <select
                    className="form-control"
                    id={props.autoLinkTarget}
                    onChange={props.onChange}
                    value={props.value || ''}
                >
                    <option key="_empty" value={null} />
                    {props.containers.map(container => (
                        <option key={container.id} value={container.id}>
                            {container.path}
                        </option>
                    ))}
                </select>
            )}
        </>
    );
};
