import React, { FC, memo, ReactNode, ReactText, useCallback, useEffect, useState, useMemo } from 'react';

import { Alert, QueryColumn, QuerySelect, SampleStateType } from '../../../..';
import {
    DISCARD_CONSUMED_CHECKBOX_FIELD,
    DISCARD_CONSUMED_COMMENT_FIELD,
    DiscardConsumedSamplesPanel,
} from '../../samples/DiscardConsumedSamplesPanel';
import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../../APIWrapper';

interface SampleStatusInputProps {
    api?: ComponentsAPIWrapper;
    allowDisable?: boolean;
    col: QueryColumn;
    data: any;
    key: ReactText;
    isDetailInput?: boolean;
    initiallyDisabled: boolean;
    onToggleDisable?: (disabled: boolean) => void;
    value?: string | Array<Record<string, any>>;
    onQSChange?: (name: string, value: string | any[], items: any) => void;
    renderLabelField?: (col: QueryColumn) => ReactNode;
    showAsteriskSymbol?: boolean;
    onAdditionalFormDataChange?: (name: string, value: any) => any;
    inputClass?: string;
}

export const SampleStatusInput: FC<SampleStatusInputProps> = memo(props => {
    const {
        api,
        showAsteriskSymbol,
        allowDisable,
        col,
        key,
        initiallyDisabled,
        onToggleDisable,
        value,
        onQSChange,
        renderLabelField,
        onAdditionalFormDataChange,
        inputClass,
    } = props;
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
            setError('Error loading sample statuses');
        }
    };

    useEffect(() => {
        loadConsumedStatuses();
    }, []);

    const onChange = useCallback(
        (name: string, newValue: any, items: any) => {
            onQSChange?.(name, newValue, items);

            const isConsumed = consumedStatuses.indexOf(newValue) > -1 && value !== newValue;
            const isInStorage = onAdditionalFormDataChange?.(
                DISCARD_CONSUMED_CHECKBOX_FIELD,
                shouldDiscard && isConsumed
            );
            const showPanel = isInStorage && isConsumed;
            setShowDiscardPanel(showPanel);
        },
        [onQSChange, consumedStatuses]
    );

    const onCommentChange = useCallback(event => {
        const updatedComment = event.target.value;
        onAdditionalFormDataChange?.(DISCARD_CONSUMED_COMMENT_FIELD, updatedComment);
    }, []);

    const toggleShouldDiscard = useCallback(() => {
        setShouldDiscard(!shouldDiscard);
        onAdditionalFormDataChange?.(DISCARD_CONSUMED_CHECKBOX_FIELD, shouldDiscard && showDiscardPanel);
    }, [shouldDiscard]);

    const discardPanel = useMemo(() => {
        const panel = (
            <DiscardConsumedSamplesPanel
                shouldDiscard={shouldDiscard}
                onCommentChange={onCommentChange}
                toggleShouldDiscard={toggleShouldDiscard}
                discardTitle={`Discard sample${allowDisable ? '(s)' : ''}?`}
            />
        );

        if (allowDisable) {
            return (
                <>
                    <div className="row">
                        <div className="col-sm-3 col-xs-12" />
                        <div className="col-sm-9 col-xs-12">
                            <div className="left-spacing right-spacing">{panel}</div>
                        </div>
                    </div>
                </>
            );
        }
        return panel;
    }, [shouldDiscard, onCommentChange, toggleShouldDiscard, allowDisable]);

    return (
        <>
            <React.Fragment key={key}>
                {renderLabelField?.(col)}
                <QuerySelect
                    addLabelAsterisk={showAsteriskSymbol}
                    allowDisable={allowDisable}
                    componentId={col.fieldKey + key}
                    containerPath={col.lookup.containerPath}
                    displayColumn={col.lookup.displayColumn}
                    formsy
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
                    previewOptions={true}
                    required={col.required}
                    schemaQuery={col.lookup.schemaQuery}
                    showLabel
                    value={value}
                    valueColumn={col.lookup.keyColumn}
                    inputClass={inputClass}
                />
            </React.Fragment>
            {error && <Alert>{error}</Alert>}
            {showDiscardPanel && <>{discardPanel}</>}
        </>
    );
});

SampleStatusInput.defaultProps = {
    api: getDefaultAPIWrapper(),
};
