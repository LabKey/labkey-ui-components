import React, { FC, memo, useEffect, useState } from 'react';

import { useAppContext } from '../../AppContext';

import { DetailDisplaySharedProps } from '../forms/detail/DetailDisplay';

import { RequiresModelAndActions } from '../../../public/QueryModel/withQueryModels';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { DetailPanel } from '../../../public/QueryModel/DetailPanel';
import { QueryColumn } from '../../../public/QueryColumn';
import { caseInsensitive } from '../../util/utils';
import { LabelHelpTip } from '../base/LabelHelpTip';

export interface DesignerDetailPanelProps extends DetailDisplaySharedProps, RequiresModelAndActions {
    queryColumns?: QueryColumn[];
    schemaQuery?: SchemaQuery;
}

export const DesignerDetailPanel: FC<DesignerDetailPanelProps> = memo(props => {
    const { schemaQuery, ...detailDisplayProps } = props;
    const { api } = useAppContext();
    const [previews, setPreviews] = useState<Record<string, string>>();

    // don't show description in the panel since it is shown elsewhere in the app header
    const queryColumns =
        props.queryColumns ?? props.model?.detailColumns?.filter(col => col.fieldKey.toLowerCase() !== 'description');

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

    return <DetailPanel fieldHelpTexts={previews} queryColumns={queryColumns} {...detailDisplayProps} />;
});

export const DesignerDetailTooltip: FC<DesignerDetailPanelProps> = memo(props => {
    const { model } = props;
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
                    <DesignerDetailPanel {...props} />
                </div>
            </LabelHelpTip>
        </div>
    );
});
