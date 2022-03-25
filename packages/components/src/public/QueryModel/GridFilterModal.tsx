import React, { FC, memo, useCallback, useMemo, useState } from 'react';
import { Modal, Row } from 'react-bootstrap';
import { Filter, Query } from '@labkey/api';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../internal/APIWrapper';
import { FieldFilter } from '../../internal/components/search/models';
import { QueryColumn } from '../QueryColumn';
import { Alert } from '../../internal/components/base/Alert';
import { QueryFilterPanel } from '../../internal/components/search/QueryFilterPanel';
import { NOT_ANY_FILTER_TYPE } from '../../internal/url/NotAnyFilterType';
import { getFieldFiltersValidationResult, isValidFilterField } from '../../internal/components/search/utils';
import { QueryModel } from './QueryModel';

interface Props {
    api?: ComponentsAPIWrapper;
    fieldKey?: string;
    initFilters: Filter.IFilter[];
    model: QueryModel;
    onApply: (filters: Filter.IFilter[]) => void;
    onCancel: () => void;
    selectDistinctOptions?: Query.SelectDistinctOptions;
    skipDefaultViewCheck?: boolean; // for jest tests only due to lack of views from QueryInfo.fromJSON. check all fields, instead of only columns from default view
}

export const GridFilterModal: FC<Props> = memo(props => {
    const { api, onCancel, initFilters, model, onApply, fieldKey, selectDistinctOptions, skipDefaultViewCheck } = props;
    const { queryInfo } = model;
    const [filterError, setFilterError] = useState<string>(undefined);
    const [filters, setFilters] = useState<FieldFilter[]>(
        initFilters.map(filter => {
            return {
                fieldKey: filter.getColumnName(),
                filter,
            } as FieldFilter;
        })
    );

    const closeModal = useCallback(() => {
        onCancel();
    }, [onCancel]);

    const validDataTypeFilters = useMemo(() => {
        if (!filters) return null;

        const validFilters = filters.filter(fieldFilter => {
            const urlSuffix = fieldFilter?.filter?.getFilterType()?.getURLSuffix();
            return urlSuffix !== NOT_ANY_FILTER_TYPE.getURLSuffix() && urlSuffix !== '';
        });

        return validFilters;
    }, [filters]);

    const _onApply = useCallback(() => {
        const filterErrors = getFieldFiltersValidationResult(
            { [queryInfo.name.toLowerCase()]: filters },
            { [queryInfo.name.toLowerCase()]: queryInfo.title }
        );
        if (!filterErrors) {
            const validFilters = filters
                .filter(fieldFilter => {
                    const urlSuffix = fieldFilter?.filter?.getFilterType()?.getURLSuffix();
                    return urlSuffix !== NOT_ANY_FILTER_TYPE.getURLSuffix() && urlSuffix !== '';
                })
                .map(fieldFilter => fieldFilter.filter);
            onApply(validFilters);
        } else {
            setFilterError(filterErrors);
        }
    }, [filters, onApply, queryInfo]);

    const onFilterUpdate = useCallback(
        (field: QueryColumn, newFilter: Filter.IFilter) => {
            setFilterError(undefined);

            const activeFieldKey = field.getDisplayFieldKey();
            const updatedFilters = filters?.filter(fieldFilter => fieldFilter.fieldKey !== activeFieldKey) ?? [];

            if (newFilter !== null) {
                updatedFilters.push({
                    fieldKey: activeFieldKey,
                    fieldCaption: field.caption,
                    filter: newFilter,
                    jsonType: field.getDisplayFieldJsonType(),
                } as FieldFilter);
            }

            setFilters(updatedFilters);
        },
        [filters]
    );

    return (
        <Modal show bsSize="lg" onHide={closeModal}>
            <Modal.Header closeButton>
                <Modal.Title>Filter {queryInfo.title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Alert>{filterError}</Alert>
                <Row className="filter-modal__container">
                    <QueryFilterPanel
                        api={api}
                        fieldKey={fieldKey}
                        filters={{ [queryInfo.name.toLowerCase()]: filters }}
                        fullWidth
                        onFilterUpdate={onFilterUpdate}
                        queryInfo={queryInfo}
                        selectDistinctOptions={selectDistinctOptions}
                        skipDefaultViewCheck={skipDefaultViewCheck}
                        validFilterField={isValidFilterField}
                        viewName={model.viewName}
                    />
                </Row>
            </Modal.Body>
            <Modal.Footer>
                <div className="pull-left">
                    <button type="button" className="btn btn-default" onClick={closeModal}>
                        Cancel
                    </button>
                </div>
                <div className="pull-right">
                    <button
                        type="button"
                        className="btn btn-success"
                        onClick={_onApply}
                        disabled={Object.keys(validDataTypeFilters).length === 0}
                    >
                        Apply
                    </button>
                </div>
            </Modal.Footer>
        </Modal>
    );
});

GridFilterModal.defaultProps = {
    api: getDefaultAPIWrapper(),
};
