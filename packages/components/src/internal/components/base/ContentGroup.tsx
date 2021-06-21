import React, { FC, ReactNode } from 'react';

interface Props {
    label?: ReactNode;
}

export const ContentGroupLabel: FC = ({ children }) => {
    return <div className="content-group-label">{children}</div>;
};

export const ContentGroup: FC<Props> = ({ children, label }) => {
    return (
        <div className="content-group">
            {label && <ContentGroupLabel>{label}</ContentGroupLabel>}
            {children}
        </div>
    );
};
