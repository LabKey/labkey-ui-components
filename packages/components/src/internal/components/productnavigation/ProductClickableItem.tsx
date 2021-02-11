import React, { FC, memo, useCallback, useState } from 'react';

interface ProductClickableItemProps {
    key: string;
    onClick: () => void;
}

export const ProductClickableItem: FC<ProductClickableItemProps> = memo(props => {
    const { key, onClick, children } = props;
    const [hovered, setHovered] = useState<boolean>(false);
    const toggleHover = useCallback(() => setHovered(!hovered), [hovered, setHovered]);

    return (
        <div
            key={key}
            className={'clickable-item' + (hovered ? ' labkey-page-nav' : '')}
            onClick={onClick}
            onMouseEnter={toggleHover}
            onMouseLeave={toggleHover}
        >
            {children}
        </div>
    );
});
