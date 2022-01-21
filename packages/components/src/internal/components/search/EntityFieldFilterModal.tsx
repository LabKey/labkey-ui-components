import React, {FC, memo, useCallback, useEffect, useMemo, useState} from 'react';
import {Col, Modal, Nav, NavItem, Row, Tab} from 'react-bootstrap';
import {List} from "immutable";

import { Filter } from '@labkey/api';

import {EntityDataType, IEntityTypeOption} from '../entities/models';
import { capitalizeFirstChar } from '../../util/utils';
import {LoadingSpinner} from "../base/LoadingSpinner";
import {ChoicesListItem} from "../base/ChoicesListItem";
import {FilterExpressionView} from "./FilterExpressionView";
import {FilterFacetedSelector} from "./FilterFacetedSelector";
import {getEntityTypeOptions} from "../entities/actions";
import {getQueryDetails} from "../../query/api";
import {QueryColumn} from "../../../public/QueryColumn";
import {Alert} from "../base/Alert";
import {FieldFilter} from "./models";


interface Props {
    entityDataType: EntityDataType;
    onCancel: () => void;
    onFind: (schemaName: string, dataTypeFilters : {[key: string] : FieldFilter[]}) => void;
}

export enum EntityFieldFilterTabs {
    Filter = "Filter",
    ChooseValues = "Choose values"
}

export const EntityFieldFilterModal: FC<Props> = memo(props => {
    const { entityDataType, onCancel, onFind } = props;

    const capParentNoun = capitalizeFirstChar(entityDataType.nounAsParentSingular);

    const [entityParents, setEntityParents] = useState<IEntityTypeOption[]>(undefined);
    const [activeParent, setActiveParent] = useState<string>(undefined);
    const [activeField, setActiveField] = useState<QueryColumn>(undefined);
    const [entityFields, setEntityFields] = useState<List<QueryColumn>>(undefined);
    const [activeTab, setActiveTab] = useState<EntityFieldFilterTabs>(EntityFieldFilterTabs.Filter);
    const [filterError, setFilterError] = useState<string>(undefined);

    const [dataTypeFilters, setDataTypeFilters] = useState<{[key: string] : FieldFilter[]}>({});

    useEffect(() => {
        getEntityTypeOptions(entityDataType)
            .then(results => {
                const parents = [];
                results.map(result => {
                    result.map(res => {
                        parents.push(res);
                    })

                })
                setEntityParents(parents);
            })
            .catch()
    }, [entityDataType]);

    const onEntityClick = useCallback(async (queryName) => {
        setActiveParent(queryName);
        setEntityFields(undefined);
        setActiveField(undefined);
        try {
            const queryInfo = await getQueryDetails({schemaName: entityDataType.instanceSchemaName, queryName});
            const fields = queryInfo.getDisplayColumns();
            setEntityFields(fields);
        }
        catch (e) {
            // TODO
        }

    }, [entityDataType]);

    const onFieldClick = useCallback((queryColumn: QueryColumn) => {
        // check if current filter is valid, if not, remove

        setActiveField(queryColumn);

        if (activeTab === EntityFieldFilterTabs.ChooseValues) {
            if (!queryColumn.allowFaceting())
                setActiveTab(EntityFieldFilterTabs.Filter);
        }

    }, [entityDataType, activeParent, activeTab, setActiveTab]);

    const onTabChange = useCallback((tabKey: any) => {
        setActiveTab(tabKey);
    }, []);

    const closeModal = useCallback(() => {
        onCancel();
    }, [onCancel]);

    const _onFind = useCallback(() => {
        let errorMsg = 'Invalid/incomplete filter values. Please correct input for fields. ', hasError = false, parentFields = {};
        Object.keys(dataTypeFilters).forEach(parent => {
            const filters = dataTypeFilters[parent];
            filters.forEach(fieldFilter => {
                const filter = fieldFilter.filter;
                if (filter.getFilterType().isDataValueRequired()) {
                    const value = filter.getValue();
                    const isBetween = ['between', 'notbetween'].indexOf(filter.getFilterType().getURLSuffix()) > -1;
                    let fieldError = false;
                    if (value === undefined || value === null) {
                        fieldError = true;
                    }
                    else if (isBetween) {
                        if (value.indexOf(',') === -1)
                            fieldError = true;
                    }

                    if (fieldError == true) {
                        hasError = true;
                        let fields = parentFields[parent] ?? [];
                        fields.push(fieldFilter.fieldCaption);
                        parentFields[parent] = fields;
                    }
                }
            })
        });
        // TODO Filter array will be populated from choices here
        if (!hasError)
            onFind(entityDataType.instanceSchemaName, dataTypeFilters);
        else {
            Object.keys(parentFields).forEach(parent => {
                errorMsg += parent + ': ' + parentFields[parent].join(", ") + '.';

            })
            setFilterError(errorMsg);
        }

    }, [onFind, dataTypeFilters]);

    const currentFieldFilter = useMemo(()=> {
        if (!dataTypeFilters || !activeField)
            return null;

        const activeParentFilters : FieldFilter[] = dataTypeFilters[activeParent];
        return activeParentFilters?.find((filter) => filter.filter.getColumnName() === activeField.fieldKey)
    }, [activeField, activeParent, dataTypeFilters]);

    const onFilterUpdate = useCallback((newFilter: Filter.IFilter) => {
        const dataTypeFiltersUpdated = {...dataTypeFilters};
        const activeParentFilters : FieldFilter[] = dataTypeFiltersUpdated[activeParent];
        let newParentFilters = activeParentFilters?.filter((filter) => filter.filter.getColumnName() != activeField.fieldKey) ?? [];

        if (newFilter != null)
            newParentFilters.push({
                fieldKey: activeField.fieldKey,
                fieldCaption: activeField.caption,
                filter: newFilter
            });

        if (newParentFilters?.length >= 0)
            dataTypeFiltersUpdated[activeParent] = newParentFilters;
        else
            delete dataTypeFiltersUpdated[activeParent];

        setDataTypeFilters(dataTypeFiltersUpdated);
        setFilterError(undefined);
    }, [dataTypeFilters, activeParent, activeField]);

    const filterStatus = useMemo(()=> {
        let status = {};
        if (!dataTypeFilters)
            return {};


        Object.keys(dataTypeFilters).forEach((parent) => {
            const parentFilters = dataTypeFilters[parent];
            parentFilters.forEach(filter => {
                const key = parent + '-' + filter.filter.getColumnName();
                status[key] = true;
            })

        });

        return status;
    }, [activeField, activeParent, dataTypeFilters]);

    // TODO when populating types, adjust container filter to include the proper set of sample types
    //  (current + project + shared, in most cases).  For LKB, check if we should filter out any of the
    //  registry data types or the media types.

    return (
        <Modal show bsSize="lg" onHide={closeModal}>
            <Modal.Header closeButton>
                <Modal.Title>Select Sample {capParentNoun} Properties</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {filterError && <Alert>{filterError}</Alert>}
                <Row className="search-parent-entity-panel">
                    <Col xs={3} className="search-parent-entity-col">
                        <div className="search-field-col-title">{entityDataType.nounAsParentPlural ?? entityDataType.nounPlural}</div>
                        {!entityParents && <LoadingSpinner/>}
                        <div className="list-group search-parent-entity-col-div">
                            {entityParents?.map((parent, index) => {
                                const { label } = parent;
                                const fieldFilterCount = dataTypeFilters?.[label]?.length;
                                return <ChoicesListItem
                                    active={label === activeParent}
                                    index={index}
                                    key={parent.rowId + ''}
                                    label={label}
                                    onSelect={() => onEntityClick(label)}
                                    componentRight={
                                        (fieldFilterCount !== 0) && <span className="pull-right field_count_circle">{fieldFilterCount}</span>
                                    }
                                />
                            })}
                        </div>
                    </Col>
                    <Col xs={3} className="search-parent-entity-col">
                        <div className="search-field-col-title">Fields</div>
                        {!activeParent && <div className='search-field-empty-panel-msg'>No {entityDataType.nounAsParentPlural ?? entityDataType.nounPlural} selected.</div>}
                        {(activeParent && !entityFields) && <LoadingSpinner/>}
                        {
                            activeParent &&
                            <div className="list-group search-parent-entity-col-div">
                                {entityFields?.map((field, index) => {
                                    const { fieldKey, caption } = field;
                                    const hasFilter = filterStatus?.[activeParent + '-' + fieldKey];
                                    return <ChoicesListItem
                                        active={fieldKey === activeField?.fieldKey}
                                        index={index}
                                        key={fieldKey}
                                        label={caption}
                                        onSelect={() => onFieldClick(field)}
                                        componentRight={
                                            hasFilter && <span className="pull-right search_field_dot"/>
                                        }
                                    />
                                })}
                            </div>
                        }
                    </Col>
                    <Col xs={6} className="search-parent-entity-col">
                        <div className="search-field-col-title">Values</div>
                        {(activeParent && !activeField) && <div className='search-field-empty-panel-msg'>No field selected.</div>}
                        {(activeParent && activeField) &&
                            <div className="search-parent-entity-col-div">
                                <Tab.Container
                                    activeKey={activeTab}
                                    className="search-field-tabs content-tabs"
                                    id="search-field-tabs"
                                    onSelect={(key) => onTabChange(key)}
                                >
                                    <div>
                                        <Nav bsStyle="tabs">
                                            <NavItem eventKey={EntityFieldFilterTabs.Filter}>Filter</NavItem>
                                            {(!activeField || activeField?.allowFaceting()) &&
                                                <NavItem eventKey={EntityFieldFilterTabs.ChooseValues}>Choose values</NavItem>}
                                        </Nav>
                                        <Tab.Content animation>
                                            <Tab.Pane eventKey={EntityFieldFilterTabs.Filter}>
                                                <div className="search-field-col-sub-title">Find values for {activeField.caption}</div>
                                                <FilterExpressionView
                                                    key={activeField.fieldKey}
                                                    field={activeField}
                                                    fieldFilter={currentFieldFilter?.filter}
                                                    onFieldFilterUpdate={onFilterUpdate}
                                                />
                                            </Tab.Pane>
                                            <Tab.Pane eventKey={EntityFieldFilterTabs.ChooseValues}>
                                                <div className="search-field-col-sub-title">Find values for {activeField.caption}</div>
                                                {
                                                    activeField?.allowFaceting() &&
                                                    <FilterFacetedSelector
                                                        selectDistinctOptions={
                                                            {
                                                                column: activeField?.fieldKey,
                                                                // containerFilter: model.containerFilter,
                                                                // containerPath: model.containerPath,
                                                                schemaName: entityDataType?.instanceSchemaName,
                                                                queryName: activeParent,
                                                                viewName: "",
                                                                filterArray: [], //TODO use active filters to filter distinct values, but exclude filters on current field
                                                                parameters: null, //TODO use active parameters to filter distinct values
                                                            }
                                                        }
                                                    />
                                                }
                                            </Tab.Pane>
                                        </Tab.Content>
                                    </div>
                                </Tab.Container>
                            </div>
                        }
                    </Col>
                </Row>
            </Modal.Body>
            <Modal.Footer>
                <div className="pull-left">
                    <button type="button" className="btn btn-default" onClick={closeModal}>
                        Cancel
                    </button>
                </div>

                <div className="pull-right">
                    <button type="button" className="btn btn-success" onClick={_onFind} disabled={Object.keys(dataTypeFilters).length === 0}>
                        Find Samples
                    </button>
                </div>
            </Modal.Footer>
        </Modal>
    );
});
