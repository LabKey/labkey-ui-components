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
import $ from 'jquery';

interface Props {
    headerHeight: number;
}

export class HeaderWrapper extends React.Component<Props, any> {
    private headerWrapper: React.RefObject<HTMLDivElement>;
    private lastScrollY: number;

    constructor(props: Props) {
        super(props);

        this.onDocScroll = this.onDocScroll.bind(this);

        this.lastScrollY = 0;
        this.headerWrapper = React.createRef();
    }

    componentDidMount() {
        window.addEventListener('scroll', this.onDocScroll);
    }

    componentDidUpdate() {
        window.requestAnimationFrame(() => {
            window.scrollTo(0, 0);
        });
    }

    onDocScroll() {
        const { headerHeight } = this.props;
        const scrollY = window.scrollY;

        window.requestAnimationFrame(() => {
            if (this.headerWrapper.current) {
                const wrapperEl = $(this.headerWrapper.current);

                if (scrollY === 0) {
                    wrapperEl.removeClass('scrolled');
                } else if (scrollY > headerHeight) {
                    wrapperEl.addClass('scrolled');
                }

                if (scrollY < this.lastScrollY) {
                    wrapperEl.addClass('show-sub-nav');
                } else {
                    wrapperEl.removeClass('show-sub-nav');
                }
            }

            this.lastScrollY = scrollY;
        });
    }

    render() {
        return (
            <div ref={this.headerWrapper} className="app-header-wrapper">
                {this.props.children}
            </div>
        );
    }
}
