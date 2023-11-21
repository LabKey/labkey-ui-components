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
import React, { FC, useRef, useState, useCallback, useEffect, memo } from 'react';
import { List } from 'immutable';
import { Button } from 'react-bootstrap';

import { getServerContext } from '@labkey/api';

import { useServerContext } from '../base/ServerContext';

import { hasPremiumModule, hasProductProjects } from '../../app/utils';

import { NavItem, ParentNavItem } from './NavItem';
import { ITab, SubNavGlobalContext } from './types';
import { useSubNavTabsContext } from './hooks';

interface Props {
    noun?: ITab;
    tabs: List<ITab>;
    showLKVersion?: boolean;
}

export const SubNav: FC<Props> = ({ noun, tabs, showLKVersion }) => {
    const scrollable = useRef<HTMLDivElement>();
    const { container, moduleContext } = useServerContext();
    const { versionString } = getServerContext();
    const showCurrentContainer = hasPremiumModule(moduleContext) && !hasProductProjects(moduleContext);
    const [isScrollable, setIsScrollable] = useState<boolean>(false);
    const scroll = useCallback(offset => {
        scrollable.current.scrollLeft = scrollable.current.scrollLeft + offset;
    }, []);
    const scrollLeft = useCallback(() => scroll(-300), [scroll]);
    const scrollRight = useCallback(() => scroll(300), [scroll]);
    const onItemActivate = useCallback(
        (el: HTMLDivElement) => {
            const scrollPos = scrollable.current.getBoundingClientRect();
            const itemPos = el.getBoundingClientRect();
            const leftEdge = scrollPos.left;
            const rightEdge = scrollPos.left + scrollPos.width;
            const itemLeft = itemPos.left;
            const itemRight = itemPos.left + itemPos.width;

            if (itemLeft < leftEdge) {
                scroll(itemLeft - leftEdge);
            } else if (itemRight > rightEdge) {
                scroll(itemRight - rightEdge);
            }
        },
        [scroll]
    );
    const calculateIsScrollable = useCallback(() => {
        const el = scrollable.current;
        const hasOverflow = el.offsetWidth < el.scrollWidth;

        if (hasOverflow) {
            setIsScrollable(true);
        } else {
            setIsScrollable(false);
        }
    }, []);

    useEffect(() => {
        window.addEventListener('resize', calculateIsScrollable);
        return () => {
            window.removeEventListener('resize', calculateIsScrollable);
        };
    }, [calculateIsScrollable]);

    useEffect(() => {
        // Tabs can be loaded asynchronously, isScrollable is calculated based on the window size and size of the tabs,
        // so we want to recalculate every time the tabs change
        calculateIsScrollable();
    }, [calculateIsScrollable, tabs]);

    return (
        <nav className="navbar navbar-inverse sub-nav">
            <div className="sub-nav-container">
                {noun && (
                    <ParentNavItem to={noun.url} onClick={noun.onClick}>
                        {noun.text}
                    </ParentNavItem>
                )}

                <div className="tab-scroll-ct" ref={scrollable}>
                    <ul className="nav navbar-nav">
                        {tabs
                            .filter(tab => !!tab.text)
                            .map(({ text, url, onClick }, i) => (
                                // neither "text" nor "url" are consistently unique
                                // eslint-disable-next-line react/no-array-index-key
                                <NavItem key={i} to={url} onActive={onItemActivate} onClick={onClick}>
                                    {text}
                                </NavItem>
                            ))}
                    </ul>
                </div>

                {isScrollable && (
                    <div className="btn-group scroll-btn-group">
                        <Button onClick={scrollLeft}>
                            <i className="fa fa-chevron-left" />
                        </Button>
                        <Button onClick={scrollRight}>
                            <i className="fa fa-chevron-right" />
                        </Button>
                    </div>
                )}

                {showCurrentContainer && (
                    <div className="container-nav">
                        <span className="fa fa-folder-open" />
                        <span className="container-nav__name" title={container.name}>
                            {container.name}
                        </span>
                    </div>
                )}

                {showLKVersion && (
                    <div className="lk-version-nav">
                        <span className="lk-version-nav__label" title={versionString}>
                            Version: {versionString}
                        </span>
                    </div>
                )}
            </div>
        </nav>
    );
};

/**
 * SubNavWithContext renders a SubNav component using data stored in the SubNavContext, this component is useful when
 * you need to update the SubNav based on data you load asynchronously after the page loads.
 */
export const SubNavWithTabsContext: FC<SubNavGlobalContext> = memo(() => {
    const { noun, tabs } = useSubNavTabsContext();

    if (tabs.size === 0 && noun === undefined) {
        return null;
    }

    return <SubNav noun={noun} tabs={tabs} />;
});
