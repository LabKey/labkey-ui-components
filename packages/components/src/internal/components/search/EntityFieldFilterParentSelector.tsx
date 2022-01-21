import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Col, Row, Nav, NavItem, Tab } from 'react-bootstrap';
import { List } from "immutable";

import { Filter } from "@labkey/api";

import { EntityDataType, IEntityTypeOption } from "../entities/models";
import { getEntityTypeOptions } from "../entities/actions";
import { QueryColumn } from "../../../public/QueryColumn";
import { getQueryDetails } from "../../query/api";
import { LoadingSpinner } from "../base/LoadingSpinner";
import { ChoicesListItem } from "../base/ChoicesListItem";
import { FilterFacetedSelector } from "./FilterFacetedSelector";
import { FilterExpressionView } from "./FilterExpressionView";

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

    const onFieldClick = useCallback((queryColumn: QueryColumn) => {
        setActiveField(queryColumn);

        if (activeTab === EntityFieldFilterTabs.ChooseValues) {
            if (!queryColumn.allowFaceting())
                setActiveTab(EntityFieldFilterTabs.Filter);
        }

    }, [entityDataType, activeParent, activeTab, setActiveTab]);

    const onTabChange = useCallback((tabKey: any) => {
        setActiveTab(tabKey);
    }, []);

    return (
        <Row className="search-parent-entity-panel">
            <Col xs={3} className="search-parent-entity-col">
                <div className="search-field-col-title">{entityDataType.nounAsParentPlural ?? entityDataType.nounPlural}</div>
                {!entityParents && <LoadingSpinner/>}
                <div className="list-group search-parent-entity-col-div">
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
            <Col xs={3} className="search-parent-entity-col">
                <div className="search-field-col-title">Fields</div>
                {(activeParent && !entityFields) && <LoadingSpinner/>}
                <div className="list-group search-parent-entity-col-div">
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
            <Col xs={6} className="search-parent-entity-col">
                <div className="search-field-col-title">Values</div>
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
                                            fieldFilter={null} //TODO find the field filter
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
    );
});

