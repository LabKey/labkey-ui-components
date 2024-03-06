import React, { FC, memo } from 'react';

interface Props {
    prop: string;
    title: string;
}

export const UserProperties: FC<Props> = memo(props => {
    const { prop, title } = props;

    return (
        <div className="row">
            <div className="col-xs-4 principal-detail-label">{title}</div>
            <div className="col-xs-8 principal-detail-value">{prop}</div>
        </div>
    );
});
