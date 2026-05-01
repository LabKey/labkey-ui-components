import React, { FC } from 'react';

interface IconProps {
    iconClass: string;
    srText: string; // text for screen readers
}
export const Icon: FC<IconProps> = ({ iconClass, srText }) => {
    return (
        <>
            <span aria-hidden="true" className={iconClass} />
            <span className="sr-only">{srText}</span>
        </>
    );
};
Icon.displayName = 'Icon';
