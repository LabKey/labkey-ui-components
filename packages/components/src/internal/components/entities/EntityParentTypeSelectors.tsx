import React, { FC, memo, useCallback, useMemo } from 'react';
import { List, Map } from 'immutable';

import { EntityDataType, EntityParentType, getParentEntities, getParentOptions, IParentOption } from './models';
import { AddEntityButton } from '../buttons/AddEntityButton';
import { capitalizeFirstChar } from '../../util/utils';
import { SelectInput } from '../forms/input/SelectInput';
import { RemoveEntityButton } from '../buttons/RemoveEntityButton';

const getAddEntityButtonTitle = (disabled: boolean, optionSize: number, entityDataType: EntityDataType): string => {
    return disabled
        ? 'Only ' + optionSize + ' ' +
            (optionSize === 1 ? entityDataType.descriptionSingular : entityDataType.descriptionPlural) +
            ' available.'
        : undefined;
};

interface AddEntityButtonProps {
    entityDataType: EntityDataType;
    parentOptions: List<IParentOption>;
    entityParents: List<EntityParentType>;
    combineParentTypes?: boolean;
    onAdd: (queryName: string) => void;
}

const EntityParentTypeAddEntityButton: FC<AddEntityButtonProps> = memo(props => {
    const { entityDataType, parentOptions, entityParents, onAdd } = props;
    const { queryName } = entityDataType.typeListingSchemaQuery;

    const onAddHandler = useCallback(() => {
        onAdd(queryName);
    }, [onAdd]);

    const disabled = useMemo(() => parentOptions.size <= entityParents.size, [parentOptions.size, entityParents.size]);
    const title = useMemo(
        () => getAddEntityButtonTitle(disabled, parentOptions.size, entityDataType),
        [disabled, parentOptions.size, entityDataType]
    );

    return (
        <AddEntityButton
            containerClass="entity-insert--entity-add-button"
            key={'add-entity-' + queryName}
            entity={capitalizeFirstChar(entityDataType.nounAsParentSingular)}
            title={title}
            disabled={disabled}
            onClick={onAddHandler}
        />
    );
});

EntityParentTypeAddEntityButton.displayName = 'EntityParentTypeAddEntityButton';

interface Props {
    parentDataTypes?: List<EntityDataType>;
    parentOptionsMap: Map<string, List<IParentOption>>;
    entityParentsMap: Map<string, List<EntityParentType>>;
    combineParentTypes: boolean;
    onAdd: (queryName: string) => void;
    onChange: (index: number, queryName: string, fieldName: string, formValue: any, parent: IParentOption) => void;
    onRemove: (index: number, queryName: string) => void;
}

export const EntityParentTypeSelectors: FC<Props> = memo(props => {
    const { parentDataTypes, parentOptionsMap, entityParentsMap, combineParentTypes, onAdd, onChange, onRemove } = props;

    // If combining parent types, just grabbing first parent type for the name
    const dataTypes = useMemo(
        () => (combineParentTypes ? List.of(parentDataTypes.get(0)) : parentDataTypes),
        [combineParentTypes, parentDataTypes]
    );

    return (
        <>
            {dataTypes.map(entityDataType => {
                const { queryName } = entityDataType.typeListingSchemaQuery;
                const entityParents = getParentEntities(entityParentsMap, combineParentTypes, queryName);

                return (
                    <>
                        {entityParents.map(parent => {
                            const { index, key, query } = parent;
                            const capNounSingular = capitalizeFirstChar(entityDataType.nounAsParentSingular);

                            return (
                                <div className="form-group row" key={key}>
                                    <SelectInput
                                        containerClass=""
                                        inputClass="col-sm-5"
                                        label={capNounSingular + ' ' + index + ' Type'}
                                        labelClass="col-sm-3 entity-insert--parent-label"
                                        name={'parent-re-select-' + index}
                                        id={'parent-re-select-' + index}
                                        onChange={onChange.bind(this, index, queryName)}
                                        options={getParentOptions(
                                            parentOptionsMap,
                                            entityParentsMap,
                                            query,
                                            queryName,
                                            combineParentTypes
                                        )}
                                        value={query}
                                    />

                                    <RemoveEntityButton
                                        labelClass="entity-insert--remove-parent"
                                        entity={capNounSingular}
                                        index={index}
                                        onClick={onRemove.bind(this, index, queryName)}
                                    />
                                </div>
                            );
                        })}
                    </>
                );
            })}
            <div className="entity-insert--header">
                {dataTypes.map(entityDataType => {
                    const { queryName } = entityDataType.typeListingSchemaQuery;
                    const parentOptions = parentOptionsMap.get(queryName);
                    const entityParents = getParentEntities(entityParentsMap, combineParentTypes, queryName);

                    return (
                        <EntityParentTypeAddEntityButton
                            entityDataType={entityDataType}
                            parentOptions={parentOptions}
                            entityParents={entityParents}
                            onAdd={onAdd}
                        />
                    );
                })}
            </div>
        </>
    );
});

EntityParentTypeSelectors.displayName = 'EntityParentTypeSelectors';
