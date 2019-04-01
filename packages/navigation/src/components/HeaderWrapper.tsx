/*
 * Copyright (c) 2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'
import $ from 'jquery'

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
                }
                else if (scrollY > headerHeight) {
                    wrapperEl.addClass('scrolled');
                }


                if (scrollY < this.lastScrollY) {
                    wrapperEl.addClass('show-sub-nav');
                }
                else {
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
        )
    }
}