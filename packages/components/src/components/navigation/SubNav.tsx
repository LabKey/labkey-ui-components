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

import React from 'react';
import { List } from 'immutable';
import { Button } from 'react-bootstrap';
import $ from 'jquery';

import { AppURL } from '../../url/AppURL';

import { NavItem, ParentNavItem } from './NavItem';

interface ISubNavProps {
    params?: any;
    noun?: ITab;
    tabs: List<ITab>;
}

interface SubNavState {
    isScrollable?: boolean;
}

export interface ITab {
    text: string;
    tooltip?: React.ReactNode;
    url: string | AppURL; // will be used to match router.isActive()
}

let activateTimer;

export class SubNav extends React.Component<ISubNavProps, SubNavState> {
    private scrollable: React.RefObject<HTMLDivElement>;

    constructor(props: ISubNavProps) {
        super(props);

        this.onItemActivate = this.onItemActivate.bind(this);
        this.onResize = this.onResize.bind(this);
        this.scrollLeft = this.scrollLeft.bind(this);
        this.scrollRight = this.scrollRight.bind(this);

        this.state = {
            isScrollable: false,
        };

        this.scrollable = React.createRef();
    }

    componentDidMount() {
        this.onResize();
        $(window).resize(this.onResize);
    }

    componentWillUnmount() {
        $(window).off('resize', this.onResize);
    }

    componentDidUpdate() {
        this.onResize();
    }

    shouldComponentUpdate(nextProps: ISubNavProps) {
        return true;
    }

    onItemActivate(itemEl) {
        if (this.state.isScrollable) {
            clearTimeout(activateTimer);

            activateTimer = window.setTimeout(() => {
                activateTimer = null;
                this.scrollTo(itemEl);
            }, 25);
        }
    }

    onResize() {
        const el = this.scrollable.current;
        const hasOverflow = el.offsetWidth < el.scrollWidth;

        if (hasOverflow) {
            if (!this.state.isScrollable) {
                this.setState({
                    isScrollable: true,
                });
            }
        } else {
            if (this.state.isScrollable) {
                this.setState({
                    isScrollable: false,
                });
            }
        }
    }

    scroll(scrollLeftDelta: number) {
        $(this.scrollable.current).animate(
            {
                scrollLeft: this.scrollable.current.scrollLeft + scrollLeftDelta,
            },
            200
        );
    }

    scrollLeft() {
        this.scroll(-300);
    }

    scrollRight() {
        this.scroll(300);
    }

    scrollTo(itemEl) {
        const scroll = $(this.scrollable.current);
        const scrollPos = scroll.position();

        const item = $(itemEl);
        const itemPos = item.position();

        const leftEdge = scrollPos.left;
        const rightEdge = scrollPos.left + scroll.width();
        const itemLeft = itemPos.left;
        const itemRight = itemPos.left + item.width();

        if (itemLeft < leftEdge) {
            this.scroll(itemLeft - leftEdge);
        } else if (itemRight > rightEdge) {
            this.scroll(itemRight - rightEdge);
        }
    }

    render() {
        const { noun, tabs } = this.props;

        return (
            <nav className="navbar navbar-inverse no-margin-bottom sub-nav">
                <div className="container">
                    {noun && <ParentNavItem to={noun.url}>{noun.text}</ParentNavItem>}
                    <div className="tab-scroll-ct" ref={this.scrollable}>
                        <ul className="nav navbar-nav">
                            {tabs.map((tab, i) => (
                                <NavItem
                                    key={i}
                                    to={tab.url}
                                    onActive={this.state.isScrollable && this.onItemActivate}
                                    onlyActiveOnIndex={tab.text === 'Overview'}
                                >
                                    {tab.text}
                                </NavItem>
                            ))}
                        </ul>
                    </div>
                    {this.state.isScrollable && (
                        <div className="btn-group scroll-btn-group">
                            <Button onClick={this.scrollLeft}>
                                <i className="fa fa-chevron-left" />
                            </Button>
                            <Button onClick={this.scrollRight}>
                                <i className="fa fa-chevron-right" />
                            </Button>
                        </div>
                    )}
                </div>
            </nav>
        );
    }
}
