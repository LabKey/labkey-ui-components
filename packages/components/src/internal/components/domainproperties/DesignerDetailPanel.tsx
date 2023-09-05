import React, { FC, memo, useEffect, useState } from 'react';

import { useAppContext } from '../../AppContext';

import { DetailDisplaySharedProps } from '../forms/detail/DetailDisplay';

import { RequiresModelAndActions } from '../../../public/QueryModel/withQueryModels';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { DetailPanel } from '../../../public/QueryModel/DetailPanel';
import { caseInsensitive } from '../../util/utils';
import { LabelHelpTip } from '../base/LabelHelpTip';

export interface DesignerDetailPanelProps extends DetailDisplaySharedProps, RequiresModelAndActions {
    schemaQuery: SchemaQuery;
}

export const DesignerDetailPanel: FC<DesignerDetailPanelProps> = memo(props => {
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

export const DesignerDetailTooltip: FC<DesignerDetailPanelProps> = memo(props => {
    const { actions, model, detailRenderer, schemaQuery } = props;
    const description = caseInsensitive(model?.getRow(), 'Description')?.value;

    return (
        <div>
            {!!description && (
                <>
                    <span className="header-details-description">{description}</span>
                    <span>&nbsp;</span>
                </>
            )}
            <LabelHelpTip iconComponent={<span className="header-details-link">Details</span>} placement="bottom">
                <div className="header-details-hover">
                    <DesignerDetailPanel
                        actions={actions}
                        detailRenderer={detailRenderer}
                        model={model}
                        schemaQuery={schemaQuery}
                    />
                </div>
            </LabelHelpTip>
        </div>
    );
});
