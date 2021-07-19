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
import React, { PureComponent, FC, memo, ReactNode } from 'react';
import { Map } from 'immutable';

import { AppURL } from '../url/AppURL';
import { SAMPLES_KEY, SOURCES_KEY } from '../app/constants';
import {
    SAMPLE_SET_IMPORT_PREFIX,
    DATA_CLASS_IMPORT_PREFIX,
} from '../components/domainproperties/samples/SampleTypeDesigner';

interface Props {
    data: Map<any, any>;
}

export class SampleTypeImportAliasRenderer extends PureComponent<Props> {
    render(): ReactNode {
        return <ImportAliasRenderer appRouteMap={{ [SAMPLE_SET_IMPORT_PREFIX]: SAMPLES_KEY }} data={this.props.data} />;
    }
}

export class SourceTypeImportAliasRenderer extends PureComponent<Props> {
    render(): ReactNode {
        return <ImportAliasRenderer appRouteMap={{ [DATA_CLASS_IMPORT_PREFIX]: SOURCES_KEY }} data={this.props.data} />;
    }
}

interface RendererProps extends Props {
    appRouteMap: Record<string, string>; // map from the import alias key to the app route for LKSM and LKB
}

// export for jest testing
export const ImportAliasRenderer: FC<RendererProps> = memo(props => {
    const { appRouteMap, data } = props;
    const aliasMap = data?.get('displayValue');

    return (
        <>
            {aliasMap?.keySeq().map(key => {
                const tokens = aliasMap.get(key).split('/');
                const route = appRouteMap[tokens[0] + '/'];
                if (tokens.length < 2 || !route) return null;

                return (
                    <div>
                        {key} (Alias for:&nbsp;
                        <a key={key} href={AppURL.create(route, tokens[1]).toHref()}>
                            {tokens[1]}
                        </a>
                        )
                    </div>
                );
            })}
        </>
    );
});
