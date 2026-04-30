import React, { FC } from 'react';

interface IconProps {
    iconClass: string;
    srText: string | undefined; // text for screen readers
}
export const Icon: FC<IconProps> = ({ iconClass, srText }) => {
    return (
        <>
            <span aria-hidden="true" className={iconClass} />
            {srText && <span className="sr-only">{srText}</span>}
        </>
    );
};
Icon.displayName = 'Icon';
