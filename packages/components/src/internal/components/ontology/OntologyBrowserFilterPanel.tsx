import React, { FC, memo, useCallback, useEffect, useState } from 'react';
import { Filter } from '@labkey/api';

import { OntologyBrowserPanel, OntologyBrowserProps } from './OntologyBrowserPanel';
import { PathModel } from './models';
import { fetchPathsForCodes } from './actions';

interface OntologyBrowserFilterPanelProps extends OntologyBrowserProps {
    ontologyId: string;
    filterValue: string;
    filterType: Filter.IFilterType;
    onFilterChange: (filterValue: string) => void;
}

export const OntologyBrowserFilterPanel: FC<OntologyBrowserFilterPanelProps> = memo(props => {
    const { ontologyId, filterValue, onFilterChange, filterType } = props;
    const [filteredConcepts, setFilteredConcepts] = useState<Map<string, PathModel>>(new Map());

    const updateFilters = useCallback(
        async (filterString:string) => {
            const filterArray = filterString?.split(';') || [];
            const paths = await fetchPathsForCodes(filterArray);

            const filterModels = new Map<string, PathModel>(paths.map(model => [model.code, model]));
            setFilteredConcepts(filterModels);
        },
        [filterValue, filteredConcepts, setFilteredConcepts]
    );

    useEffect(() => {
        updateFilters(filterValue);
    }, [filterValue]);

    const filterChangeHandler = useCallback(
        (model: PathModel) => {
            const newFilter = new Map([...filteredConcepts]);
            if (!newFilter.delete(model.code)) {
                if (!filterType?.isMultiValued()) {
                    newFilter.clear();
                }

                newFilter.set(model.code, model);
            }

            setFilteredConcepts(newFilter);

            const newFilterString = [...newFilter.keys()].join(';');
            onFilterChange?.(newFilterString);
        },
        [filterType, filteredConcepts, setFilteredConcepts, onFilterChange]
    );

    return (
        <>
            <OntologyBrowserPanel
                asPanel={false}
                hideConceptInfo={true}
                initOntologyId={ontologyId}
                filters={filteredConcepts}
                filterChangeHandler={filterChangeHandler}
            />
        </>
    );
});
