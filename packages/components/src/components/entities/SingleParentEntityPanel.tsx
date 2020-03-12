import React from 'react';
import { QueryGridPanel } from '../QueryGridPanel';
import {
    AppURL,
    capitalizeFirstChar,
    EntityDataType,
    getQueryGridModel,
    getStateQueryGridModel,
    gridInit, LoadingSpinner,
    QueryGridModel,
    QuerySelect,
    SchemaQuery,
    SelectInput
} from '../..';
import { List } from 'immutable';
import { Filter } from '@labkey/api';
import { DETAIL_TABLE_CLASSES } from '../forms/constants';
import { IEntityTypeOption } from './models';
import { DELIMITER } from '../forms/input/SelectInput';

interface Props {
    childNounSingular?: string
    parentDataType: EntityDataType
    parentLSIDs?: Array<string>
    parentTypeQueryName?: string
    requiredColumns?: List<string>
    omittedColumns?: List<string>
    parentTypeOptions?: List<IEntityTypeOption>
    index: number
    editing?: boolean
    onChangeParentType?: (fieldName: string, formValue: any, selectedOption: IEntityTypeOption, index: number) => any
    onChangeParentValue?: (name: string, value: string | Array<any>, index: number) => any
}

interface State {
    chosenValue: string | Array<any>
    chosenType: IEntityTypeOption
}

export class SingleParentEntityPanel extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);
        this.state = {
            chosenValue: undefined,
            chosenType: undefined
        }
    }

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
        const { parentDataType, parentTypeQueryName, parentLSIDs } = this.props;
        if (!parentTypeQueryName || !parentLSIDs || parentLSIDs.length === 0)
            return undefined;

        const model = getStateQueryGridModel('parent-data-' + parentTypeQueryName, SchemaQuery.create(parentDataType.instanceSchemaName, parentTypeQueryName), {
            bindURL: false,
            allowSelection: false,
            baseFilters: List([Filter.create("LSID", parentLSIDs, Filter.Types.IN)]),
            requiredColumns: this.props.requiredColumns || List<string>(),
            omittedColumns: this.props.omittedColumns || List<string>(),
        });
        return getQueryGridModel(model.getId()) || model;
    }

    onChangeParentType = (fieldName: string, formValue: any, selectedOption: IEntityTypeOption) => {
        this.setState(() => ({
            chosenType: selectedOption
        }),() => {
            if (this.props.onChangeParentType) {
                this.props.onChangeParentType(fieldName, formValue, selectedOption, this.props.index)
            }
        })
    };

    onChangeParentValue = (name: string, value: string | Array<any>) => {
        this.setState(() => ({
            chosenValue: value
        }), () => {
            if (this.props.onChangeParentValue) {
                this.props.onChangeParentValue(name, value, this.props.index);
            }
        });
    };

    renderParentSelection() {
        const { parentDataType, parentTypeOptions, parentTypeQueryName, index } = this.props;
        const model = this.getParentModel();

        if (!model || model.isLoading || !parentTypeOptions)
            return <LoadingSpinner/>;

        const parentSchemaQuery = parentTypeQueryName ? SchemaQuery.create(this.props.parentDataType.instanceSchemaName, parentTypeQueryName) : undefined;
        const lcTypeName = parentTypeQueryName ? parentTypeQueryName.toLowerCase() : undefined;

        const parentValues = model.getData().map((row) => row.getIn(['Name', 'value'])).toArray();

        return (
            <div className={'bottom-spacing'} key={lcTypeName}>
                <SelectInput
                    formsy={false}
                    inputClass="col-sm-6"
                    label={parentDataType.typeNounSingular}
                    labelClass="col-sm-3 col-xs-12 entity-insert--parent-label"
                    name={"parentEntityType" + index}
                    placeholder={'Select a ' + parentDataType.typeNounSingular + ' ...'}
                    onChange={this.onChangeParentType}
                    options={parentTypeOptions.toArray()}
                    required
                    value={lcTypeName}
                />
                {lcTypeName && (
                    <QuerySelect
                        componentId={"parentEntityValue_" + lcTypeName} // important that this key off of the schemaQuery or it won't update when the SelectInput chages
                        containerClass="row"
                        disabled={lcTypeName === undefined}
                        formsy={false}
                        label={capitalizeFirstChar(parentDataType.nounSingular) + " ID"}
                        inputClass="col-sm-6"
                        labelClass="col-sm-3 col-xs-12 entity-insert--parent-label"
                        name={lcTypeName + "_value"}
                        onQSChange={this.onChangeParentValue}
                        preLoad
                        previewOptions
                        multiple
                        schemaQuery={parentSchemaQuery}
                        showLabel={true}
                        valueColumn="Name"
                        showLoading={true}
                        loadOnChange={false}
                        value={parentValues.join(DELIMITER)}
                    />
                )}
            </div>
        )
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

    renderGridData() {
        const model = this.getParentModel();

        return (
            <div className={'top-spacing'}>
                {this.renderParentHeader()}
                {model && (
                    <QueryGridPanel
                        model={model}
                        asPanel={false}
                        showGridBar={false}
                    />
                )}
            </div>
        )
    }


    render() {
        const { editing } = this.props;

        return (
            editing ?  this.renderParentSelection() : this.renderGridData()
        )
    }
}
