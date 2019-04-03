/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'
import { NotFound } from "./NotFound";

interface PageHeaderProps {
    icon?: string
    // showNotifications?: boolean
    title?: string
}

export class PageHeader extends React.Component<PageHeaderProps, any> {

    // static defaultProps = {
    //     showNotifications: true
    // };

    render() {
        const { icon, title } = this.props;

        return (
            <div className="page-header">
                {this.props.children}
                <h2 className="text-capitalize no-margin-top">
                    {icon ? <span className={`fa fa-${icon}`}>&nbsp;</span> : null}
                    {title}
                </h2>
                {/*{showNotifications && <Notification/>}*/}
            </div>
        )
    }
}


interface PageProps {
    notFound?: boolean
    hasHeader?: boolean
    title?: string
}

export class Page extends React.Component<PageProps, any> {

    static defaultProps = {
        hasHeader: false
    };

    componentDidMount() {
        Page.setDocumentTitle(this.props);
    }

    componentWillReceiveProps(nextProps: PageProps) {
        Page.setDocumentTitle(nextProps);
    }

    static setDocumentTitle(props: PageProps) {
        const { title } = props;
        let nextTitle = 'LabKey Biologics';

        if (title && title.length > 0) {
            nextTitle = title + " - " + nextTitle;
        }

        if (document.title != nextTitle) {
            document.title = nextTitle;
        }
    }

    render() {
        const { children, notFound } = this.props;

        if (notFound) {
            return <NotFound/>
        }

        if (children) {
            let hasHeader = this.props.hasHeader;
            if (!hasHeader) {
                React.Children.forEach(children, (child: any) => {
                    if (!hasHeader && child && child.type) {
                        if (
                            // Dev/Prod builds require slightly different requirements for this check
                            (child.type === PageHeader)  ||
                            (child.type.name === 'PageHeader' || child.type.name === 'PageDetailHeader')
                        ) {
                            hasHeader = true;
                        }
                    }
                });
            }

            return (
                <>
                    {!hasHeader && <PageHeader/>}
                    {children}
                </>
            );
        }

        return <PageHeader/>
    }
}