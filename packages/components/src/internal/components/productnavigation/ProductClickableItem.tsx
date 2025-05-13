import React, { FC, memo, PropsWithChildren, useCallback, useState } from 'react';

interface ProductClickableItemProps extends PropsWithChildren {
    href: string;
    id: string;
    onClick: () => void;
}

export const ProductClickableItem: FC<ProductClickableItemProps> = memo(props => {
    const { id, onClick, children, href } = props;
    const [hovered, setHovered] = useState<boolean>(false);
    const onEnter = useCallback(() => setHovered(true), [setHovered]);
    const onLeave = useCallback(() => setHovered(false), [setHovered]);

    // TODO: Need to use AppLinkHere, however we'd need to add several props
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
ProductClickableItem.displayName = 'ProductClickableItem';
