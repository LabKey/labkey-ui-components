import React, { FC, memo } from 'react';

import { LKS_PRODUCT_ID } from '../../app/constants';

interface ProductNavigationHeaderProps {
    title: string;
    productId: string;
    onClick: () => void;
}

export const ProductNavigationHeader: FC<ProductNavigationHeaderProps> = memo(props => {
    const { productId, title, onClick } = props;

    return (
        <>
            {productId && (
                <div className="back-icon" onClick={onClick}>
                    <i className="fa fa-chevron-left" />
                </div>
            )}
            {title ? title : productId === LKS_PRODUCT_ID ? 'LabKey Server' : 'Applications'}
        </>
    );
});
