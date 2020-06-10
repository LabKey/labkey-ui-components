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

import { SVGIcon } from '../base/SVGIcon';

import { SearchResultCardData } from './models';

interface SearchResultProps {
    cardData: SearchResultCardData;
    summary: string;
    url: string;
    iconUrl?: string;
}

export class SearchResultCard extends React.Component<SearchResultProps, any> {
    renderType(cardData: SearchResultCardData) {
        if (cardData.typeName) {
            return (
                <div>
                    <strong>Type: </strong>
                    {cardData.typeName}
                </div>
            );
        }
    }

    renderDetail(label: string, value?: string) {
        if (value) {
            return (
                <div>
                    <strong>{label}: </strong>
                    {value}
                </div>
            );
        }
    }

    renderImage(cardData: SearchResultCardData) {
        const { iconUrl } = this.props;

        if (iconUrl) {
            return <img className="search-result__card-icon" src={iconUrl} />;
        }

        const { iconSrc, altText } = cardData;

        return <SVGIcon iconDir="_images" iconSrc={iconSrc} alt={altText} className="search-result__card-icon" />;
    }

    render() {
        const { summary, url, cardData } = this.props;

        return (
            <a href={url}>
                <div className="row search-result__card-container">
                    <div className="col-md-2 hidden-sm hidden-xs search-result__card-icon__container">
                        {this.renderImage(cardData)}
                    </div>
                    <div className="col-md-10 col-sm-12">
                        <div>
                            <h4 className="text-capitalize">{cardData.title}</h4>
                        </div>
                        {this.renderDetail('Category', cardData.category)}
                        {this.renderDetail('Type', cardData.typeName)}
                        <div title={summary}>
                            <strong>Summary: </strong>{' '}
                            {summary.length
                                ? summary.length <= 35
                                    ? summary
                                    : summary.substr(0, 35) + '...'
                                : 'No summary provided'}
                        </div>
                    </div>
                </div>
            </a>
        );
    }
}
