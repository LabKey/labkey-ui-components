import React, { FC, PropsWithChildren } from 'react';

export const Help: FC<PropsWithChildren> = ({ children }) => {
    if (!children) return null;
    return <small className="form-text text-muted">{children}</small>;
};
