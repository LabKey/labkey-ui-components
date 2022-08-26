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
import React, { ReactNode, FC, useRef, useState, useCallback, useEffect } from 'react';
import { List } from 'immutable';
import { Button } from 'react-bootstrap';

import NavItem, { ParentNavItem } from './NavItem';
import {AppURL} from "../../url/AppURL";
import {useAppContext} from "../../AppContext";
import {useServerContext} from "../base/ServerContext";

interface Props {
    ignoreShow?: boolean; // Forces the SubNav to always be hidden in "scrolled" mode
    noun?: ITab;
    tabs: List<ITab>;
}

export interface ITab {
    text: string;
    tooltip?: ReactNode;
    url: string | AppURL;
}

export const SubNav: FC<Props> = ({ ignoreShow, noun, tabs }) => {
    const scrollable = useRef<HTMLDivElement>();
    const { navigation } = useAppContext();
    const { container } = useServerContext();
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

    const className = classNames('navbar navbar-inverse no-margin-bottom sub-nav', { 'sub-nav--ignore-show': ignoreShow });

    return (
        <nav className={className}>
            <div className="container">
                {noun && <ParentNavItem to={noun.url}>{noun.text}</ParentNavItem>}

                <div className="tab-scroll-ct" ref={scrollable}>
                    <ul className="nav navbar-nav">
                        {tabs
                            .filter(tab => !!tab.text)
                            .map(({ text, url }, i) => (
                                // neither "text" nor "url" are consistently unique
                                // eslint-disable-next-line react/no-array-index-key
                                <NavItem key={i} to={url} onActive={onItemActivate}>
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

                {navigation.showCurrentContainer && (
                    <div className="container-nav">
                        <span className="fa fa-folder-open" />
                        <span className="container-nav__name" title={container.name}>
                            {container.name}
                        </span>
                    </div>
                )}
            </div>
        </nav>
    );
};
