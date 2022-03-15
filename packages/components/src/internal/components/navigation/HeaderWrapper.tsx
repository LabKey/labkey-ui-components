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
import classNames from 'classnames';
import React, { FC, useCallback, useEffect, useState } from 'react';

const HEADER_HEIGHT = 75;

export const HeaderWrapper: FC = ({ children }) => {
    const [state, setState] = useState({
        lastScrollY: 0,
        scrolled: false,
        showSubNav: false,
    });
    const onDocScroll = useCallback(() => {
        setState(current => {
            const scrollY = window.scrollY;
            return {
                lastScrollY: scrollY,
                scrolled: scrollY > HEADER_HEIGHT,
                showSubNav: scrollY < current.lastScrollY,
            };
        });
    }, []);

    useEffect(() => {
        window.addEventListener('scroll', onDocScroll);
        return () => window.removeEventListener('scroll', onDocScroll);
    }, [onDocScroll]);

    const className = classNames('app-header-wrapper', { scrolled: state.scrolled, 'show-sub-nav': state.showSubNav });
    return <div className={className}>{children}</div>;
};
