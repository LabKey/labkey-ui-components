import React, { FC, memo, ReactNode, ReactText, useCallback, useEffect, useState, useMemo } from 'react';
import { Query } from '@labkey/api';

import {
    DISCARD_CONSUMED_CHECKBOX_FIELD,
    DISCARD_CONSUMED_COMMENT_FIELD,
    DiscardConsumedSamplesPanel,
} from '../../samples/DiscardConsumedSamplesPanel';

import { Alert } from '../../base/Alert';
import { QueryColumn } from '../../../../public/QueryColumn';
import { QuerySelect } from '../QuerySelect';
import { SampleStateType } from '../../samples/constants';
import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../../APIWrapper';
import { userCanEditStorageData } from '../../../app/utils';
import { useServerContext } from '../../base/ServerContext';

interface SampleStatusInputProps {
    api?: ComponentsAPIWrapper;
    col: QueryColumn;
    containerFilter?: Query.ContainerFilter;
    containerPath?: string;
    data: any;
    key: ReactText;
    isDetailInput?: boolean;
    allowDisable?: boolean;
    initiallyDisabled?: boolean;
    onToggleDisable?: (disabled: boolean) => void;
    value?: string | Array<Record<string, any>>;
    onQSChange?: (name: string, value: string | any[], items: any) => void;
    renderLabelField?: (col: QueryColumn) => ReactNode;
    showAsteriskSymbol?: boolean;
    onAdditionalFormDataChange?: (name: string, value: any) => any;
    inputClass?: string;
    formsy?: boolean; // for jest test
}

export const SampleStatusInput: FC<SampleStatusInputProps> = memo(props => {
    const {
        api,
        showAsteriskSymbol,
        allowDisable,
        col,
        containerFilter,
        containerPath,
        key,
        initiallyDisabled,
        onToggleDisable,
        value,
        onQSChange,
        renderLabelField,
        onAdditionalFormDataChange,
        inputClass,
        formsy,
    } = props;
    const { user } = useServerContext();
    const [consumedStatuses, setConsumedStatuses] = useState<number[]>(undefined);
    const [error, setError] = useState<string>(undefined);
    const [showDiscardPanel, setShowDiscardPanel] = useState<boolean>(false);
    const [shouldDiscard, setShouldDiscard] = useState<boolean>(true);

    const loadConsumedStatuses = async (): Promise<void> => {
        try {
            const statuses = await api.samples.getSampleStatuses();
            const consumedStatusIds = [];
            statuses.forEach(status => {
                if (status.stateType == SampleStateType.Consumed) consumedStatusIds.push(status.rowId);
            });
            setConsumedStatuses(consumedStatusIds);
        } catch (error) {
            console.error(error.exception);
            setError(
                'Error loading sample statuses. If you want to discard ' +
                    (allowDisable /* bulk update */ ? 'any samples' : 'the sample') +
                    ' being updated to a Consumed status, you will have to do that separately.'
            );
        }
    };

    useEffect(() => {
        loadConsumedStatuses();
    }, []);

    const onChange = useCallback(
        (name: string, newValue: any, items: any) => {
            onQSChange?.(name, newValue, items);
            if (userCanEditStorageData(user)) {
                const isConsumed = consumedStatuses.indexOf(newValue) > -1 && value !== newValue;
                const isInStorage = onAdditionalFormDataChange?.(
                    DISCARD_CONSUMED_CHECKBOX_FIELD,
                    shouldDiscard && isConsumed
                );
                const showPanel = isInStorage && isConsumed;
                setShowDiscardPanel(showPanel);
            }
        },
        [consumedStatuses, onAdditionalFormDataChange, onQSChange, shouldDiscard, value]
    );

    const onCommentChange = useCallback(
        event => {
            const updatedComment = event.target.value;
            onAdditionalFormDataChange?.(DISCARD_CONSUMED_COMMENT_FIELD, updatedComment);
        },
        [onAdditionalFormDataChange]
    );

    const toggleShouldDiscard = useCallback(() => {
        const updatedShouldDiscard = !shouldDiscard;
        setShouldDiscard(updatedShouldDiscard);
        onAdditionalFormDataChange?.(DISCARD_CONSUMED_CHECKBOX_FIELD, updatedShouldDiscard && showDiscardPanel);
    }, [shouldDiscard, onAdditionalFormDataChange, showDiscardPanel]);

    const discardPanel = useMemo(() => {
        const isBulkForm = allowDisable;

        const panel = (
            <DiscardConsumedSamplesPanel
                shouldDiscard={shouldDiscard}
                onCommentChange={onCommentChange}
                toggleShouldDiscard={toggleShouldDiscard}
                discardTitle={`Discard sample${isBulkForm ? '(s)' : ''}?`}
            />
        );

        if (isBulkForm) {
            return (
                <div className="row sample-bulk-update-discard-panel">
                    <div className="col-sm-3 col-xs-12" />
                    <div className="col-sm-9 col-xs-12">
                        <div className="left-spacing right-spacing">{panel}</div>
                    </div>
                </div>
            );
        }
        return panel;
    }, [shouldDiscard, onCommentChange, toggleShouldDiscard, allowDisable]);

    return (
        <React.Fragment key={key}>
            {renderLabelField?.(col)}
            <QuerySelect
                addLabelAsterisk={showAsteriskSymbol}
                allowDisable={allowDisable}
                componentId={col.fieldKey + key}
                containerFilter={col.lookup.containerFilter ?? containerFilter}
                containerPath={col.lookup.containerPath ?? containerPath}
                displayColumn={col.lookup.displayColumn}
                formsy={formsy}
                helpTipRenderer={col.helpTipRenderer}
                initiallyDisabled={initiallyDisabled}
                joinValues={col.isJunctionLookup()}
                label={col.caption}
                loadOnFocus
                maxRows={10}
                multiple={col.isJunctionLookup()}
                name={col.fieldKey}
                onQSChange={onChange}
                onToggleDisable={onToggleDisable}
                placeholder="Select or type to search..."
                required={col.required}
                schemaQuery={col.lookup.schemaQuery}
                showLabel
                value={value}
                valueColumn={col.lookup.keyColumn}
                inputClass={inputClass}
            />
            {error && <Alert>{error}</Alert>}
            {showDiscardPanel && <>{discardPanel}</>}
        </React.Fragment>
    );
});

SampleStatusInput.defaultProps = {
    api: getDefaultAPIWrapper(),
    formsy: true,
};
