import React, { Component, ReactNode } from 'react';

import { List } from 'immutable';

import { Filter } from '@labkey/api';

import { QueryGridPanel } from '../QueryGridPanel';
import {
    AppURL,
    capitalizeFirstChar,
    EntityDataType,
    getQueryGridModel,
    getStateQueryGridModel,
    gridInit,
    LoadingSpinner,
    QueryGridModel,
    QuerySelect,
    RemoveEntityButton,
    SchemaQuery,
    SelectInput,
} from '../../..';

import { DETAIL_TABLE_CLASSES } from '../forms/constants';

import { DELIMITER } from '../forms/input/SelectInput';

import { IEntityTypeOption } from './models';
import { getParentGridPrefix } from './utils';

interface Props {
    childNounSingular?: string;
    chosenValue?: string | any[];
    editing?: boolean;
    index: number;
    onChangeParentType?: (fieldName: string, formValue: any, selectedOption: IEntityTypeOption, index: number) => void;
    onChangeParentValue?: (name: string, value: string | any[], index: number) => void;
    onInitialParentValue?: (value: string, selectedValues: List<any>, index: number) => void;
    onRemoveParentType?: (index: number) => void;
    parentDataType: EntityDataType;
    parentLSIDs?: string[];
    parentTypeOptions?: List<IEntityTypeOption>;
    parentTypeQueryName?: string;
}

interface State {
    chosenType: string;
    chosenValue: string | string[];
}

export class SingleParentEntityPanel extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            chosenType: props.parentTypeQueryName,
            chosenValue: props.chosenValue,
        };
    }

    componentDidMount(): void {
        this.init();
    }

    init = (): void => {
        const model = this.getParentModel();
        if (model) {
            gridInit(model, true, this);
        }
    };

    getParentModel = (): QueryGridModel => {
        const { parentDataType } = this.props;
        const { chosenType } = this.state;

        if (!chosenType) {
            return undefined;
        }

        const model = getStateQueryGridModel(
            getParentGridPrefix(parentDataType),
            SchemaQuery.create(parentDataType.instanceSchemaName, chosenType),
            () => {
                const { parentLSIDs } = this.props;
                let baseFilters = List<any>();

                if (parentLSIDs?.length > 0) {
                    baseFilters = baseFilters.push(Filter.create('LSID', parentLSIDs, Filter.Types.IN));
                }

                return {
                    allowSelection: false,
                    baseFilters,
                    bindURL: false,
                    isPaged: true,
                };
            }
        );

        return getQueryGridModel(model.getId()) || model;
    };

    onChangeParentType = (fieldName: string, formValue: any, selectedOption: IEntityTypeOption): void => {
        this.setState(
            () => ({
                chosenType: formValue,
                chosenValue: undefined,
            }),
            () => {
                this.props.onChangeParentType?.(fieldName, formValue, selectedOption, this.props.index);
            }
        );
    };

    removeParent = (): void => {
        this.props.onRemoveParentType?.(this.props.index);
    };

    onChangeParentValue = (name: string, value: string | any[]): void => {
        this.setState(
            state => ({ chosenValue: value }),
            () => {
                this.props.onChangeParentValue?.(name, value, this.props.index);
            }
        );
    };

    onInitValue = (value: any, selectedValues: List<any>) => {
        this.setState(
            state => ({ chosenValue: value }),
            () => {
                this.props.onInitialParentValue?.(value, selectedValues, this.props.index);
            }
        );
    };

    renderParentSelection = (model: QueryGridModel): ReactNode => {
        const { parentDataType, parentTypeOptions, parentLSIDs, index } = this.props;
        const { chosenType } = this.state;

        if (model?.isLoading || !parentTypeOptions) {
            return <LoadingSpinner />;
        }

        const parentSchemaQuery = chosenType
            ? SchemaQuery.create(parentDataType.instanceSchemaName, chosenType)
            : undefined;
        const lcTypeName = chosenType ? chosenType.toLowerCase() : undefined;

        const parentValues =
            model && parentLSIDs?.length > 0
                ? model
                      .getData()
                      .map(row => row.getIn(['Name', 'value']))
                      .toArray()
                : undefined;

        return (
            <div className="bottom-spacing" key={'parent-selections-' + index}>
                <div className="form-group row">
                    <SelectInput
                        formsy={false}
                        containerClass=""
                        inputClass="col-sm-6"
                        label={parentDataType.typeNounSingular + ' ' + (index + 1)}
                        labelClass="col-sm-3 col-xs-12 entity-insert--parent-label"
                        name={lcTypeName ? lcTypeName : 'entityType' + index}
                        placeholder={'Select a ' + parentDataType.typeNounSingular + ' ...'}
                        onChange={this.onChangeParentType}
                        options={parentTypeOptions.toArray()}
                        required
                        value={lcTypeName}
                    />

                    {this.props.onRemoveParentType && (
                        <RemoveEntityButton
                            labelClass="entity-insert--remove-parent"
                            entity={parentDataType.typeNounSingular}
                            index={index + 1}
                            onClick={() => this.props.onRemoveParentType(index)}
                        />
                    )}
                </div>
                {lcTypeName && (
                    <QuerySelect
                        componentId={'parentEntityValue_' + lcTypeName} // important that this key off of the schemaQuery or it won't update when the SelectInput changes
                        containerClass="row"
                        formsy={false}
                        label={capitalizeFirstChar(parentDataType.nounSingular) + ' IDs'}
                        inputClass="col-sm-6"
                        labelClass="col-sm-3 col-xs-12 entity-insert--parent-label"
                        name={'parentEntityValue_' + lcTypeName}
                        onQSChange={this.onChangeParentValue}
                        onInitValue={this.onInitValue}
                        preLoad
                        loadOnChange // set to true so we'll reload to eliminate the last selected value from the list.
                        previewOptions
                        multiple
                        schemaQuery={parentSchemaQuery}
                        showLabel={true}
                        valueColumn="Name"
                        showLoading={true}
                        value={
                            this.state.chosenValue
                                ? this.state.chosenValue
                                : parentValues
                                ? parentValues.join(DELIMITER)
                                : undefined
                        }
                    />
                )}
            </div>
        );
    };

    renderParentHeader() {
        const { childNounSingular, editing, parentDataType } = this.props;
        const { chosenType } = this.state;

        if (parentDataType && chosenType) {
            const { appUrlPrefixParts } = parentDataType;
            return (
                <table className={DETAIL_TABLE_CLASSES}>
                    <tbody>
                        <tr key="type-name">
                            <td>{parentDataType.typeNounSingular}</td>
                            <td>
                                {appUrlPrefixParts ? (
                                    <a href={AppURL.create(...appUrlPrefixParts, chosenType).toHref()}>{chosenType}</a>
                                ) : (
                                    chosenType
                                )}
                            </td>
                        </tr>
                    </tbody>
                </table>
            );
        } else if (!editing && childNounSingular) {
            const lcChildNoun = childNounSingular.toLowerCase();
            return (
                <table className={DETAIL_TABLE_CLASSES}>
                    <tbody>
                        <tr key="type-name">
                            <td>{parentDataType.typeNounSingular}</td>
                            <td>
                                No {parentDataType.typeNounSingular.toLowerCase()} has been set for this {lcChildNoun}.
                            </td>
                        </tr>
                        <tr key="parent-id">
                            <td>{capitalizeFirstChar(parentDataType.nounSingular) + ' ID'}</td>
                            <td>
                                No {parentDataType.nounSingular.toLowerCase()} ID has been set for this {lcChildNoun}.
                            </td>
                        </tr>
                    </tbody>
                </table>
            );
        }
    }

    render() {
        const { editing, index } = this.props;
        const model = this.getParentModel();

        if (editing) {
            return this.renderParentSelection(model);
        }

        return (
            <div className="top-spacing" key={'grid-' + index}>
                {this.renderParentHeader()}
                {model && <QueryGridPanel asPanel={false} model={model} showGridBar={false} />}
            </div>
        );
    }
}
