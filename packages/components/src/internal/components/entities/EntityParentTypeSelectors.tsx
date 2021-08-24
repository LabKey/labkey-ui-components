import React, { FC, memo, useCallback, useMemo } from 'react';
import { List, Map, OrderedMap } from 'immutable';
import { Utils } from '@labkey/api';

import { EntityDataType, EntityParentType, getParentEntities, getParentOptions, IParentOption } from './models';
import { AddEntityButton } from '../buttons/AddEntityButton';
import { capitalizeFirstChar } from '../../util/utils';
import { SelectInput } from '../forms/input/SelectInput';
import { RemoveEntityButton } from '../buttons/RemoveEntityButton';
import { QueryColumn } from '../../../public/QueryColumn';
import { addColumns, changeColumn, removeColumn } from '../../actions';
import { QueryGridModel } from '../../QueryGridModel';

const getAddEntityButtonTitle = (disabled: boolean, optionSize: number, entityDataType: EntityDataType): string => {
    return disabled
        ? (optionSize > 0 ? 'Only ' : '') +
            optionSize +
            ' ' +
            (optionSize === 1 ? entityDataType.descriptionSingular : entityDataType.descriptionPlural) +
            ' available.'
        : undefined;
};

const getUpdatedEntityParentType = (
    entityParentsMap: Map<string, List<EntityParentType>>,
    index: number,
    queryName: string,
    uniqueFieldKey: string,
    parent: IParentOption
): [Map<string, List<EntityParentType>>, QueryColumn, EntityParentType, string] => {
    let column;
    let parentColumnName;
    let existingParent;
    const entityParents = entityParentsMap.get(queryName);
    let updatedEntityParents;
    if (parent) {
        const existingParentKey = entityParents.findKey(parent => parent.get('index') === index);
        existingParent = entityParents.get(existingParentKey);

        // bail out if the selected parent is the same as the existingParent for this index, i.e. nothing changed
        const schemaMatch =
            parent && existingParent && Utils.caseInsensitiveEquals(parent.schema, existingParent.schema);
        const queryMatch =
            parent && existingParent && Utils.caseInsensitiveEquals(parent.query, existingParent.query);
        if (schemaMatch && queryMatch) {
            return [undefined, undefined, existingParent, undefined];
        }

        const parentType = EntityParentType.create({
            index,
            key: existingParent.key,
            query: parent.query,
            schema: parent.schema,
        });
        updatedEntityParents = entityParentsMap.mergeIn([queryName, existingParentKey], parentType);
        column = parentType.generateColumn(uniqueFieldKey);
    } else {
        const parentToResetKey = entityParents.findKey(parent => parent.get('index') === index);
        const existingParent = entityParents.get(parentToResetKey);
        parentColumnName = existingParent.createColumnName();
        updatedEntityParents = entityParentsMap.mergeIn([queryName, parentToResetKey],
            EntityParentType.create({
                key: existingParent.key,
                index,
            })
        );
    }
    return [updatedEntityParents, column, existingParent, parentColumnName];
};

export const changeEntityParentType = (
    index: number,
    queryName: string,
    parent: IParentOption,
    queryGridModel: QueryGridModel,
    entityParents: Map<string, List<EntityParentType>>,
    entityDataType: EntityDataType,
    combineParentTypes: boolean
): Map<string, List<EntityParentType>> => {
    if (queryGridModel) {
        const [updatedEntityParents, column, existingParent, parentColumnName] = getUpdatedEntityParentType(
            entityParents,
            index,
            queryName,
            entityDataType.uniqueFieldKey,
            parent
        );

        // no updated model if nothing has changed, so we can just stop
        if (!updatedEntityParents) return undefined;

        if (column && existingParent) {
            if (existingParent.query !== undefined) {
                changeColumn(queryGridModel, existingParent.createColumnName(), column);
            } else {
                const columnMap = OrderedMap<string, QueryColumn>();
                let fieldKey;
                if (existingParent.index === 1) {
                    fieldKey = entityDataType.uniqueFieldKey;
                } else {
                    const definedParents = getParentEntities(updatedEntityParents, combineParentTypes, queryName)
                        .filter(parent => parent.query !== undefined);
                    if (definedParents.size === 0) fieldKey = entityDataType.uniqueFieldKey;
                    else {
                        // want the first defined parent before the new parent's index
                        const prevParent = definedParents.findLast(
                            parent => parent.index < existingParent.index
                        );
                        fieldKey = prevParent
                            ? prevParent.createColumnName()
                            : entityDataType.uniqueFieldKey;
                    }
                }
                addColumns(queryGridModel, columnMap.set(column.fieldKey.toLowerCase(), column), fieldKey);
            }
        } else {
            removeColumn(queryGridModel, parentColumnName);
        }

        return updatedEntityParents;
    }
};

export const removeEntityParentType = (
    index: number,
    queryName: string,
    entityParents: Map<string, List<EntityParentType>>,
    queryGridModel: QueryGridModel
): Map<string, List<EntityParentType>> => {
    const currentParents = entityParents.get(queryName);
    const parentToResetKey = currentParents.findKey(parent => parent.get('index') === index);
    const updatedParents = currentParents
        .filter(parent => parent.index !== index)
        .map((parent, key) => parent.set('index', key + 1) as EntityParentType)
        .toList();
    const updatedEntityParents = entityParents.set(queryName, updatedParents);

    const parentColumnName = currentParents.get(parentToResetKey).createColumnName();
    removeColumn(queryGridModel, parentColumnName);

    return updatedEntityParents;
};

export const addEntityParentType = (
    queryName: string,
    entityParents: Map<string, List<EntityParentType>>
): Map<string, List<EntityParentType>> => {
    const nextIndex = entityParents.get(queryName).size + 1;
    const updatedParents = entityParents.get(queryName).push(EntityParentType.create({ index: nextIndex }));
    return entityParents.set(queryName, updatedParents);
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
    parentDataTypes: List<EntityDataType>;
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
            <div className="bottom-spacing">
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
