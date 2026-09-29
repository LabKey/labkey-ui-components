/*
 * Copyright (c) 2022-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, useCallback, useMemo, useState } from 'react';
import { Filter, Query } from '@labkey/api';

import { Modal } from '../../internal/Modal';
import { EntityFieldFilter } from '../../internal/components/search/models';
import { QueryColumn } from '../QueryColumn';

import { Alert } from '../../internal/components/base/Alert';
import { QueryFilterPanel } from '../../internal/components/search/QueryFilterPanel';
import { NOT_ANY_FILTER_TYPE } from '../../internal/url/NotAnyFilterType';
import { getFieldFiltersValidationResult, isValidFilterField } from '../../internal/components/search/utils';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../internal/APIWrapper';

import { QueryModel } from './QueryModel';
import { filtersEqual } from './utils';
import { composeFieldToFilter } from './search/utils';

/** A filter to pre-fill on whichever field is active, until the user edits it. Ops are keyed by display fieldKey. */
export interface FilterDraft {
    ops: Record<string, string>;
    value: string;
}

function createDraftFilter(draft: FilterDraft, field: QueryColumn, filters: EntityFieldFilter[]): EntityFieldFilter {
    const fieldKey = field?.getDisplayFieldKey();
    const op = draft.ops[fieldKey];
    // Leave fields that already carry a filter alone rather than silently adding a second condition
    if (!op || filters.some(fieldFilter => fieldFilter.fieldKey === fieldKey)) return undefined;

    return {
        fieldCaption: field.caption,
        fieldKey,
        filter: composeFieldToFilter({ fieldKey, op }, draft.value),
        jsonType: field.getDisplayFieldJsonType(),
    } as EntityFieldFilter;
}

interface Props {
    api?: ComponentsAPIWrapper;
    fieldKey?: string;
    // Limits the field list, e.g. to the columns a search suggestion picked
    fields?: QueryColumn[];
    initFilters: Filter.IFilter[];
    initialDraft?: FilterDraft;
    model: QueryModel;
    onApply: (filters: Filter.IFilter[]) => void;
    onCancel: () => void;
    selectDistinctOptions?: Partial<Query.SelectDistinctOptions>;
    skipDefaultViewCheck?: boolean; // for jest tests only due to lack of views from QueryInfo.fromJSON. check all fields, instead of only columns from default view
}

export const GridFilterModal: FC<Props> = memo(props => {
    const {
        api = getDefaultAPIWrapper(),
        onCancel,
        initFilters,
        model,
        onApply,
        fieldKey,
        fields,
        initialDraft,
        selectDistinctOptions,
        skipDefaultViewCheck,
    } = props;
    const { queryInfo } = model;
    const [filterError, setFilterError] = useState<string>(undefined);
    const [initialState] = useState(() => {
        const initial = initFilters.map(filter => {
            return {
                fieldKey: filter.getColumnName(),
                filter,
            } as EntityFieldFilter;
        });
        const draftFilter = initialDraft
            ? createDraftFilter(
                  initialDraft,
                  fields?.find(field => field.getDisplayFieldKey() === fieldKey),
                  initial
              )
            : undefined;
        return { draftFilter, filters: draftFilter ? [...initial, draftFilter] : initial };
    });
    const [filters, setFilters] = useState<EntityFieldFilter[]>(initialState.filters);
    // The unedited draft, which follows the active field; undefined once the user edits it or when there is none
    const [draftFilter, setDraftFilter] = useState<EntityFieldFilter>(initialState.draftFilter);
    const [draftActive, setDraftActive] = useState<boolean>(!!initialDraft);

    const closeModal = useCallback(() => {
        onCancel();
    }, [onCancel]);

    const validFieldFilters = useMemo(() => {
        if (!filters) return null;

        return filters.filter(fieldFilter => {
            const filterType = fieldFilter?.filter?.getFilterType();
            const urlSuffix = filterType?.getURLSuffix();
            if (urlSuffix.toLowerCase().startsWith('array')) {
                if (filterType.isMultiValued()) {
                    const filterValue = fieldFilter.filter.getValue();
                    // GitHub Issue 987: Multi value filter dialog lets you edit and save without any selected values
                    if (!filterValue || (Array.isArray(filterValue) && filterValue.length === 0)) {
                        return false;
                    }
                }
                return true;
            }
            return urlSuffix !== NOT_ANY_FILTER_TYPE.getURLSuffix() && urlSuffix !== '';
        });
    }, [filters]);

    const _onApply = useCallback(() => {
        const filterErrors = getFieldFiltersValidationResult({ [queryInfo.name.toLowerCase()]: filters });
        if (!filterErrors) {
            onApply(validFieldFilters.map(fieldFilter => fieldFilter.filter));
        } else {
            setFilterError(filterErrors);
        }
    }, [filters, onApply, queryInfo, validFieldFilters]);

    const onFilterUpdate = useCallback(
        (field: QueryColumn, newFilters: Filter.IFilter[], index: number) => {
            setFilterError(undefined);

            const activeFieldKey = field.getDisplayFieldKey();
            const updatedFilters = filters?.filter(fieldFilter => fieldFilter.fieldKey !== activeFieldKey) ?? [];

            // Inputs may echo the seeded draft back on mount, which doesn't count as an edit
            const isDraftEcho =
                newFilters?.length === 1 && draftFilter && filtersEqual(newFilters[0], draftFilter.filter);
            if (draftFilter?.fieldKey === activeFieldKey && !isDraftEcho) {
                setDraftFilter(undefined);
                setDraftActive(false);
            }

            if (newFilters) {
                newFilters
                    ?.filter(newFilter => newFilter !== null)
                    .forEach(newFilter => {
                        updatedFilters.push({
                            fieldKey: activeFieldKey,
                            fieldCaption: field.caption,
                            filter: newFilter,
                            jsonType: field.getDisplayFieldJsonType(),
                        } as EntityFieldFilter);
                    });
            }

            setFilters(updatedFilters);
        },
        [draftFilter, filters]
    );

    const onActiveFieldChange = useCallback(
        (field: QueryColumn) => {
            if (!draftActive || field.getDisplayFieldKey() === draftFilter?.fieldKey) return;

            // Drafts are only seeded on fields with no other filter, so every filter on the draft's field is the draft
            const withoutDraft = draftFilter
                ? filters.filter(fieldFilter => fieldFilter.fieldKey !== draftFilter.fieldKey)
                : filters;
            const movedDraft = createDraftFilter(initialDraft, field, withoutDraft);
            setFilters(movedDraft ? [...withoutDraft, movedDraft] : withoutDraft);
            setDraftFilter(movedDraft);
        },
        [draftActive, draftFilter, filters, initialDraft]
    );
    const canConfirm = validFieldFilters && Object.keys(validFieldFilters).length > 0;
    return (
        <Modal
            bsSize="lg"
            canConfirm={canConfirm}
            confirmText="Apply"
            onCancel={closeModal}
            onConfirm={_onApply}
            title={`Filter ${queryInfo.title}`}
        >
            <Alert>{filterError}</Alert>
            <QueryFilterPanel
                api={api}
                asRow
                fieldKey={fieldKey}
                fields={fields}
                filters={{ [queryInfo.name.toLowerCase()]: filters }}
                fullWidth
                onActiveFieldChange={onActiveFieldChange}
                onFilterUpdate={onFilterUpdate}
                preferFilterTabFieldKey={draftFilter?.fieldKey}
                queryInfo={queryInfo}
                selectDistinctOptions={selectDistinctOptions}
                skipDefaultViewCheck={skipDefaultViewCheck}
                validFilterField={isValidFilterField}
                viewName={model.viewName}
            />
        </Modal>
    );
});

GridFilterModal.displayName = 'GridFilterModal';
