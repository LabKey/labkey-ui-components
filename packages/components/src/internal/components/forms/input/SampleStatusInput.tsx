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
import { userCanEditStorageData } from '../../../app/utils';
import { useServerContext } from '../../base/ServerContext';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../../APIWrapper';
import { customStyles, customTheme } from '../../editable/LookupCell';

interface SampleStatusInputProps {
    addLabelAsterisk?: boolean;
    allowDisable?: boolean;
    api?: ComponentsAPIWrapper;
    col: QueryColumn;
    containerFilter?: Query.ContainerFilter;
    containerPath?: string;
    data: any;
    formsy?: boolean;
    initiallyDisabled?: boolean;
    inputClass?: string;
    isDetailInput?: boolean;
    isGridInput?: boolean;
    onAdditionalFormDataChange?: (name: string, value: any) => any;
    onQSChange?: (name: string, value: string | any[], items: any) => void;
    onToggleDisable?: (disabled: boolean) => void;
    renderLabelField?: (col: QueryColumn) => ReactNode;
    value?: string | Array<Record<string, any>>; // for jest test
}

// Move somewhere more central?
// Styles to match form-control in bulk form
export const customBulkStyles = {
    control: provided => ({
        ...provided,
        color: '#555555',
        border: '1px solid #ccc',
        borderRadius: '4px',
    }),
    singleValue: provided => ({
        ...provided,
        color: '#555555',
    }),
};

export const SampleStatusInput: FC<SampleStatusInputProps> = memo(props => {
    const {
        addLabelAsterisk,
        api,
        allowDisable,
        col,
        containerFilter,
        containerPath,
        initiallyDisabled,
        onToggleDisable,
        value,
        onQSChange,
        renderLabelField,
        onAdditionalFormDataChange,
        inputClass,
        formsy,
        isGridInput,
        isDetailInput,
    } = props;
    const { user } = useServerContext();
    const [consumedStatuses, setConsumedStatuses] = useState<number[]>();
    const [error, setError] = useState<string>();
    const [showDiscardPanel, setShowDiscardPanel] = useState<boolean>(false);
    const [shouldDiscard, setShouldDiscard] = useState<boolean>(true);

    useEffect(() => {
        (async () => {
            try {
                const statuses = await api.samples.getSampleStatuses();
                const consumedStatusIds = [];
                statuses.forEach(status => {
                    if (status.stateType === SampleStateType.Consumed) consumedStatusIds.push(status.rowId);
                });
                setConsumedStatuses(consumedStatusIds);
            } catch (e) {
                setError(
                    'Error loading sample statuses. If you want to discard ' +
                        (allowDisable /* bulk update */ ? 'any samples' : 'the sample') +
                        ' being updated to a Consumed status, you will have to do that separately.'
                );
            }
        })();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const onChange = useCallback(
        (name: string, newValue: any, items: any) => {
            onQSChange?.(name, newValue, items);
            if (userCanEditStorageData(user)) {
                const isConsumed = consumedStatuses.indexOf(newValue) > -1 && value !== newValue;
                const isInStorage = onAdditionalFormDataChange?.(
                    DISCARD_CONSUMED_CHECKBOX_FIELD,
                    shouldDiscard && isConsumed
                );
                setShowDiscardPanel(isInStorage && isConsumed);
            }
        },
        [consumedStatuses, onAdditionalFormDataChange, onQSChange, shouldDiscard, user, value]
    );

    const onCommentChange = useCallback(
        event => {
            onAdditionalFormDataChange?.(DISCARD_CONSUMED_COMMENT_FIELD, event.target.value);
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
        <>
            {renderLabelField?.(col)}
            <QuerySelect
                addLabelAsterisk={addLabelAsterisk}
                allowDisable={allowDisable}
                containerClass={isGridInput ? 'select-input-cell-container' : undefined}
                containerFilter={col.lookup.containerFilter ?? containerFilter}
                containerPath={col.lookup.containerPath ?? containerPath}
                customStyles={isGridInput ? customStyles : isDetailInput ? undefined : customBulkStyles}
                customTheme={isGridInput ? customTheme : undefined}
                description={col.description}
                displayColumn={col.lookup.displayColumn}
                formsy={isGridInput ? false : formsy}
                helpTipRenderer={col.helpTipRenderer}
                initiallyDisabled={initiallyDisabled}
                inputClass={isGridInput ? 'select-input-cell' : inputClass}
                joinValues={col.isJunctionLookup()}
                key={col.fieldKey}
                label={isGridInput ? undefined : col.caption}
                loadOnFocus
                maxRows={10}
                menuPosition={isGridInput ? 'fixed' : undefined}
                multiple={col.isJunctionLookup()}
                name={col.fieldKey}
                onQSChange={onChange}
                onToggleDisable={onToggleDisable}
                placeholder={isGridInput ? undefined : 'Select or type to search...'}
                required={col.required}
                schemaQuery={col.lookup.schemaQuery}
                showLabel
                showLoading={false}
                value={value}
                valueColumn={col.lookup.keyColumn}
            />
            {error && <Alert>{error}</Alert>}
            {showDiscardPanel && <>{discardPanel}</>}
        </>
    );
});

SampleStatusInput.defaultProps = {
    api: getDefaultAPIWrapper(),
    formsy: true,
};
