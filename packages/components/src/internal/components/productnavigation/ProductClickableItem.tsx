import React, { FC, memo, PropsWithChildren, useCallback, useState } from 'react';

interface ProductClickableItemProps extends PropsWithChildren {
    id: string;
    href: string;
    onClick: () => void;
}

export const ProductClickableItem: FC<ProductClickableItemProps> = memo(props => {
    const { id, onClick, children, href } = props;
    const [hovered, setHovered] = useState<boolean>(false);
    const onEnter = useCallback(() => setHovered(true), [setHovered]);
    const onLeave = useCallback(() => setHovered(false), [setHovered]);

    return (
        <a
            href={href}
            key={id}
            className={'clickable-item' + (hovered ? ' labkey-page-nav' : '')}
            onClick={onClick}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
        >
            {children}
        </a>
    );
});
