/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, { PureComponent } from 'react';
import { Utils } from '@labkey/api';

import { imageURL } from '../../..';

export enum Theme {
    DEFAULT,
    GRAY,
    LIGHT,
    ORANGE,
}

export function iconURL(iconDir: string, prefix?: string, theme?: Theme): string {
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
    const imgProps = Object.assign({}, props);
    delete imgProps.activeTheme;
    delete imgProps.iconDir;
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
    activeTheme?: Theme;

    /**
     * The name of the icon directory you are pulling the image from (i.e. corresponds to the dir in the context/web location of the running server).
     */
    iconDir?: string;

    /**
     * The iconSrc denotes which type of icon to use.
     */
    iconSrc?: string;

    /**
     * Determines whether this icon is active or not. The active logic is left open to the user.
     */
    isActive?: boolean;

    /**
     * Invert the paradigm of active/inactive theme. Useful if the default themes are still desired but
     * just inverse (e.g. white on blue instead of blue on white)
     */
    isInverted?: boolean;

    /**
     * The theme to use for this icon.
     */
    theme?: Theme;
}

export class SVGIcon extends PureComponent<Props> {
    static defaultProps = {
        activeTheme: Theme.LIGHT,
        iconDir: '_images',
        iconSrc: 'default',
        theme: Theme.DEFAULT,
        height: '100%',
        width: '100%',
    };

    getTheme(): Theme {
        let { activeTheme, isActive, isInverted, theme } = this.props;

        if (isInverted) {
            const temp = activeTheme;
            activeTheme = theme;
            theme = temp;
        }

        return isActive ? activeTheme : theme;
    }

    render() {
        const { iconSrc, iconDir, alt } = this.props;

        return (
            <img
                {...imgProps(this.props)}
                alt={alt ? alt : iconSrc + '-icon'}
                src={iconURL(iconDir, iconSrc, this.getTheme())}
            />
        );
    }
}
