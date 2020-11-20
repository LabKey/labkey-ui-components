/*
 * Copyright (c) 2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, useCallback } from 'react';

import { SVGIcon } from './SVGIcon';

export interface ICardProps {
    caption?: string;
    disabled?: boolean;
    href?: string;
    iconSrc?: string;
    iconUrl?: string;
    onClick?: (index: number) => void;
    title: string;
}

type CardProps = ICardProps & {
    index: number;
};

const Card: FC<CardProps> = props => {
    const { caption, disabled, href, iconUrl, iconSrc, index, onClick, title } = props;

    const onClickHandler = useCallback(() => {
        onClick?.(index);
    }, [index, onClick]);

    return (
        <a className="cards__card" href={href} onClick={onClickHandler}>
            <div className={'cards__block-center' + (disabled ? ' cards__block-disabled' : '')}>
                <div className="cards__block-center-content">
                    {iconUrl && <img src={iconUrl} />}
                    {iconSrc && <SVGIcon iconDir="_images" iconSrc={iconSrc} />}
                </div>
            </div>
            <div className="cards__card-content">
                <div className="cards__card-title">{title}</div>
                {caption ? caption : ''}
            </div>
        </a>
    );
};

interface Props {
    cards: ICardProps[];
}

export const Cards: FC<Props> = props => (
    <div className="cards">
        <div className="row">
            {props.cards.map((cardProps, i) => (
                <div className="col-xs-6 col-md-4 col-lg-3" key={i}>
                    <Card {...cardProps} index={i} />
                </div>
            ))}
        </div>
    </div>
);
