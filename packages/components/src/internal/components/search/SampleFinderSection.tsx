import React, { FC, memo, useCallback, useState } from 'react';
import { Section } from '../base/Section';
import { EntityDataType } from '../entities/models';
import { capitalizeFirstChar } from '../../util/utils';
import { EntityFieldFilterModal } from './EntityFieldFilterModal';
import { AuditBehaviorTypes, Filter } from '@labkey/api';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { FilterCardProps, FilterCards } from './FilterCards';
import { SamplesTabbedGridPanel } from '../samples/SamplesTabbedGridPanel';
import { SAMPLE_DATA_EXPORT_CONFIG, SAMPLE_STATUS_REQUIRED_COLUMNS } from '../samples/constants';
import { SCHEMAS } from '../../schemas';
import { InjectedQueryModels, withQueryModels } from '../../../public/QueryModel/withQueryModels';
import { User } from '../base/models/User';
import { SamplesEditableGridProps } from '../samples/SamplesEditableGrid';
import { getFinderStartText } from './utils';

const SAMPLE_FINDER_TITLE = "Find Samples";
const SAMPLE_FINDER_CAPTION = "Find samples that meet all of these criteria";

interface SampleFinderSamplesGridProps {
    user: User;
    getSampleAuditBehaviorType: () => AuditBehaviorTypes;
    samplesEditableGridProps: Partial<SamplesEditableGridProps>;
}

interface Props extends SampleFinderSamplesGridProps {
    parentEntityDataTypes: EntityDataType[];
}

interface SampleFinderHeaderProps {
    parentEntityDataTypes: EntityDataType[],
    onAddEntity: (entityType: EntityDataType) => void;
}

export const SampleFinderHeaderButtons: FC<SampleFinderHeaderProps> = memo(props => {
    const { parentEntityDataTypes, onAddEntity } = props;

    return (
        <div>
            Search by:
            {parentEntityDataTypes.map((parentEntityType) => (
                <button key={parentEntityType.nounSingular} className="btn btn-default margin-left" onClick={() => { onAddEntity(parentEntityType) }}>
                    <i className="fa fa-plus-circle container--addition-icon" /> {capitalizeFirstChar(parentEntityType.nounAsParentSingular)} Properties
                </button>
            ))}
        </div>
    )
});

export const SampleFinderSection: FC<Props> = memo((props) => {
    const { parentEntityDataTypes, ...gridProps } = props;

    const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
    const [chosenEntityType, setChosenEntityType] = useState<EntityDataType>(undefined);
    const [filterCards, setFilterCards] = useState<FilterCardProps[]>([]);

    const onAddEntity = useCallback((entityType: EntityDataType) => {
        setChosenEntityType(entityType);
        setShowFilterModal(true);
    }, []);

    const onFilterEdit = useCallback((index: number) => {
        console.log("onFilterEdit for index " + index + ": Not yet implemented.");
        setShowFilterModal(true);
    }, [filterCards]);

    const onFilterDelete = useCallback((index: number) => {
        const newFilterCards = [...filterCards];
        newFilterCards.splice(index, 1);
        setFilterCards(newFilterCards);
    }, [filterCards]);

    const onFilterClose = () => {
        setShowFilterModal(false);
    };

    const onFind = useCallback((schemaQuery: SchemaQuery, filterArray: Filter.IFilter[])  => {
        onFilterClose();
        let newFilterCards = [...filterCards];
        newFilterCards.push({
            schemaQuery,
            filterArray,
            entityDataType: chosenEntityType,
            index: filterCards.length,
            onAdd: onAddEntity,
            onDelete: onFilterDelete,
        });
        setFilterCards(newFilterCards);
    }, [setFilterCards, filterCards, onFilterEdit, onFilterDelete, chosenEntityType]);

    return (
        <Section title={SAMPLE_FINDER_TITLE} caption={SAMPLE_FINDER_CAPTION} context={(
            <SampleFinderHeaderButtons parentEntityDataTypes={parentEntityDataTypes} onAddEntity={onAddEntity}/>
        )}
        >
            {filterCards.length == 0 ?
                <>
                    <FilterCards className="empty" cards={parentEntityDataTypes.map((entityDataType) => ({
                        entityDataType,
                        onAdd: onAddEntity
                    }))} />
                    <div className="filter-hint">{getFinderStartText(parentEntityDataTypes)}</div>
                </>
                :
                <>
                    <FilterCards cards={filterCards} />
                    <SampleFinderSamples
                        {...gridProps}
                        cards={filterCards}
                    />
                </>
            }
            {showFilterModal && (
                <EntityFieldFilterModal
                    onCancel={onFilterClose}
                    entityDataType={chosenEntityType}
                    onFind={onFind}
                />
            )}
        </Section>
    )
});

interface SampleFinderSamplesProps extends SampleFinderSamplesGridProps {
    cards: FilterCardProps[];
}

export const SampleFinderSamplesImpl: FC<SampleFinderSamplesProps & InjectedQueryModels> = memo(props => {
    const { actions, queryModels } = props;

    return(
        <>
            <h4>Filtering and sample-type tabs coming soon...</h4>
            <SamplesTabbedGridPanel
                {...props}
                withTitle={false}
                asPanel={false}
                actions={actions}
                queryModels={queryModels}
                tabbedGridPanelProps={{
                    alwaysShowTabs: true,
                    advancedExportOptions: SAMPLE_DATA_EXPORT_CONFIG,
                }}
            />
        </>
    )
});

// exported for jest testing
export const SampleFinderSamplesWithQueryModels = withQueryModels<SampleFinderSamplesProps>(SampleFinderSamplesImpl);


// exported for jest testing
export const SampleFinderSamples: FC<SampleFinderSamplesProps> = memo((props) => {
    const { cards } = props;

    const baseFilters = [];
    // TODO this is not really correct.  Probably there will be a specialized filter type used for these lineage queries.
    // cards.forEach(card => {
    //     if (card.filterArray.length) {
    //         baseFilters.push(...card.filterArray);
    //     } else  {
    //         baseFilters.push(card.entityDataType.inputColumnName.replace("First", card.schemaQuery.queryName), null, Filter.Types.NONBLANK);
    //     }
    // });

    const queryConfigs = {
        'allSamples': {
            id: 'allSamples',
            title: 'All Samples',
            schemaQuery: SCHEMAS.EXP_TABLES.MATERIALS,
            requiredColumns: SAMPLE_STATUS_REQUIRED_COLUMNS,
        }
    }

    return (
        <SampleFinderSamplesWithQueryModels
            {...props}
            autoLoad={false}
            queryConfigs={queryConfigs}
        />
    )
});
