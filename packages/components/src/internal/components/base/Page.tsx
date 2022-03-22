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

import { PageHeader } from './PageHeader';

export interface PageProps {
    notFound?: boolean;
    hasHeader?: boolean;
    title?: string;
    productName?: string;
    showNotifications?: boolean;
}

export class Page extends React.Component<PageProps, any> {
    static defaultProps = {
        notFound: false,
        hasHeader: false,
    };

    componentDidMount() {
        this.setDocumentTitle();
        window.scrollTo(0, 0);
    }

    componentDidUpdate(): void {
        this.setDocumentTitle();
    }

    static getDocumentTitle(props: PageProps): string {
        const { productName, title } = props;
        let fullTitle = title && title.length > 0 ? title : '';
        if (productName && productName.length > 0)
            fullTitle = fullTitle + (fullTitle.length > 0 ? ' - ' : '') + productName;
        return fullTitle;
    }

    setDocumentTitle = (): void => {
        const fullTitle = Page.getDocumentTitle(this.props);

        if (document.title !== fullTitle) {
            document.title = fullTitle;
        }
    };

    isHeader = (child): boolean => {
        // Dev/Prod builds require slightly different requirements for this check
        return child.type === PageHeader || child.type.name === 'PageHeader';
    };

    render() {
        const { notFound, showNotifications } = this.props;
        let { hasHeader } = this.props;
        const children = notFound ? <h1>Not Found</h1> : this.props.children;

        if (children) {
            if (!hasHeader) {
                React.Children.forEach(children, (child: any) => {
                    if (!hasHeader && child && child.type && this.isHeader(child)) {
                        hasHeader = true;
                    }
                });
            }

            return (
                <>
                    {!hasHeader && <PageHeader showNotifications={showNotifications} />}
                    {children}
                </>
            );
        }

        return <PageHeader />;
    }
}
