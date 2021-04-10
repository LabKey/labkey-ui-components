import React, { FC, memo, useCallback, useState } from 'react';

interface ProductClickableItemProps {
    id: string;
    onClick: () => void;
}

export const ProductClickableItem: FC<ProductClickableItemProps> = memo(props => {
    const { id, onClick, children } = props;
    const [hovered, setHovered] = useState<boolean>(false);
    const onEnter = useCallback(() => setHovered(true), [setHovered]);
    const onLeave = useCallback(() => setHovered(false), [setHovered]);

    return (
        <div
            key={id}
            className={'clickable-item' + (hovered ? ' labkey-page-nav' : '')}
            onClick={onClick}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
        >
            {children}
        </div>
    );
});
