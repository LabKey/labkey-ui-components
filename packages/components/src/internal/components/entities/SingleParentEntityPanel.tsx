import React, { FC, memo, PureComponent, ReactNode, useMemo, useState } from 'react';

import { List } from 'immutable';

import { Filter } from '@labkey/api';

import {
    Alert,
    AppURL,
    capitalizeFirstChar,
    EntityDataType,
    GridPanel,
    LoadingSpinner,
    QueryModel,
    QuerySelect,
    RemoveEntityButton,
    SchemaQuery,
    SelectInput,
} from '../../..';

import { InjectedQueryModels, QueryConfigMap, withQueryModels } from '../../../public/QueryModel/withQueryModels';

import { DETAIL_TABLE_CLASSES } from '../forms/constants';

import { DELIMITER } from '../forms/input/SelectInput';

import { IEntityTypeOption } from './models';

interface OwnProps {
    chosenType: IEntityTypeOption;
    onTypeChange: (chosenType: IEntityTypeOption) => void;
    onValueChange: (chosenValue: string | string[]) => void;
}

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
    parentEntityType?: IEntityTypeOption;
}

type SingleParentEntityProps = Props & InjectedQueryModels & OwnProps;

class SingleParentEntity extends PureComponent<SingleParentEntityProps> {
    componentDidMount(): void {
        this.loadModel();
    }

    componentDidUpdate(prevProps: Readonly<SingleParentEntityProps>): void {
        if (this.props.chosenType !== prevProps.chosenType) {
            this.loadModel();
        }
    }

    loadModel = (): void => {
        const { actions, chosenType, queryModels } = this.props;

        if (chosenType && queryModels.model) {
            actions.loadModel('model');
        }
    };

    onChangeParentType = (fieldName: string, chosenType: any, selectedOption: IEntityTypeOption): void => {
        const { index, onChangeParentType, onTypeChange, onValueChange } = this.props;
        onTypeChange(selectedOption);
        onValueChange(undefined);
        onChangeParentType?.(fieldName, chosenType, selectedOption, index);
    };

    removeParent = (): void => {
        this.props.onRemoveParentType?.(this.props.index);
    };

    onChangeParentValue = (name: string, chosenValue: string | any[]): void => {
        this.props.onValueChange(chosenValue);
        this.props.onChangeParentValue?.(name, chosenValue, this.props.index);
    };

    onInitValue = (chosenValue: any, selectedValues: List<any>): void => {
        this.props.onValueChange(chosenValue);
        this.props.onInitialParentValue?.(chosenValue, selectedValues, this.props.index);
    };

    renderParentSelection = (model: QueryModel): ReactNode => {
        const { chosenType, chosenValue, parentLSIDs, parentTypeOptions, parentDataType, index } = this.props;

        if (model?.isLoading || !parentTypeOptions) {
            return <LoadingSpinner />;
        } else if (model?.rowsError || model?.queryInfoError) {
            return <Alert>{model.rowsError || model.queryInfoError}</Alert>;
        }

        let parentSchemaQuery;
        if (chosenType && parentTypeOptions) {
            parentSchemaQuery = SchemaQuery.create(chosenType.schema, chosenType.query);
        }

        const lcTypeName = chosenType?.label.toLowerCase();

        let value = chosenValue ?? undefined;
        if (!value && model?.hasData && parentLSIDs?.length > 0) {
            value = Object.values(model.rows)
                .map(row => row.Name.value)
                .join(DELIMITER);
        }

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
                {lcTypeName && chosenType && (
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
                        multiple
                        schemaQuery={parentSchemaQuery}
                        showLabel
                        valueColumn="Name"
                        showLoading
                        value={value}
                    />
                )}
            </div>
        );
    };

    renderParentHeader() {
        const { childNounSingular, chosenType, editing, parentDataType } = this.props;

        if (parentDataType && chosenType) {
            const { appUrlPrefixParts } = parentDataType;
            return (
                <table className={DETAIL_TABLE_CLASSES}>
                    <tbody>
                        <tr key="type-name">
                            <td>{parentDataType.typeNounSingular}</td>
                            <td>
                                {appUrlPrefixParts ? (
                                    <a href={AppURL.create(...appUrlPrefixParts, chosenType.label).toHref()}>{chosenType.label}</a>
                                ) : (
                                    chosenType.label
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
        const { actions, editing, index, queryModels } = this.props;
        const { model } = queryModels;

        if (editing) {
            return this.renderParentSelection(model);
        }

        return (
            <div className="top-spacing" key={'grid-' + index}>
                {this.renderParentHeader()}
                {model && (
                    <GridPanel
                        actions={actions}
                        allowSelections={false}
                        asPanel={false}
                        model={model}
                        showButtonBar={false}
                        showChartMenu={false}
                        showExport={false}
                        showOmniBox={false}
                    />
                )}
            </div>
        );
    }
}

const SingleParentEntityPanelBody = withQueryModels<Props & OwnProps>(SingleParentEntity);

export const SingleParentEntityPanel: FC<Props> = memo(props => {
    const { parentTypeOptions, parentLSIDs, parentEntityType } = props;
    const [chosenType, setChosenType] = useState<IEntityTypeOption>(parentEntityType);
    const [chosenValue, setChosenValue] = useState<string | string[]>(props.chosenValue);

    const queryConfigs: QueryConfigMap = useMemo(() => {
        // Without a chosenType or parentTypeOptions we cannot determine the underlying SchemaQuery
        if (!chosenType || !parentTypeOptions) {
            return {};
        }

        return {
            model: {
                baseFilters: parentLSIDs?.length > 0 ? [Filter.create('LSID', parentLSIDs, Filter.Types.IN)] : [],
                bindURL: false,
                schemaQuery: SchemaQuery.create(chosenType.schema, chosenType.query),
            },
        };
    }, [chosenType, parentTypeOptions, parentLSIDs]);

    return (
        <SingleParentEntityPanelBody
            {...props}
            chosenType={chosenType}
            chosenValue={chosenValue}
            onTypeChange={setChosenType}
            onValueChange={setChosenValue}
            queryConfigs={queryConfigs}
        />
    );
});
