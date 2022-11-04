import React, { FC, memo, useEffect, useState } from 'react';

import { useAppContext } from '../../AppContext';

import { DetailDisplaySharedProps } from '../forms/detail/DetailDisplay';

import { RequiresModelAndActions } from '../../../public/QueryModel/withQueryModels';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { DetailPanel } from '../../../public/QueryModel/DetailPanel';

interface Props extends DetailDisplaySharedProps, RequiresModelAndActions {
    schemaQuery: SchemaQuery;
}

export const DesignerDetailPanel: FC<Props> = memo(props => {
    const { schemaQuery, ...detailDisplayProps } = props;
    const { api } = useAppContext();
    const [previews, setPreviews] = useState<Record<string, string>>();

    useEffect(() => {
        (async () => {
            if (schemaQuery) {
                setPreviews(undefined);

                try {
                    const previews_: Record<string, string> = {};
                    const results = await api.domain.getDomainNamePreviews(schemaQuery);
                    if (results?.length > 0) {
                        if (results[0])
                            previews_.nameexpression =
                                'Example name that will be generated from the current pattern: ' + results[0];
                        if (results?.length > 1 && !!results[1])
                            previews_.aliquotnameexpression =
                                'Example aliquot name that will be generated from the current pattern: ' + results[1];
                    }

                    setPreviews(previews_);
                } catch (reason) {
                    console.error(reason);
                }
            }
        })();
    }, [api, schemaQuery]);

    return <DetailPanel fieldHelpTexts={previews} {...detailDisplayProps} />;
});
