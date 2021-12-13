import React, { FC, memo, useEffect, useMemo, useState } from 'react';
import {getDomainNamePreviews} from "./actions";
import {DetailPanel, RequiresModelAndActions, SchemaQuery} from "../../..";
import {DetailDisplay, DetailDisplaySharedProps} from "../forms/detail/DetailDisplay";

interface Props extends DetailDisplaySharedProps, RequiresModelAndActions {
    schemaQuery: SchemaQuery;
    asPanel?: boolean;
}

export const DesignerDetailPanel : FC<Props> = memo((props) => {
    const { schemaQuery, asPanel, ...detailDisplayProps } = props;
    const [previews, setPreviews] = useState<{}>();

    const init = async () => {
        if (schemaQuery) {
            setPreviews(undefined);

            let previews = {};
            try {

                const results = await getDomainNamePreviews(schemaQuery);
                if (results?.length > 0) {
                    if (!!results[0])
                        previews['nameexpression'] = "Example name that will be generated from the current pattern: " + results[0];
                    if (results?.length > 1 && !!results[1])
                        previews['aliquotnameexpression'] = "Example aliquot name that will be generated from the current pattern: " + results[1];
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

    return (
        <DetailPanel
            asPanel={asPanel}
            fieldHelpTexts={previews}
            {...detailDisplayProps}
        />
    );
});
