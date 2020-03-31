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
import { Map } from 'immutable';
import { SCHEMAS } from '../base/models/schemas';
import { SVGIcon } from '../base/SVGIcon';
import { SearchResultCardData } from './models';


interface SearchResultProps {
    category?: string
    title: string
    summary: string
    url: string
    data?: any
    iconUrl?: string
    resultsTransformer?: Map<string, SearchResultCardData> // allows for customization of mappings from search results to icons, altText and titles.
}

const DEFAULT_TRANSFORMER = Map<string, SearchResultCardData>({
    "sampleSet": {
        iconSrc: 'sample_set'
    }
});

export class SearchResultCard extends React.Component<SearchResultProps, any> {

    static defaultProps = {
        resultsTransformer: DEFAULT_TRANSFORMER
    };

    resolveType() {
        const { data } = this.props;

        let typeName;
        if (data) {
            if (data.getIn(['dataClass', 'name'])) {
                typeName = data.getIn(['dataClass', 'name']);
            }
            else if (data.getIn(['sampleSet', 'name'])) {
                typeName = data.getIn(['sampleSet', 'name']);
            }

            if (typeName) {
                return (
                    <div>
                        <strong>Type: </strong>
                        {typeName}
                    </div>
                )
            }
        }
    }

    resolveImage() {
        const { category, data, iconUrl, resultsTransformer } = this.props;

        if (iconUrl) {
            return <img className="search-result__card-icon" src={iconUrl}/>
        }

        let iconSrc = '';
        let altText;
        if (data) {
            if (data.getIn(['dataClass', 'name'])) {
                if ('sources' === data.getIn(['dataClass', 'category'])) //TODO make this more general
                    iconSrc = 'sources';
                else
                    iconSrc = data.getIn(['dataClass', 'name']).toLowerCase();
            }
            else if (data.getIn(['sampleSet', 'name'])) {
                const sampleSetName = data.getIn(['sampleSet', 'name']).toLowerCase();

                switch (sampleSetName) {
                    case SCHEMAS.SAMPLE_SETS.RAW_MATERIALS.queryName.toLowerCase():
                        iconSrc = 'ingredients';
                        break;
                    case SCHEMAS.SAMPLE_SETS.MIXTURE_BATCHES.queryName.toLowerCase():
                        iconSrc = 'batch';
                        break;
                    default:
                        iconSrc = 'samples';
                        break;
                }
            }
            else if (data.has('type')) {
                const type = data.get('type');
                const customMapping = resultsTransformer.get(type);
                iconSrc= customMapping && customMapping.iconSrc ? customMapping.iconSrc : type.toLowerCase();
                altText = customMapping && customMapping.altText ? customMapping.altText : undefined;
            }
        }
        if (!iconSrc && category) {
            switch (category)
            {
                case 'workflowJob':
                    iconSrc = 'workflow';
                    break;
                case 'material':
                    iconSrc = 'samples';
                    break;
            }
        }

        return (
            <SVGIcon
                iconDir={'_images'}
                iconSrc={iconSrc}
                alt={altText}
                className="search-result__card-icon"
            />
        )
    }

    /**
     * Hack to update "Sample Set" --> "Sample Type" for Sample Manager, but not other apps
     */
    resolveTitle = () => {
        const { data, title, resultsTransformer } = this.props;
        if (!data)
            return title;

        let titleText = title;
        const type = data.get("type");
        if (type) {
            const typeTransformer = resultsTransformer.get(type);
            if (typeTransformer.getTitle) {
                titleText = typeTransformer.getTitle(data)
            }
        }
        //
        // if (type && type === "sampleSet" && useSampleType)
        // {
        //     const name = data.get("name");
        //     titleText = "Sample Type - " + name;
        // }
        return titleText;
    };

    render () {
        const { summary, url, } = this.props;

        return (
            <a href={url}>
                <div className="row search-result__card-container">
                    <div className="col-md-2 hidden-sm hidden-xs search-result__card-icon__container">
                        {this.resolveImage()}
                    </div>
                    <div className="col-md-10 col-sm-12">
                        <div>
                            <h4 className="text-capitalize">
                                {this.resolveTitle()}
                            </h4>
                        </div>
                        {this.resolveType()}
                        <div title={summary}>
                            <strong>Summary: </strong> {summary.length ? ( summary.length <= 35 ? summary : summary.substr(0, 35) + "..." ): 'No summary provided'}
                        </div>
                    </div>
                </div>
            </a>
        )
    }
}
