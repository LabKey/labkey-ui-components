/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'
import {Utils} from '@labkey/api'

import { imageURL } from "../url/ActionURL";

export enum Theme {
    DEFAULT,
    GRAY,
    LIGHT,
    ORANGE
}

export function iconURL(iconDir: string, prefix: string, theme?: Theme): string {

    if (!prefix || !Utils.isString(prefix)) {
        prefix = 'default';
    }

    if (!(theme in Theme)) {
        theme = Theme.DEFAULT;
    }

    const suffix = theme === Theme.DEFAULT ? '' : '_' + Theme[theme].toLowerCase();

    return imageURL(iconDir, [prefix, suffix, '.svg'].join('').toLowerCase());
}

function imgProps(props: Props): React.ImgHTMLAttributes<HTMLImageElement> {
    let imgProps = Object.assign({}, props);
    delete imgProps.activeTheme;
    delete imgProps.iconSrc;
    delete imgProps.isActive;
    delete imgProps.isInverted;
    delete imgProps.theme;
    return imgProps;
}

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
    /**
     * When isActive is true this is Theme that will be applied
     */
    activeTheme?: Theme

    /**
     * The name of the icon directory you are pulling the image from (i.e. corresponds to the dir in the context/web location of the running server).
     */
    iconDir: string

    /**
     * The iconSrc denotes which type of icon to use.
     */
    iconSrc?: string

    /**
     * Determines whether this icon is active or not. The active logic is left open to the user.
     */
    isActive?: boolean

    /**
     * Invert the paradigm of active/inactive theme. Useful if the default themes are still desired but
     * just inverse (e.g. white on blue instead of blue on white)
     */
    isInverted?: boolean

    /**
     * The theme to use for this icon.
     */
    theme?: Theme
}

export class SVGIcon extends React.Component<Props, any> {

    static defaultProps = {
        activeTheme: Theme.LIGHT,
        iconSrc: 'default',
        theme: Theme.DEFAULT,
        height: '100%',
        width: '100%'
    };

    getTheme(): Theme {
        let { activeTheme, isActive, isInverted, theme } = this.props;

        if (isInverted) {
            let temp = activeTheme;
            activeTheme = theme;
            theme = temp;
        }

        return isActive ? activeTheme : theme;
    }

    render() {
        const { iconSrc, iconDir } = this.props;

        return (
            <img
                {...imgProps(this.props)}
                alt={iconSrc + '-icon'}
                src={iconURL(iconDir, iconSrc, this.getTheme())}/>
        )
    }
}
