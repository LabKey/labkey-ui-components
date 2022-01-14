import React, { ComponentType, FC, memo, useCallback, useEffect, useState } from 'react';

import { AuditBehaviorTypes, Filter } from '@labkey/api';

import { capitalizeFirstChar } from '../../util/utils';
import { EntityDataType } from '../entities/models';
import { Section } from '../base/Section';
import { SchemaQuery } from '../../../public/SchemaQuery';

import { SamplesTabbedGridPanel } from '../samples/SamplesTabbedGridPanel';
import { SAMPLE_DATA_EXPORT_CONFIG } from '../samples/constants';
import {
    InjectedQueryModels,
    RequiresModelAndActions,
    withQueryModels
} from '../../../public/QueryModel/withQueryModels';
import { User } from '../base/models/User';
import { SamplesEditableGridProps } from '../samples/SamplesEditableGrid';

import { EntityFieldFilterModal } from './EntityFieldFilterModal';

import { FilterCardProps, FilterCards } from './FilterCards';
import { getFinderStartText, getFinderViewColumnsConfig } from './utils';
import { SamplesManageButtonSections } from '../samples/utils';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { getSampleFinderQueryConfigs, saveFinderGridView } from './actions';
import { Alert } from '../base/Alert';
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

const LOCAL_STORAGE_KEY = "FinderFilterCards";

export const SampleFinderSection: FC<Props> = memo(props => {
    const { parentEntityDataTypes, ...gridProps } = props;

    const [filterChangeCounter, setFilterChangeCounter] = useState<number>(0);
    const [chosenEntityType, setChosenEntityType] = useState<EntityDataType>(undefined);
    const [filterCards, setFilterCards] = useState<FilterCardProps[]>([]);

    useEffect(() => {
        const storedCardsStr = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedCardsStr) {
            setFilterCards(JSON.parse(storedCardsStr));
        }
    }, []);

    const onAddEntity = useCallback((entityType: EntityDataType) => {
        setChosenEntityType(entityType);
    }, []);

    const onFilterEdit = useCallback(
        (index: number) => {
            setFilterChangeCounter(filterChangeCounter+1);
            setChosenEntityType(parentEntityDataTypes[index]);
            // TODO This is just a reminder to do this when editing is implemented (if localStorage is still used)
            // localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newFilterCards));
        },
        [parentEntityDataTypes, filterChangeCounter]
    );

    const onFilterDelete = useCallback(
        (index: number) => {
            const newFilterCards = [...filterCards];
            newFilterCards.splice(index, 1);
            setFilterCards(newFilterCards);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newFilterCards));
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
            });
            onFilterClose();
            setFilterCards(newFilterCards);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newFilterCards));
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
                        }))}
                        onAddEntity={onAddEntity}
                    />
                    <div className="filter-hint">{getFinderStartText(parentEntityDataTypes)}</div>
                </>
            ) : (
                <>
                    <FilterCards cards={filterCards} onFilterDelete={onFilterDelete} onAddEntity={onAddEntity}/>
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
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const allLoaded = Object.values(queryModels).filter(model => model.isLoading).length == 0;
        if (allLoaded) {
            const promises = [];
            for (const queryModel of Object.values(queryModels)) {
                const {hasUpdates, columns} = getFinderViewColumnsConfig(queryModel);
                if (hasUpdates) {
                    promises.push(saveFinderGridView(columns, queryModel.schemaQuery));
                }
            }
            Promise.all(promises).then(() => {
                setIsLoading(false);
            });
        }
    }, [queryModels]);
    //
    // useEffect(() => {
    //     return () => {
    //         if (queryModels) {
    //             for (const queryModel of Object.values(queryModels)) {
    //                 (async () => {
    //                     try {
    //                         await removeFinderGridView(queryModel);
    //                     }
    //                     catch (error) {
    //                         // ignore; already logged
    //                     }
    //                 })();
    //             }
    //         }
    //     }
    // }, []);

    if (isLoading)
        return <LoadingSpinner />;

    return (
        <>
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
                    excludeStartJob: true,
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
    const [queryConfigs, setQueryConfigs] = useState<{ [key: string]: QueryConfig }>(undefined);
    const [errors, setErrors] = useState<string>(undefined);

    useEffect(() => {
        (async () => {
            try {
                setQueryConfigs(undefined);
                const configs = await getSampleFinderQueryConfigs(user, cards, filterChangeCounter);
                setQueryConfigs(configs);
            }
            catch (error) {
                setErrors(error);
            }
        })();
    }, [cards, user, filterChangeCounter])

    if (errors)
        return <Alert>{errors}</Alert>;

    if (!queryConfigs)
        return <LoadingSpinner/>;

    return <SampleFinderSamplesWithQueryModels key={filterChangeCounter} user={user} {...gridProps} autoLoad queryConfigs={queryConfigs} />;
});
