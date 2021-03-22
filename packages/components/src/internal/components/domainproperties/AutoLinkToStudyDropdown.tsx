import React, { FC } from 'react';

import { FormControl } from 'react-bootstrap';
import { List } from 'immutable';

import { Container, LoadingSpinner } from '../../..';

interface Props {
    containers: List<Container>;
    onChange: (evt: any) => void;
    autoLinkTarget: string;
    value: string;
}

export const AutoLinkToStudyDropdown: FC<Props> = props => {
    return (
        <>
            {props.containers === undefined ? (
                <LoadingSpinner />
            ) : (
                <FormControl
                    componentClass="select"
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
                </FormControl>
            )}
        </>
    );
};
