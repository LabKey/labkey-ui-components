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

import { HelpLink, SEARCH_SYNTAX_TOPIC } from '../../util/helpLinks';

import { LoadingSpinner } from '../base/LoadingSpinner';

import { Alert } from '../base/Alert';

import { SearchResultCard } from './SearchResultCard';
import { SearchResultsModel } from './models';
import { decodeErrorMessage } from './utils';

interface Props {
    emptyResultDisplay?: React.ReactNode;
    hidePanelFrame?: boolean;
    iconUrl?: string;
    model: SearchResultsModel;
    offset?: number;
}

export class SearchResultsPanel extends React.Component<Props, any> {
    static defaultProps = {
        maxHitSize: 1000,
        offset: 0,
    };

    isLoading(): boolean {
        const { model } = this.props;
        return model ? model.get('isLoading') : false;
    }

    renderLoading() {
        if (this.isLoading()) {
            return (
                <div className="panel-body">
                    <LoadingSpinner />
                </div>
            );
        }
    }

    renderError() {
        const { model } = this.props;
        const error = model ? model.get('error') : undefined;

        if (!this.isLoading() && error) {
            return (
                <div className="panel-body">
                    <Alert>
                        There was an error with your search term(s). {decodeErrorMessage(error)}
                        <br/><br/>
                        See the{' '}
                        <HelpLink topic={SEARCH_SYNTAX_TOPIC}>LabKey Search Documentation</HelpLink>
                        {' '} page for more information on
                        search terms and operators.
                    </Alert>
                </div>
            );
        }
    }

    renderResults() {
        const { model, iconUrl, emptyResultDisplay, offset } = this.props;

        if (this.isLoading()) return;

        const data = model ? model.getIn(['entities', 'hits']) : undefined;

        if (data && data.size > 0) {

            return (
                <div className="top-spacing">
                    {data.size > 0 &&
                        data.map((item, i) => (
                            <div key={i} className="col-md-12 col-sm-12 search-results__margin-top">
                                <SearchResultCard
                                    summary={item.get('summary')}
                                    url={item.get('url')}
                                    iconUrl={iconUrl}
                                    cardData={item.get('cardData').toJS()}
                                    isTopResult={offset === 0 && i === 0}
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
        const { hidePanelFrame, model } = this.props;
        const error = model ? model.get('error') : undefined;

        const body = (
            <>
                {this.renderLoading()}
                {this.renderError()}
                {!error && this.renderResults()}
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
