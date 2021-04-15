import React, { FC, memo, useCallback, useEffect, useState } from 'react';
import { OntologyBrowserPanel, OntologyBrowserProps } from './OntologyBrowserPanel';
import { PathModel } from './models';
import { fetchPathsForCodes } from './actions';

interface OntologyBrowserFilterPanelProps extends OntologyBrowserProps {
    ontologyId: string;
    filterValue: string;
    onFilterChange: (filterValue: string) => void;
}

export const OntologyBrowserFilterPanel: FC<OntologyBrowserFilterPanelProps> = memo(props => {
    const { ontologyId, filterValue, onFilterChange } = props;
    const [filters, setFilters] = useState<Map<string, PathModel>>(new Map());

    const updateFilters = useCallback(
        async (filterString:string) => {
            const filterArray = filterString.split(';');
            //TODO retreive from server
            // const paths = await fetchPathsForCodes(filterArray);
            const paths = filterArray.map(code => new PathModel({ code }));

            const filterModels = new Map<string, PathModel>(
                paths.map(model => [model.code, model])
            );
            setFilters(filterModels);
        },
        [filterValue, filters, setFilters]
    );

    useEffect(() => {
        updateFilters(filterValue);
    }, [filterValue]);

    const filterChangeHandler = useCallback(
        (model: PathModel) => {
            if (filters && !filters.delete(model.code)) {
                filters.set(model.code, model);
            }

            const newFilter = new Map([...filters]);
            setFilters(newFilter);

            const newFilterString = [...filters.keys()].join(';');
            onFilterChange?.(newFilterString);
        },
        [filters, setFilters, onFilterChange]
    );

    return (
        <>
            <OntologyBrowserPanel
                asPanel={false}
                hideConceptInfo={true}
                initOntologyId={ontologyId}
                filters={filters}
                filterChangeHandler={filterChangeHandler}
            />
        </>
    );
});
