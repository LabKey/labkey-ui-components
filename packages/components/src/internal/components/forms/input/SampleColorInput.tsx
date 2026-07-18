/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, ReactNode } from 'react';
import { List } from 'immutable';
import { Filter } from '@labkey/api';

import { QueryColumn } from '../../../../public/QueryColumn';
import { QuerySelect, QuerySelectOwnProps } from '../QuerySelect';
import { LOOKUP_DEFAULT_SIZE } from '../../../constants';
import { NON_ARCHIVED_COLOR_FILTER } from '../../samples/constants';

import { InputRendererProps } from './types';

const COLOR_QUERY_FILTERS = List<Filter.IFilter>([NON_ARCHIVED_COLOR_FILTER]);

interface SampleColorInputProps extends Omit<QuerySelectOwnProps, 'schemaQuery' | 'valueColumn'> {
    col: QueryColumn;
    renderLabelField?: (col: QueryColumn) => ReactNode;
}

export const SampleColorInput: FC<SampleColorInputProps> = memo(props => {
    const { col, renderLabelField, ...querySelectProps } = props;

    return (
        <>
            {renderLabelField?.(col)}
            <QuerySelect
                containerPath={col.lookup.containerPath}
                description={col.description}
                displayColumn={col.lookup.displayColumn}
                formsy
                label={col.caption}
                maxRows={LOOKUP_DEFAULT_SIZE}
                multiple={false}
                name={col.fieldKey}
                openMenuOnFocus
                required={col.required}
                showLoading={false}
                {...querySelectProps}
                queryFilters={COLOR_QUERY_FILTERS}
                schemaQuery={col.lookup.schemaQuery}
                valueColumn={col.lookup.keyColumn}
            />
        </>
    );
});

SampleColorInput.displayName = 'SampleColorInput';

export const SampleColorInputRenderer: FC<InputRendererProps> = memo(props => {
    const {
        allowFieldDisable,
        col,
        containerPath,
        formsy,
        initiallyDisabled,
        onSelectChange,
        onToggleDisable,
        renderLabelField,
        selectInputProps,
        showAsteriskSymbol,
        value,
        fieldWithMixedValues,
    } = props;

    const hasMixedValue = fieldWithMixedValues?.includes(col.name.toLowerCase());

    return (
        <SampleColorInput
            {...selectInputProps}
            addLabelAsterisk={showAsteriskSymbol}
            allowDisable={allowFieldDisable}
            col={col}
            containerPath={containerPath}
            formsy={formsy}
            hasMixedValue={hasMixedValue}
            initiallyDisabled={initiallyDisabled}
            onQSChange={onSelectChange}
            onToggleDisable={onToggleDisable}
            renderLabelField={renderLabelField}
            value={value}
        />
    );
});

SampleColorInputRenderer.displayName = 'SampleColorInputRenderer';
