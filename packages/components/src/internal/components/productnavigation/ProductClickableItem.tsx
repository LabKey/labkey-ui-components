import React, { FC, memo, useCallback, useState } from 'react';

interface ProductClickableItemProps {
    id: string;
    onClick: () => void;
}

export const ProductClickableItem: FC<ProductClickableItemProps> = memo(props => {
    const { id, onClick, children } = props;
    const [hovered, setHovered] = useState<boolean>(false);
    const toggleHover = useCallback((hover) => setHovered(hover), [setHovered]);

    return (
        <div
            key={id}
            className={'clickable-item' + (hovered ? ' labkey-page-nav' : '')}
            onClick={onClick}
            onMouseEnter={() => toggleHover(true)}
            onMouseLeave={() => toggleHover(false)}
        >
            {children}
        </div>
    );
});
