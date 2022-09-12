import React, { FC, memo } from 'react';
import { Col } from 'react-bootstrap';

import { RemovableButton } from '../permissions/RemovableButton';

import { Member } from './models';

interface Props {
    members: Member[];
    onClick: (userId: number) => void;
    onRemove: (memberId: number) => void;
    selectedPrincipalId: number;
    title: string;
}

export const MemberButtons: FC<Props> = memo(props => {
    const { title, members, onClick, onRemove, selectedPrincipalId } = props;

    return (
        <Col xs={12} sm={6}>
            <div>{title}:</div>
            <ul className="permissions-groups-members-ul">
                {members.length > 0 ? (
                    members.map(member => (
                        <li key={member.id} className="permissions-groups-member-li">
                            <RemovableButton
                                id={member.id}
                                display={member.name}
                                onClick={onClick}
                                onRemove={onRemove}
                                bsStyle={selectedPrincipalId === member.id ? 'primary' : undefined}
                                added={false}
                            />
                        </li>
                    ))
                ) : (
                    <li className="permissions-groups-member-li permissions-groups-member-none">None</li>
                )}
            </ul>
        </Col>
    );
});
