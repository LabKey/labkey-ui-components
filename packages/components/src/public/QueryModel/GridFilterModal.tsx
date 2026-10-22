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
import { OnFilterUpdate, QueryFilterPanel } from '../../internal/components/search/QueryFilterPanel';
import { NOT_ANY_FILTER_TYPE } from '../../internal/url/NotAnyFilterType';
import { getFieldFiltersValidationResult, isValidFilterField } from '../../internal/components/search/utils';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../internal/APIWrapper';

import { QueryModel } from './QueryModel';
import { filtersEqual } from './utils';
import { composeFieldToFilter } from './search/utils';

/** A filter to pre-fill on whichever field is active, until it is applied. Ops are keyed by display fieldKey. */
export interface FilterDraft {
    ops: Record<string, string>;
    value: string;
}

function toFieldFilter(field: QueryColumn, filter: Filter.IFilter): EntityFieldFilter {
    return {
        fieldCaption: field.caption,
        fieldKey: field.getDisplayFieldKey(),
        filter,
        jsonType: field.getDisplayFieldJsonType(),
    } as EntityFieldFilter;
}

function createDraftFilter(draft: FilterDraft, field: QueryColumn): EntityFieldFilter {
    const fieldKey = field?.getDisplayFieldKey();
    const op = draft.ops[fieldKey];
    if (!op) return undefined;

    return toFieldFilter(field, composeFieldToFilter({ fieldKey, op }, draft.value));
}

// An edited draft keeps its operator: a compose suggestion's fields share a value type
function moveDraft(
    draft: FilterDraft,
    fromFieldKey: string,
    current: Filter.IFilter,
    field: QueryColumn
): EntityFieldFilter {
    if (!current) return undefined;

    const fromOp = draft.ops[fromFieldKey];
    if (fromOp && filtersEqual(current, composeFieldToFilter({ fieldKey: fromFieldKey, op: fromOp }, draft.value))) {
        return createDraftFilter(draft, field);
    }

    return toFieldFilter(field, Filter.create(field.getDisplayFieldKey(), current.getValue(), current.getFilterType()));
}

const isOnField = (fieldFilter: EntityFieldFilter, fieldKey: string): boolean =>
    fieldFilter.fieldKey.toLowerCase() === fieldKey.toLowerCase();

// The draft stands in for its field's filters, which come back once the draft moves to another field
function placeDraft(
    filters: EntityFieldFilter[],
    initial: EntityFieldFilter[],
    fromFieldKey: string,
    to: EntityFieldFilter
): EntityFieldFilter[] {
    let placed = filters;
    if (fromFieldKey) {
        placed = placed
            .filter(fieldFilter => !isOnField(fieldFilter, fromFieldKey))
            .concat(initial.filter(fieldFilter => isOnField(fieldFilter, fromFieldKey)));
    }
    if (to) {
        placed = placed.filter(fieldFilter => !isOnField(fieldFilter, to.fieldKey)).concat(to);
    }
    return placed;
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
        const initial = initFilters.map<EntityFieldFilter>(filter => ({ fieldKey: filter.getColumnName(), filter }));

        let draftFilter: EntityFieldFilter;
        if (initialDraft) {
            draftFilter = createDraftFilter(
                initialDraft,
                fields?.find(field => field.getDisplayFieldKey() === fieldKey)
            );
        }
        return {
            draftFieldKey: draftFilter?.fieldKey,
            filters: placeDraft(initial, initial, undefined, draftFilter),
            initial,
        };
    });
    const [filters, setFilters] = useState<EntityFieldFilter[]>(initialState.filters);
    // The field holding the draft, which follows the active field; undefined once the user makes it their own
    // filter there (a second expression or Choose values), or when there is none
    const [draftFieldKey, setDraftFieldKey] = useState<string>(initialState.draftFieldKey);

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

    const onFilterUpdate = useCallback<OnFilterUpdate>(
        (field, newFilters) => {
            setFilterError(undefined);

            const activeFieldKey = field.getDisplayFieldKey();
            const updatedFilters = filters?.filter(fieldFilter => fieldFilter.fieldKey !== activeFieldKey) ?? [];

            if (activeFieldKey === draftFieldKey && newFilters?.filter(newFilter => newFilter !== null).length > 1) {
                setDraftFieldKey(undefined);
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
        [draftFieldKey, filters]
    );

    const onActiveFieldChange = useCallback(
        (field: QueryColumn) => {
            const toFieldKey = field.getDisplayFieldKey();
            if (!draftFieldKey || toFieldKey === draftFieldKey) return;

            const current = filters.find(fieldFilter => isOnField(fieldFilter, draftFieldKey))?.filter;
            const movedDraft = moveDraft(initialDraft, draftFieldKey, current, field);
            setFilters(placeDraft(filters, initialState.initial, draftFieldKey, movedDraft));
            setDraftFieldKey(toFieldKey);
        },
        [draftFieldKey, filters, initialDraft, initialState]
    );

    const onChooseValues = useCallback(() => {
        setDraftFieldKey(undefined);
    }, []);

    return (
        <Modal
            bsSize="lg"
            canConfirm={validFieldFilters && Object.keys(validFieldFilters).length > 0}
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
                onChooseValues={onChooseValues}
                onFilterUpdate={onFilterUpdate}
                preferFilterTabFieldKey={draftFieldKey}
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
