import React from 'react';
import { QueryGridPanel } from '../QueryGridPanel';
import {
    capitalizeFirstChar,
    EntityDataType,
    getQueryGridModel,
    getStateQueryGridModel,
    gridInit,
    QueryGridModel,
    SchemaQuery
} from '../..';
import { List, Map } from 'immutable';
import { Filter } from '@labkey/api';
import { DETAIL_TABLE_CLASSES } from '../forms/constants';

interface Props {
    index: number
    parentDataType: EntityDataType
    parentValue: Map<string, any>
    parentTypeQueryName: string
    requiredColumns?: List<string>
    omittedColumns?: List<string>
}

export class SingleParentEntityPanel extends React.Component<Props, any> {

    componentWillMount() {
        this.init();
    }

    init() {
        const model = this.getParentModel();
        gridInit(model, true, this);
    }

    getParentModel() : QueryGridModel {
        const { parentDataType, parentTypeQueryName, parentValue, index } = this.props;

        const model = getStateQueryGridModel('parent-data-' + index, SchemaQuery.create(parentDataType.instanceSchemaName, parentTypeQueryName), {
            bindURL: false,
            allowSelection: false,
            baseFilters: List([Filter.create("LSID", parentValue.get('value'))]),
            requiredColumns: this.props.requiredColumns || List<string>(),
            omittedColumns: this.props.omittedColumns || List<string>(),
        });
        return getQueryGridModel(model.getId()) || model;
    }

    renderParentHeader() {
        const { parentDataType, parentTypeQueryName, parentValue } = this.props;

        return (
            <table className={DETAIL_TABLE_CLASSES}>
                <tbody>
                        <tr key={'type-name'}>
                            <td>{parentDataType.typeNounSingular}</td>
                            <td >
                                {parentTypeQueryName}
                            </td>
                        </tr>
                        <tr key={'parent-id'}>
                            <td>{capitalizeFirstChar(parentDataType.nounSingular) + " ID"}</td>
                            <td >
                                <a href={parentValue.get('url')}>{parentValue.get('displayValue')}</a>
                            </td>
                        </tr>
                </tbody>
            </table>
        )
    }

    render() {
        const model = this.getParentModel();

        return (
            <>
                {this.renderParentHeader()}
                <QueryGridPanel
                    model={model}
                    asPanel={false}
                    showGridBar={false}
                />
            </>
        )
    }
}
