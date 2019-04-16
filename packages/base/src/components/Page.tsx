/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'

import { PageHeader } from './PageHeader'
import { NotFound } from './NotFound'

export interface PageProps {
    notFound?: boolean
    hasHeader?: boolean
    title?: string
    productName?: string
}

export class Page extends React.Component<PageProps, any> {

    static defaultProps = {
        notFound: false,
        hasHeader: false
    };

    componentDidMount() {
        Page.setDocumentTitle(this.props);
    }

    componentWillReceiveProps(nextProps: PageProps) {
        Page.setDocumentTitle(nextProps);
    }

    static getDocumentTitle(props: PageProps) {
        const { productName, title } = props;
        let fullTitle = (title && title.length > 0) ? title : '';
        if (productName && productName.length > 0)
            fullTitle = fullTitle + ((fullTitle.length > 0) ? ' - ' : '') + productName;
        return fullTitle;
    }

    static setDocumentTitle(props: PageProps) {
        const fullTitle = Page.getDocumentTitle(props);

        if (document.title != fullTitle) {
            document.title = fullTitle;
        }
    }

    isHeader(child) : boolean {
        // Dev/Prod builds require slightly different requirements for this check
        return child.type === PageHeader || child.type.name === 'PageHeader'
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
                        if (this.isHeader(child)) {
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
