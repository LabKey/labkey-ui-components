import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Col, Row, Nav, NavItem, Tab } from 'react-bootstrap';
import { List } from "immutable";

import { Filter, Query } from "@labkey/api";

import { EntityDataType, IEntityTypeOption } from "../entities/models";
import { getEntityTypeOptions } from "../entities/actions";
import { QueryColumn } from "../../../public/QueryColumn";
import { getQueryDetails } from "../../query/api";
import { LoadingSpinner } from "../base/LoadingSpinner";
import { ChoicesListItem } from "../base/ChoicesListItem";
import { naturalSort } from "../../../public/sort";

interface FieldFilters {
    fieldKey: string;
    filters: Filter.IFilter[]
}

interface ParentFilter {
    schemaName: string;
    queryName: string;
    fieldFilters: FieldFilters[];
}

interface Props {
    entityDataType: EntityDataType
    parentFilters?: ParentFilter[]
    onParentSelect?: () => any;
    onFieldSelect?: () => any;
}

export enum EntityFieldFilterTabs {
    Filter = "Filter",
    ChooseValues = "Choose values"
}

export const EntityFieldFilterParentSelector: FC<Props> = memo(props => {
    const { entityDataType, parentFilters, onParentSelect, onFieldSelect } = props;

    const [entityParents, setEntityParents] = useState<IEntityTypeOption[]>(undefined);
    const [activeParent, setActiveParent] = useState<string>(undefined);
    const [activeField, setActiveField] = useState<QueryColumn>(undefined);
    const [entityFields, setEntityFields] = useState<List<QueryColumn>>(undefined);
    const [activeFieldDistinctValues, setActiveFieldDistinctValues] = useState<any[]>(undefined);
    const [activeTab, setActiveTab] = useState<EntityFieldFilterTabs>(EntityFieldFilterTabs.Filter);

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
        setEntityFields(undefined);
        setActiveFieldDistinctValues(undefined);
        setActiveParent(queryName);
        // onParentSelect(queryName);
        try {
            const queryInfo = await getQueryDetails({schemaName: entityDataType.instanceSchemaName, queryName});
            const fields = queryInfo.getDisplayColumns();
            setEntityFields(fields);
        }
        catch (e) {
            // TODO
        }

    }, [onParentSelect, entityDataType]);

    const loadDistinctValues = useCallback((falseReload?: boolean) => {
        if (activeFieldDistinctValues && !falseReload)
            return;

        const options = {
            column: activeField.fieldKey,
            // containerFilter: model.containerFilter,
            // containerPath: model.containerPath,
            schemaName: entityDataType.instanceSchemaName,
            queryName: activeParent,
            viewName: "",
            filterArray: [], //TODO use active filters to filter distinct values, but exclude filters on current field
            parameters: null, //TODO use active parameters to filter distinct values
        };

        Query.selectDistinctRows({
            ...options,
            success: result => {
                const distinctValues = result.values.sort(naturalSort);
                setActiveFieldDistinctValues(distinctValues);
            },
            failure: error => {
                //TODO
            }
        });
    }, [activeFieldDistinctValues, activeField, entityDataType, activeParent]);

    const onFieldClick = useCallback((queryColumn: QueryColumn) => {
        setActiveField(queryColumn);
        setActiveFieldDistinctValues(undefined);

        if (activeTab === EntityFieldFilterTabs.ChooseValues) {
            if (queryColumn.allowFaceting())
                loadDistinctValues(true);
            else
                setActiveTab(EntityFieldFilterTabs.Filter);
        }

    }, [entityDataType, activeParent, loadDistinctValues, activeTab, setActiveTab]);

    const onTabChange = useCallback((tabKey: any) => {
        setActiveTab(tabKey);
        if (tabKey === EntityFieldFilterTabs.ChooseValues)
            loadDistinctValues();
    }, [loadDistinctValues]);

    return (
        <Row className="search-parent-entity-panel">
            <Col xs={3}>
                <div className="search-parent-entity-col-title">{entityDataType.nounAsParentPlural ?? entityDataType.nounPlural}</div>
                {!entityParents && <LoadingSpinner/>}
                <div className="list-group search-parent-entity-col">
                    {entityParents?.map((parent, index) => {
                            const { label } = parent;
                            const fieldFilterCount = index%3; //TODO
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
            <Col xs={3}>
                <div className="search-parent-entity-col-title">Fields</div>
                {(activeParent && !entityFields) && <LoadingSpinner/>}
                <div className="list-group search-parent-entity-col">
                    {entityFields?.map((field, index) => {
                        const { fieldKey, caption } = field;
                        const hasFilter = index%4 === 0; //TODO
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
            </Col>
            <Col xs={6}>
                <div className="search-parent-entity-col-title">Values</div>
                {(activeParent && activeField) &&
                    <Tab.Container
                        activeKey={activeTab}
                        className="storage-detail-tabs content-tabs"
                        id="storage-detail-tabs"
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
                                    {'TODO'}
                                </Tab.Pane>
                                <Tab.Pane eventKey={EntityFieldFilterTabs.ChooseValues}>
                                    {(!activeFieldDistinctValues && activeField?.allowFaceting()) && <LoadingSpinner/>}
                                    {
                                        activeField?.allowFaceting() &&
                                        <div className="list-group search-parent-entity-col">
                                            <ul className="nav nav-stacked labkey-wizard-pills">
                                                {activeFieldDistinctValues?.map((value, index) => {
                                                    let displayValue = value;
                                                    if (value === null || value === undefined)
                                                        displayValue = '[blank]';
                                                    if (value === true)
                                                        displayValue = 'TRUE';
                                                    if (value === false)
                                                        displayValue = 'FALSE';
                                                    return (
                                                        <li key={index}>
                                                            <div className="form-check">
                                                                <input className="form-check-input"
                                                                       type="checkbox"
                                                                       name={'field-value-' + index}
                                                                       disabled={true}
                                                                       checked={false}/>
                                                                <span style={{marginLeft: 5}}>{displayValue}</span>
                                                            </div>
                                                        </li>
                                                    )
                                                })}
                                            </ul>
                                        </div>
                                    }
                                </Tab.Pane>
                            </Tab.Content>
                        </div>
                    </Tab.Container>
                }
            </Col>
        </Row>

    );
});

