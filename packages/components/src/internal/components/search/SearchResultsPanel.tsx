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
import { Panel } from 'react-bootstrap';

import { LoadingSpinner, Alert } from '../../..';

import { helpLinkNode, SEARCH_SYNTAX_TOPIC } from '../../util/helpLinks';

import { SearchResultCard } from './SearchResultCard';
import { SearchResultsModel } from './models';

interface Props {
    model: SearchResultsModel;
    emptyResultDisplay?: React.ReactNode;
    iconUrl?: string;
    hideHeader?: boolean;
    hidePanelFrame?: boolean;
    maxHitSize?: number;
}

export class SearchResultsPanel extends React.Component<Props, any> {
    static defaultProps = {
        maxHitSize: 1000,
    };

    isLoading(): boolean {
        const { model } = this.props;
        return model ? model.get('isLoading') : false;
    }

    renderLoading() {
        if (this.isLoading()) {
            return <LoadingSpinner wrapperClassName="search-results__margin-top" />;
        }
    }

    renderError() {
        const { model } = this.props;
        const error = model ? model.get('error') : undefined;

        if (!this.isLoading() && error) {
            console.error(error);
            return (
                <Alert>
                    There was an error with your search term(s). See the{' '}
                    {helpLinkNode(SEARCH_SYNTAX_TOPIC, 'LabKey Search Documentation')} page for more information on
                    search terms and operators.
                </Alert>
            );
        }
    }

    renderResults() {
        const { model, iconUrl, emptyResultDisplay, hideHeader, maxHitSize } = this.props;

        if (this.isLoading()) return;

        const data = model ? model.getIn(['entities', 'hits']) : undefined;

        if (data && data.size > 0) {
            const totalHit = model.getIn(['entities', 'totalHits']);
            const msg = data.size.toLocaleString() + ' Result' + (data.size !== 1 ? 's' : '');
            const headerMsg =
                totalHit > maxHitSize ? `${data.size.toLocaleString()} of ${totalHit.toLocaleString()} Results` : msg;

            return (
                <div>
                    {!hideHeader && <h3 className="no-margin-top search-results__amount">{headerMsg}</h3>}
                    {data.size > 0 &&
                        data.map((item, i) => (
                            <div key={i} className="col-md-6 col-sm-12 search-results__margin-top">
                                <SearchResultCard
                                    summary={item.get('summary')}
                                    url={item.get('url')}
                                    iconUrl={iconUrl}
                                    cardData={item.get('cardData').toJS()}
                                />
                            </div>
                        ))}
                </div>
            );
        } else {
            return emptyResultDisplay ? (
                emptyResultDisplay
            ) : (
                <div className="search-results__margin-top">No Results Found</div>
            );
        }
    }

    render() {
        const { hidePanelFrame } = this.props;

        const body = (
            <>
                {this.renderLoading()}
                {this.renderError()}
                {this.renderResults()}
            </>
        );

        if (hidePanelFrame) return body;

        return (
            <Panel>
                <Panel.Body>{body}</Panel.Body>
            </Panel>
        );
    }
}
