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

import { InsufficientPermissionsAlert } from '../permissions/InsufficientPermissionsAlert';

import { ReleaseNote } from '../notifications/ReleaseNote';
import { isApp } from '../../app/utils';

import { PageHeader } from './PageHeader';

export interface PageProps {
    hasHeader?: boolean;
    notAuthorized?: boolean;
    notAuthorizedMessage?: string;
    notFound?: boolean;
    productName?: string;
    showNotifications?: boolean;
    title?: string;
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
        return child.type.displayName === 'PageHeader';
    };

    render() {
        const { notAuthorizedMessage, notAuthorized, notFound, showNotifications } = this.props;
        let { hasHeader } = this.props;
        let children;

        // Note: you might be tempted to render <NotFound /> or <InsufficientPermissionsPage /> below, but doing that
        // creates a circular dependency between those components and the Page component, so don't do that.
        if (notFound) {
            children = <h1>Not Found</h1>;
        } else if (notAuthorized) {
            children = [
                <PageHeader key="header" title={this.props.title} />,
                <InsufficientPermissionsAlert key="alert" message={notAuthorizedMessage} />,
            ];
        } else {
            children = this.props.children;
        }

        if (children) {
            if (!hasHeader) {
                React.Children.forEach(children, (child: any) => {
                    if (!hasHeader && child && child.type && this.isHeader(child)) {
                        hasHeader = true;
                    }
                });
            }

            return (
                <div className="app-page">
                    {isApp() && <ReleaseNote />}
                    {!hasHeader && <PageHeader showNotifications={showNotifications} />}
                    {children}
                </div>
            );
        }

        return <PageHeader />;
    }
}
