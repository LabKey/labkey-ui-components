import React, {FC, memo, useMemo} from "react";
import {SelectInput} from "../internal/components/forms/input/SelectInput";
import {RemoveEntityButton} from "../internal/components/buttons/RemoveEntityButton";
import {QuerySelect} from "../internal/components/forms/QuerySelect";
import {getContainerFilterForLookups} from "../internal/query/api";
import {capitalizeFirstChar, caseInsensitive, quoteValueWithDelimiters} from "../internal/util/utils";
import {SchemaQuery} from "../public/SchemaQuery";
import {ViewInfo} from "../internal/ViewInfo";
import {List} from "immutable";
import {Filter} from "@labkey/api";
import {isSampleStatusEnabled} from "../internal/app/utils";
import {isSampleEntity} from "../internal/components/entities/utils";
import {getFilterForSampleOperation} from "../internal/components/samples/utils";
import {SampleOperation} from "../internal/components/samples/constants";
import {DELIMITER} from "../internal/components/forms/constants";
import {QueryModel} from "../public/QueryModel/QueryModel";
import {EntityDataType, IEntityTypeOption} from "../internal/components/entities/models";

interface Props {
    model: QueryModel;
    chosenType: IEntityTypeOption;
    chosenValue?: string | any[];
    containerPath?: string;
    index: number;
    onChangeParentType?: (fieldName: string, chosenType: any, selectedOption: IEntityTypeOption) => void;
    onChangeParentValue?: (name: string, chosenValue: string | any[]) => void;
    onRemoveParentType?: (index: number) => void;
    parentDataType: EntityDataType;
    parentLSIDs?: string[];
    parentTypeOptions?: List<IEntityTypeOption>;
    onInitValue?: (chosenValue: any, selectedValues: List<any>) => void;
}

const labelClasses = 'col-sm-3 col-xs-12';

export const ParentSelection: FC<Props> = memo(props => {
    const { model, chosenType, chosenValue, containerPath, parentLSIDs, onInitValue, onChangeParentType,
        parentTypeOptions, parentDataType, index, onRemoveParentType, onChangeParentValue} = props;

    const parentSchemaQuery = useMemo(() => {
        if (chosenType && parentTypeOptions) {
            // use the detail view, so we get all parents, even if the default view has been filtered
            return new SchemaQuery(chosenType.schema, chosenType.query, ViewInfo.DETAIL_NAME);
        }
        return null;
    }, [chosenType, parentTypeOptions]);

    const queryFilters = useMemo(() => {
        let filters = List<Filter.IFilter>();
        if (isSampleStatusEnabled() && isSampleEntity(parentDataType)) {
            filters = filters.push(getFilterForSampleOperation(SampleOperation.EditLineage));
        }
        return filters;
    }, [parentDataType]);

    const value = useMemo(() => {
        let value = chosenValue ?? undefined;
        if (!value && model?.hasData && parentLSIDs?.length > 0) {
            value = Object.values(model.rows)
                .map(row => quoteValueWithDelimiters(caseInsensitive(row, 'Name').value, DELIMITER))
                .join(DELIMITER);
        }
        return value;
    }, [chosenValue, model, parentLSIDs]);

    return (
        <div className="bottom-spacing" key={'parent-selections-' + index}>
            <div className="form-group row">
                <SelectInput
                    containerClass=""
                    inputClass="col-sm-6"
                    label={parentDataType.typeNounAsParentSingular + ' ' + (index + 1)}
                    labelClass="col-sm-3 col-xs-12 entity-insert--parent-label entity-insert--type-select"
                    name={'entityType' + index}
                    placeholder={'Select a ' + parentDataType.typeNounAsParentSingular + ' ...'}
                    onChange={onChangeParentType}
                    options={parentTypeOptions?.toArray()}
                    required
                    value={chosenType}
                />

                {onRemoveParentType && (
                    <RemoveEntityButton
                        labelClass="entity-insert--remove-parent"
                        entity={parentDataType.typeNounAsParentSingular}
                        index={index + 1}
                        onClick={() => onRemoveParentType(index)}
                    />
                )}
            </div>
            {chosenType && (
                <>
                    <QuerySelect
                        key={'parentEntityValue_' + chosenType.label} // important that this key off of the schemaQuery or it won't update when the SelectInput changes
                        containerClass="row"
                        containerFilter={getContainerFilterForLookups()}
                        containerPath={containerPath}
                        inputClass="col-sm-6"
                        label={capitalizeFirstChar(parentDataType.nounSingular) + ' IDs'}
                        labelClass={labelClasses + ' entity-insert--parent-label entity-insert--parent-select'}
                        multiple
                        name={'parentEntityValue_' + chosenType.label}
                        onInitValue={onInitValue}
                        onQSChange={onChangeParentValue}
                        schemaQuery={parentSchemaQuery}
                        queryFilters={queryFilters}
                        showLoading
                        value={value}
                        valueColumn="Name"
                    />
                    {!chosenValue && (
                        <div className="row top-spacing edit-parent-danger">
                            <div className={labelClasses} />
                            <div className="col-sm-9 col-xs-12">
                                Leaving this selection blank will remove any current {chosenType.label}{' '}
                                {parentDataType.nounSingular} values.
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
})
