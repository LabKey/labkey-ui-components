import React, { FC, memo, useEffect, useState } from 'react';

import { DetailDisplaySharedProps } from '../forms/detail/DetailDisplay';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';
import { RequiresModelAndActions } from '../../../public/QueryModel/withQueryModels';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { DetailPanel } from '../../../public/QueryModel/DetailPanel';

interface Props extends DetailDisplaySharedProps, RequiresModelAndActions {
    api?: ComponentsAPIWrapper;
    asPanel?: boolean;
    schemaQuery: SchemaQuery;
}

export const DesignerDetailPanel: FC<Props> = memo(props => {
    const { api, schemaQuery, asPanel, ...detailDisplayProps } = props;
    const [previews, setPreviews] = useState<{}>();

    const init = async () => {
        if (schemaQuery) {
            setPreviews(undefined);

            const previews = {};
            try {
                const results = await api.domain.getDomainNamePreviews(schemaQuery);
                if (results?.length > 0) {
                    if (results[0])
                        previews['nameexpression'] =
                            'Example name that will be generated from the current pattern: ' + results[0];
                    if (results?.length > 1 && !!results[1])
                        previews['aliquotnameexpression'] =
                            'Example aliquot name that will be generated from the current pattern: ' + results[1];
                }

                setPreviews(previews);
            } catch (reason) {
                console.error(reason);
            }
        }
    };

    useEffect(() => {
        init();
    }, [schemaQuery]);

    return <DetailPanel asPanel={asPanel} fieldHelpTexts={previews} {...detailDisplayProps} />;
});

DesignerDetailPanel.defaultProps = {
    api: getDefaultAPIWrapper(),
};
