import React, { ComponentType, FC, memo, useCallback, useEffect, useState } from 'react';

import { AuditBehaviorTypes, Filter } from '@labkey/api';

import { capitalizeFirstChar } from '../../util/utils';
import { EntityDataType } from '../entities/models';
import { Section } from '../base/Section';
import { SchemaQuery } from '../../../public/SchemaQuery';

import { SamplesTabbedGridPanel } from '../samples/SamplesTabbedGridPanel';
import { SAMPLE_DATA_EXPORT_CONFIG, SAMPLE_STATUS_REQUIRED_COLUMNS } from '../samples/constants';
import { SCHEMAS } from '../../schemas';
import {
    InjectedQueryModels,
    RequiresModelAndActions,
    withQueryModels
} from '../../../public/QueryModel/withQueryModels';
import { User } from '../base/models/User';
import { SamplesEditableGridProps } from '../samples/SamplesEditableGrid';

import { EntityFieldFilterModal } from './EntityFieldFilterModal';

import { FilterCardProps, FilterCards } from './FilterCards';
import { getFinderStartText } from './utils';
import { getOmittedSampleTypeColumns, SamplesManageButtonSections } from '../samples/utils';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { getFinderSampleTypeNames } from './actions';
import { resolveErrorMessage } from '../../util/messaging';
import { Alert } from '../base/Alert';
import { getContainerFilter } from '../../query/api';
import { SampleGridButtonProps } from '../samples/models';
import { List } from 'immutable';
import { QueryConfig } from '../../../public/QueryModel/QueryModel';

const SAMPLE_FINDER_TITLE = 'Find Samples';
const SAMPLE_FINDER_CAPTION = 'Find samples that meet all the criteria defined below';

interface SampleFinderSamplesGridProps {
    user: User;
    getSampleAuditBehaviorType: () => AuditBehaviorTypes;
    samplesEditableGridProps: Partial<SamplesEditableGridProps>;
    excludedCreateMenuKeys?: List<string>;
    gridButtons?: ComponentType<SampleGridButtonProps & RequiresModelAndActions>;
    gridButtonProps?: any;
}

interface Props extends SampleFinderSamplesGridProps {
    parentEntityDataTypes: EntityDataType[];
}

interface SampleFinderHeaderProps {
    parentEntityDataTypes: EntityDataType[];
    onAddEntity: (entityType: EntityDataType) => void;
}

export const SampleFinderHeaderButtons: FC<SampleFinderHeaderProps> = memo(props => {
    const { parentEntityDataTypes, onAddEntity } = props;

    return (
        <div>
            Search by:
            {parentEntityDataTypes.map(parentEntityType => (
                <button
                    key={parentEntityType.nounSingular}
                    className="btn btn-default margin-left"
                    onClick={() => {
                        onAddEntity(parentEntityType);
                    }}
                >
                    <i className="fa fa-plus-circle container--addition-icon" />{' '}
                    {capitalizeFirstChar(parentEntityType.nounAsParentSingular)} Properties
                </button>
            ))}
        </div>
    );
});

export const SampleFinderSection: FC<Props> = memo(props => {
    const { parentEntityDataTypes, ...gridProps } = props;

    const [filterChangeCounter, setFilterChangeCounter] = useState<number>(0);
    const [chosenEntityType, setChosenEntityType] = useState<EntityDataType>(undefined);
    const [filterCards, setFilterCards] = useState<FilterCardProps[]>([]);

    const onAddEntity = useCallback((entityType: EntityDataType) => {
        setFilterChangeCounter(filterChangeCounter+1);
        setChosenEntityType(entityType);
    }, [filterChangeCounter]);

    const onFilterEdit = useCallback(
        (index: number) => {
            setFilterChangeCounter(filterChangeCounter+1);
            setChosenEntityType(parentEntityDataTypes[index]);
        },
        [parentEntityDataTypes, filterChangeCounter]
    );

    const onFilterDelete = useCallback(
        (index: number) => {
            const newFilterCards = [...filterCards];
            newFilterCards.splice(index, 1);
            setFilterCards(newFilterCards);
            setFilterChangeCounter(filterChangeCounter+1);
        },
        [filterCards, filterChangeCounter]
    );

    const onFilterClose = () => {
        setChosenEntityType(undefined);
        setFilterChangeCounter(filterChangeCounter+1);
    };

    const onFind = useCallback(
        (schemaQuery: SchemaQuery, filterArray: Filter.IFilter[]) => {
            const newFilterCards = [...filterCards];
            newFilterCards.push({
                schemaQuery,
                filterArray,
                entityDataType: chosenEntityType,
                onAdd: onAddEntity,
            });
            onFilterClose();
            setFilterCards(newFilterCards);
        },
        [filterCards, onFilterEdit, onFilterDelete, chosenEntityType]
    );

    return (
        <Section
            title={SAMPLE_FINDER_TITLE}
            caption={SAMPLE_FINDER_CAPTION}
            context={
                <SampleFinderHeaderButtons parentEntityDataTypes={parentEntityDataTypes} onAddEntity={onAddEntity} />
            }
        >
            {filterCards.length == 0 ? (
                <>
                    <FilterCards
                        className="empty"
                        cards={parentEntityDataTypes.map(entityDataType => ({
                            entityDataType,
                            onAdd: onAddEntity,
                        }))}
                    />
                    <div className="filter-hint">{getFinderStartText(parentEntityDataTypes)}</div>
                </>
            ) : (
                <>
                    <FilterCards cards={filterCards} onFilterDelete={onFilterDelete} />
                    <SampleFinderSamples {...gridProps} cards={filterCards} filterChangeCounter={filterChangeCounter} />
                </>
            )}
            {chosenEntityType !== undefined && (
                <EntityFieldFilterModal onCancel={onFilterClose} entityDataType={chosenEntityType} onFind={onFind} />
            )}
        </Section>
    );
});

interface SampleFinderSamplesProps extends SampleFinderSamplesGridProps {
    cards: FilterCardProps[];
    filterChangeCounter: number;
}

export const SampleFinderSamplesImpl: FC<SampleFinderSamplesGridProps & InjectedQueryModels> = memo(props => {
    const { actions, queryModels, gridButtons, excludedCreateMenuKeys } = props;
    return (
        <>
            <h4>Proper Filtering coming soon...</h4>
            <SamplesTabbedGridPanel
                {...props}
                withTitle={false}
                asPanel={false}
                actions={actions}
                queryModels={queryModels}
                excludedCreateMenuKeys={excludedCreateMenuKeys}
                gridButtons={gridButtons}
                gridButtonProps={{
                    excludedManageMenuKeys: [SamplesManageButtonSections.IMPORT],
                }}
                tabbedGridPanelProps={{
                    alwaysShowTabs: true,
                    advancedExportOptions: SAMPLE_DATA_EXPORT_CONFIG,
                }}
            />
        </>
    );
});

const SampleFinderSamplesWithQueryModels = withQueryModels<SampleFinderSamplesGridProps>(SampleFinderSamplesImpl);

const SampleFinderSamples: FC<SampleFinderSamplesProps> = memo(props => {
    const { cards, filterChangeCounter, user, ...gridProps } = props;
    const [queryConfigs, setQueryConfigs] = useState<any>(undefined);
    const [errors, setErrors] = useState<string>(undefined);

    useEffect(() => {
        const omittedColumns = getOmittedSampleTypeColumns(user);
        const baseFilters = [];
        const requiredColumns = [...SAMPLE_STATUS_REQUIRED_COLUMNS];
        cards.forEach(card => {
            const cardColumnName = card.entityDataType.inputColumnName
                .replace("Inputs", 'MultiValuedInputs')
                .replace("First", card.schemaQuery.queryName);
            requiredColumns.push(cardColumnName);
            // TODO need to add columns referenced in filters
            if (card.filterArray.length) {
                baseFilters.push(...card.filterArray);
            } else  {
                baseFilters.push(Filter.create( cardColumnName + "/lsid$SName", null, Filter.Types.NONBLANK));
            }
        });
        console.log("SampleFinderSamples: useEffect filterChangeCounter " + filterChangeCounter);
        const allSamplesKey = 'sampleFinder|allSamples-' + filterChangeCounter;
        // const allSamplesKey = 'sampleFinder|allSamples';
        const configs: { [key: string]: QueryConfig } = {
            [allSamplesKey]: {
                id: allSamplesKey,
                title: 'All Samples',
                schemaQuery: SCHEMAS.EXP_TABLES.MATERIALS,
                requiredColumns,
                baseFilters,
            },
        };
        (async () => {
            try {
                const names = await getFinderSampleTypeNames(getContainerFilter());
                names.forEach(name => {
                    // const id = 'sampleFinder|samples/' + name;
                    const id = 'sampleFinder|samples/' + name + '-' + filterChangeCounter;
                    configs[id] = {
                        id,
                        title: name,
                        schemaQuery: SchemaQuery.create(SCHEMAS.SAMPLE_SETS.SCHEMA, name),
                        requiredColumns,
                        omittedColumns,
                        baseFilters,
                    }
                });
                setQueryConfigs(configs);
                console.log('configs', configs);
            }
            catch (error) {
                setErrors(resolveErrorMessage(error))
            }
        })();

    }, [cards, user, filterChangeCounter])

    if (errors)
        return <Alert>{errors}</Alert>;

    if (!queryConfigs)
        return <LoadingSpinner/>;

    return <SampleFinderSamplesWithQueryModels key={filterChangeCounter} user={user} {...gridProps} autoLoad queryConfigs={queryConfigs} />;
});
