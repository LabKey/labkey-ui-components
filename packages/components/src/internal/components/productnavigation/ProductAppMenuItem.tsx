import React, { FC, memo, useCallback, useState } from 'react';
import classNames from 'classnames';

interface ProductAppMenuItemProps {
    disabled?: boolean;
    iconUrl: string;
    iconUrlAlt?: string;
    onClick: (productId: string) => void;
    productId: string;
    subtitle?: string;
    title: string;
}

export const ProductAppMenuItem: FC<ProductAppMenuItemProps> = memo(props => {
    const { iconUrl, iconUrlAlt, title, subtitle, onClick, disabled, productId } = props;
    const [hovered, setHovered] = useState<boolean>(false);
    const onEnter = useCallback(() => setHovered(true), [setHovered]);
    const onLeave = useCallback(() => setHovered(false), [setHovered]);
    const onClick_ = useCallback(
        event => {
            // stopImmediatePropagation in order to prevent the document click handler from closing the menu
            event.nativeEvent.stopImmediatePropagation();
            onClick(productId);
        },
        [onClick, productId]
    );

    return (
        <li
            className={classNames({ 'labkey-page-nav': hovered && !disabled, 'labkey-page-nav-disabled': disabled })}
            onClick={disabled ? undefined : onClick_}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
        >
            <div className="product-icon">
                <img src={iconUrl} alt="Product icon" className="icon-primary" height="40px" width="40px" />
                <img
                    src={iconUrlAlt ?? iconUrl}
                    alt="Alt Product icon"
                    className="icon-alt"
                    height="40px"
                    width="40px"
                />
            </div>
            {!disabled && (
                <div className="nav-icon">
                    <i className="fa fa-chevron-right" />
                </div>
            )}
            <div className={classNames('product-title', { 'no-subtitle': subtitle === undefined })}>{title}</div>
            <div className="product-subtitle">{subtitle}</div>
        </li>
    );
});
