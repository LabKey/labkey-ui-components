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
import { NotFound } from './NotFound';

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
        Page.setDocumentTitle(this.props);
    }

    UNSAFE_componentWillReceiveProps(nextProps: PageProps): void {
        Page.setDocumentTitle(nextProps);
    }

    static getDocumentTitle(props: PageProps) {
        const { productName, title } = props;
        let fullTitle = title && title.length > 0 ? title : '';
        if (productName && productName.length > 0)
            fullTitle = fullTitle + (fullTitle.length > 0 ? ' - ' : '') + productName;
        return fullTitle;
    }

    static setDocumentTitle(props: PageProps) {
        const fullTitle = Page.getDocumentTitle(props);

        if (document.title != fullTitle) {
            document.title = fullTitle;
        }
    }

    isHeader(child): boolean {
        // Dev/Prod builds require slightly different requirements for this check
        return child.type === PageHeader || child.type.name === 'PageHeader';
    }

    render() {
        const { children, notFound, showNotifications } = this.props;

        if (notFound) {
            return <NotFound />;
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
                    {!hasHeader && <PageHeader showNotifications={showNotifications}/>}
                    {children}
                </>
            );
        }

        return <PageHeader />;
    }
}
