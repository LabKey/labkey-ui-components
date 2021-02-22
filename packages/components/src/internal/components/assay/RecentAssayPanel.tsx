import React, { FC, useCallback, useMemo, useState } from 'react';
import { Button, DropdownButton, MenuItem } from 'react-bootstrap';
import { Filter } from '@labkey/api';

import {
    AppURL,
    AssayDefinitionModel,
    GridPanelWithModel,
    isLoading,
    LoadingSpinner,
    naturalSortByProperty,
    SCHEMAS,
    Section,
    QuerySort,
    User,
} from '../../..';

import { AssayDesignEmptyAlert } from './AssayDesignEmptyAlert';
import { GENERAL_ASSAY_PROVIDER_NAME } from './actions';
import { InjectedAssayModel, withAssayModels } from './withAssayModels';

const ALL_ASSAYS_LABEL = 'All Assays';

interface Props {
    assayFilter?: (assayDefinition: AssayDefinitionModel) => boolean;
    user: User;
}

// Exported for jest testing
export const RecentAssayPanelImpl: FC<Props & InjectedAssayModel> = props => {
    const { assayFilter, assayModel, user } = props;
    const [selectedAssayId, setSelectedAssayId] = useState<number>(undefined);

    const assayItems = useMemo(() => {
        return assayModel.definitions.filter(assayFilter).sort(naturalSortByProperty('name'));
    }, [assayFilter, assayModel.definitions]);

    const selectedItem = useMemo(() => {
        return assayItems.find(item => item.id === selectedAssayId);
    }, [assayItems, selectedAssayId]);

    const canInsert = user.hasInsertPermission();
    const hasItems = assayItems.length > 0;
    const isLoaded = !isLoading(assayModel.definitionsLoadingState);

    const clearSelection = useCallback(() => {
        setSelectedAssayId(undefined);
    }, []);

    const onItemSelect = useCallback((selectedId?: number) => {
        setSelectedAssayId(selectedId);
    }, []);

    const queryConfig = useMemo(() => {
        // start with only "current" (i.e. non-replaced) assay runs and then optionally filter by a single assay protocol
        const baseFilters = [Filter.create('Replaced', false)];
        if (selectedItem) {
            baseFilters.push(Filter.create('Protocol/RowId', selectedItem.id));
        } else {
            baseFilters.push(Filter.create('Type', GENERAL_ASSAY_PROVIDER_NAME));
        }

        return {
            baseFilters,
            id: `recent-assays-${selectedItem?.id}`,
            maxRows: 5,
            omittedColumns: ['Flag', 'ModifiedBy', 'Protocol', 'Type', 'Replaced'],
            requiredColumns: ['rowId', 'Name', 'Created', 'CreatedBy'],
            schemaQuery: SCHEMAS.EXP_TABLES.ASSAY_RUNS,
            sorts: [new QuerySort({ fieldKey: 'Created', dir: '-' })],
        };
    }, [selectedItem]);

    return (
        <Section title="Recent Assay Data" titleSize="medium">
            {!isLoaded && <LoadingSpinner />}
            {isLoaded && !hasItems && <AssayDesignEmptyAlert user={user} />}
            {isLoaded && hasItems && (
                <>
                    <DropdownButton
                        className="button-right-spacing"
                        id="recent-assays-dropdown"
                        title={selectedItem ? selectedItem.name : ALL_ASSAYS_LABEL}
                    >
                        <MenuItem active={selectedAssayId === undefined} key="all" onClick={clearSelection}>
                            {ALL_ASSAYS_LABEL}
                        </MenuItem>

                        {assayItems?.map(assay => (
                            <MenuItem
                                active={selectedAssayId === assay.id}
                                key={assay.id}
                                onClick={() => onItemSelect(assay.id)}
                            >
                                {assay.name}
                            </MenuItem>
                        ))}
                    </DropdownButton>
                    {!!selectedItem && canInsert && (
                        <Button
                            bsStyle="primary"
                            className="recent-assays_import-btn"
                            href={AppURL.create('assays', selectedItem.id, 'upload').toHref()}
                        >
                            Import Data
                        </Button>
                    )}
                    <div className="margin-top">
                        <GridPanelWithModel
                            asPanel={false}
                            allowSelections={false}
                            allowSorting={false}
                            showButtonBar={false}
                            showOmniBox={false}
                            queryConfig={queryConfig}
                        />
                    </div>
                </>
            )}
        </Section>
    );
};

RecentAssayPanelImpl.defaultProps = {
    assayFilter: () => true,
};

export const RecentAssayPanel = withAssayModels(RecentAssayPanelImpl);
