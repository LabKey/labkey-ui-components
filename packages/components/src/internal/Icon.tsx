import React, { forwardRef } from 'react';

interface IconProps {
    iconClass: string;
    srText: string; // text for screen readers
}
export const Icon = forwardRef<HTMLSpanElement, IconProps>(({ iconClass, srText }, ref) => {
    return (
        <span ref={ref}>
            <span aria-hidden="true" className={iconClass} />
            <span className="sr-only">{srText}</span>
        </span>
    );
});
Icon.displayName = 'Icon';
