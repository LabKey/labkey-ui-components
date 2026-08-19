/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, ReactNode, useMemo } from 'react';
import { List } from 'immutable';
import { Filter } from '@labkey/api';

import { QueryColumn } from '../../../../public/QueryColumn';
import { QuerySelect, QuerySelectOptionProps, QuerySelectOwnProps } from '../QuerySelect';
import { LOOKUP_DEFAULT_SIZE } from '../../../constants';
import { NON_ARCHIVED_COLOR_FILTER } from '../../samples/constants';

import { InputRendererProps } from './types';
import { caseInsensitive } from '../../../util/utils';
import { ColorIcon } from '../../base/ColorIcon';

const SampleColorSelectOption: FC<QuerySelectOptionProps> = memo(({ row, label }) => {
    // color is available here because QuerySelect includes identifying fields (see exp.DataColor ~~identifyingfields~~.qview.xml file)
    const colorVal = caseInsensitive(row, 'Color')?.value;
    return (
        <div className="sample-color-select-option">
            <ColorIcon label={label} useSmall value={colorVal} />
        </div>
    );
});
SampleColorSelectOption.displayName = 'SampleColorSelectOption';

interface SampleColorInputProps extends Omit<QuerySelectOwnProps, 'schemaQuery' | 'valueColumn'> {
    col: QueryColumn;
    queryFilters?: List<Filter.IFilter>;
    renderLabelField?: (col: QueryColumn) => ReactNode;
}

export const SampleColorInput: FC<SampleColorInputProps> = memo(props => {
    const { col, renderLabelField, queryFilters, ...querySelectProps } = props;

    const filters = useMemo(() => {
        let result = List<Filter.IFilter>([NON_ARCHIVED_COLOR_FILTER]);
        if (queryFilters && !queryFilters.isEmpty()) {
            result = result.concat(queryFilters).toList();
        }
        return result;
    }, [queryFilters]);

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
                OptionComponent={SampleColorSelectOption}
                queryFilters={filters}
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
        queryFilters,
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
            queryFilters={caseInsensitive(queryFilters, col.name)}
            renderLabelField={renderLabelField}
            value={value}
        />
    );
});

SampleColorInputRenderer.displayName = 'SampleColorInputRenderer';
