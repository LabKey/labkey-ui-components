import React from 'react';
import { QueryGridPanel } from '../QueryGridPanel';
import {
    AppURL,
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
    childNounSingular?: string
    parentDataType: EntityDataType
    parentValues?: List<Map<string, any>>
    parentTypeQueryName?: string
    requiredColumns?: List<string>
    omittedColumns?: List<string>
}

export class SingleParentEntityPanel extends React.Component<Props, any> {

    componentWillMount() {
        this.init();
    }

    init() {
        const model = this.getParentModel();
        if (model) {
            gridInit(model, true, this);
        }
    }

    getParentModel() : QueryGridModel {
        const { parentDataType, parentTypeQueryName, parentValues } = this.props;
        if (!parentTypeQueryName || !parentValues || parentValues.isEmpty())
            return undefined;

        const model = getStateQueryGridModel('parent-data-' + parentTypeQueryName, SchemaQuery.create(parentDataType.instanceSchemaName, parentTypeQueryName), {
            bindURL: false,
            allowSelection: false,
            baseFilters: List([Filter.create("LSID", parentValues.map((valueMap) => valueMap.get('value')).toArray(), Filter.Types.IN)]),
            requiredColumns: this.props.requiredColumns || List<string>(),
            omittedColumns: this.props.omittedColumns || List<string>(),
        });
        return getQueryGridModel(model.getId()) || model;
    }

    renderParentHeader() {
        const { parentDataType, parentTypeQueryName } = this.props;

        if (parentDataType && parentTypeQueryName) {
            const { appUrlPrefixParts } = parentDataType;
            return (
                <table className={DETAIL_TABLE_CLASSES}>
                    <tbody>
                    <tr key={'type-name'}>
                        <td>{parentDataType.typeNounSingular}</td>
                        <td>
                            {appUrlPrefixParts ?
                                <a href={AppURL.create(...appUrlPrefixParts, parentTypeQueryName).toHref()}>{parentTypeQueryName}</a> : parentTypeQueryName}
                        </td>
                    </tr>
                    </tbody>
                </table>
            )
        }
        else {
            const lcChildNoun = this.props.childNounSingular.toLowerCase();
            return (
                <table className={DETAIL_TABLE_CLASSES}>
                    <tbody>
                    <tr key={'type-name'}>
                        <td>{parentDataType.typeNounSingular}</td>
                        <td >
                            No {parentDataType.typeNounSingular.toLowerCase()} has been set for this {lcChildNoun}
                        </td>
                    </tr>
                    <tr key={'parent-id'}>
                        <td>{capitalizeFirstChar(parentDataType.nounSingular) + " ID"}</td>
                        <td >
                            No {parentDataType.nounSingular.toLowerCase()} ID has been set for this {lcChildNoun}
                        </td>
                    </tr>
                    </tbody>
                </table>
            )
        }
    }

    render() {
        const model = this.getParentModel();

        return (
            <div className={'top-spacing'}>
                {this.renderParentHeader()}
                {model && <QueryGridPanel
                    model={model}
                    asPanel={false}
                    showGridBar={false}
                />}
            </div>
        )
    }
}
