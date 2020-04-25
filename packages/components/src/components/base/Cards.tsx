/*
 * Copyright (c) 2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';

import { SVGIcon } from './SVGIcon';

interface ICardProps {
    title: string;
    caption?: string;
    iconSrc?: string;
    iconUrl?: string;
    disabled?: boolean;
    href?: string;
    onClick?: (index: number) => any;
}

type CardProps = ICardProps & {
    index: number;
};

class Card extends React.Component<CardProps, any> {
    onClick = () => {
        const { index, onClick } = this.props;

        if (onClick) {
            onClick(index);
        }
    };

    render() {
        const { href, disabled, title, caption, iconUrl, iconSrc } = this.props;

        return (
            <a className="cards__card" href={href} onClick={this.onClick}>
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
    }
}

const CARDS_COLUMNS_CLASS = 'col-xs-6 col-md-4 col-lg-3';

interface Props {
    cards: ICardProps[];
}

export const Cards: React.SFC<Props> = props => (
    <div className="cards">
        <div className="row">
            {props.cards.map((cardProps, i) => (
                <div className={CARDS_COLUMNS_CLASS} key={i}>
                    <Card {...cardProps} index={i} />
                </div>
            ))}
        </div>
    </div>
);
