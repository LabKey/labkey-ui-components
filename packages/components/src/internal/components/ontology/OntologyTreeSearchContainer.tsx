import React, { ChangeEvent, FC, memo, MouseEvent, useCallback, useEffect, useMemo, useState } from 'react';

import { Alert } from '../base/Alert';

import { searchUsingIndex } from '../search/actions';
import { SearchCategory } from '../search/constants';

import { ConceptModel, OntologyModel, PathModel } from './models';
import { fetchAlternatePaths, getOntologyDetails } from './actions';

const SEARCH_LIMIT = 20;

interface OntologyTreeSearchContainerProps {
    className?: string;
    initCode?: string;
    inputName?: string;
    onChangeListener?: (val: string) => void;
    ontology: OntologyModel;
    searchPathClickHandler: (path: PathModel, isAlternatePath?: boolean) => void;
}

export const OntologyTreeSearchContainer: FC<OntologyTreeSearchContainerProps> = memo(props => {
    const {
        ontology,
        searchPathClickHandler,
        inputName = 'concept-search',
        className = 'form-control',
        initCode = '',
        onChangeListener,
    } = props;
    const [isFocused, setIsFocused] = useState<boolean>();
    const [searchTerm, setSearchTerm] = useState<string>(initCode);
    const [searchHits, setSearchHits] = useState<ConceptModel[]>();
    const [totalHits, setTotalHits] = useState<number>();
    const [error, setError] = useState<string>();
    const [showResults, setShowResults] = useState<boolean>(false);

    useEffect(() => {
        if (searchTerm !== initCode) {
            setSearchTerm(initCode);
        }
    }, [initCode]); // Only trigger when the initCode value is changed, this can happen when the user selects a value via the picker

    const onSearchChange = useCallback(
        (evt: ChangeEvent<HTMLInputElement>) => {
            const { value } = evt.currentTarget;
            setSearchTerm(value?.length > 2 ? value : undefined);
            onChangeListener?.(value);
        },
        [onChangeListener]
    );

    const onSearchFocus = useCallback(() => {
        setIsFocused(true);
    }, []);
    const onSearchBlur = useCallback(() => {
        setIsFocused(false);
    }, []);

    useEffect(() => {
        setError(undefined);
        setTotalHits(undefined);
        setSearchHits(undefined);

        if (searchTerm) {
            const timeOutId = setTimeout(() => {
                searchUsingIndex(
                    {
                        q: getOntologySearchTerm(ontology, searchTerm),
                        category: SearchCategory.Concept,
                        limit: SEARCH_LIMIT,
                    },
                    undefined,
                    [SearchCategory.Concept]
                )
                    .then(response => {
                        setSearchHits(
                            response.hits.map(hit => {
                                return new ConceptModel({
                                    code: hit.id.substring(hit.id.indexOf(':') + 1), // Trim off category code from doc id
                                    label: hit.title,
                                    description: hit.summary.split('\n')[1], // format is "<code> <label>\n<description>" see ConceptDocumentProvider
                                });
                            })
                        );
                        setTotalHits(response.totalHits);
                    })
                    .catch(reason => {
                        console.error(reason);
                        setError('Error: unable to get search results. Check for syntax errors in your search term.');
                    });
            }, 500);

            return () => clearTimeout(timeOutId);
        }
    }, [ontology, searchTerm]);

    const onItemClick = useCallback(
        async (evt: MouseEvent<HTMLLIElement>, code: string) => {
            // for now, we will just send the user to the first path for this concept, in the future we'll add in UI
            // that lets the user select if more than one path exists for the concept
            const codePaths = await fetchAlternatePaths(code);
            if (codePaths?.length > 0) {
                searchPathClickHandler(codePaths[0], true);
            }
            setSearchTerm(code);
        },
        [searchPathClickHandler]
    );

    const keyHandler = useCallback((evt: React.KeyboardEvent<HTMLElement>) => {
        switch (evt.key) {
            case 'Escape':
                setShowResults(false);
                evt.stopPropagation();
                evt.preventDefault();
                return true;
            default:
                setShowResults(true);
                return false;
        }
    }, []);

    return (
        <div className="concept-search-container">
            <input
                type="text"
                className={className}
                name={inputName}
                placeholder={'Search ' + ontology.abbreviation}
                onChange={onSearchChange}
                onFocus={onSearchFocus}
                onBlur={onSearchBlur}
                onKeyUp={keyHandler}
                value={searchTerm}
            />
            {showResults && (
                <OntologySearchResultsMenu
                    searchHits={searchHits}
                    totalHits={totalHits}
                    isFocused={isFocused}
                    error={error}
                    onItemClick={onItemClick}
                />
            )}
        </div>
    );
});

interface OntologySearchResultsMenuProps {
    error: string;
    isFocused: boolean;
    onItemClick: (evt: MouseEvent<HTMLLIElement>, code: string) => void;
    searchHits: ConceptModel[];
    totalHits: number;
}

// exported for jest testing
export const OntologySearchResultsMenu: FC<OntologySearchResultsMenuProps> = memo(props => {
    const { searchHits, isFocused, totalHits, error, onItemClick } = props;
    const showMenu = useMemo(
        () => isFocused && (searchHits !== undefined || error !== undefined),
        [isFocused, searchHits, error]
    );
    const hitsHaveDescriptions = useMemo(
        () => searchHits?.findIndex(hit => hit.description !== undefined) > -1,
        [searchHits]
    );

    if (!showMenu) {
        return null;
    }

    return (
        <div>
            <ul className="result-menu container">
                <Alert>{error}</Alert>
                {searchHits?.length === 0 && (
                    <li key="none">
                        <div className="row">
                            <div className="col col-xs-12">No search results found.</div>
                        </div>
                    </li>
                )}
                {searchHits?.map(hit => (
                    <li
                        key={hit.code}
                        className="selectable-item"
                        role="option"
                        onMouseDown={evt => onItemClick(evt, hit.code)}
                    >
                        <div className="row">
                            <div className={'col bold ' + (hitsHaveDescriptions ? 'col-xs-5' : 'col-xs-10')}>
                                {hit.label}
                            </div>
                            <div className="col col-xs-2">{hit.code}</div>
                            {hitsHaveDescriptions && <div className="col col-xs-5">{hit.description}</div>}
                        </div>
                    </li>
                ))}
                {searchHits?.length < totalHits && (
                    <div className="result-footer">
                        {Number(totalHits).toLocaleString()} results found. Update your search term to further refine
                        your results.
                    </div>
                )}
            </ul>
        </div>
    );
});

interface OntologySearchInputProps
    extends Omit<OntologyTreeSearchContainerProps, 'ontology' | 'searchPathClickHandler' | 'onChangeListener'> {
    ontologyId: string;
    searchPathChangeHandler: (code: string) => void;
}

export const OntologySearchInput: FC<OntologySearchInputProps> = memo(props => {
    const { ontologyId, searchPathChangeHandler, ...rest } = props;
    const [ontologyModel, setOntologyModel] = useState<OntologyModel>();
    const [error, setError] = useState<string>();

    useEffect(() => {
        if (ontologyId) {
            getOntologyDetails(ontologyId)
                .then((ontology: OntologyModel) => {
                    setOntologyModel(ontology);
                })
                .catch(() => {
                    setError('Error: unable to load ontology concept information for ' + ontologyId + '.');
                });
        }
    }, [ontologyId]);

    const onSearchClickHandler = useCallback(
        (path: PathModel) => {
            searchPathChangeHandler(path.code);
        },
        [searchPathChangeHandler]
    );

    const onChangeHandler = useCallback(
        val => {
            searchPathChangeHandler(val);
        },
        [searchPathChangeHandler]
    );

    return (
        <>
            <Alert>{error}</Alert>
            {ontologyModel && (
                <OntologyTreeSearchContainer
                    {...rest}
                    ontology={ontologyModel}
                    searchPathClickHandler={onSearchClickHandler}
                    onChangeListener={onChangeHandler}
                />
            )}
        </>
    );
});

// exported for jest testing
export function getOntologySearchTerm(ontology: OntologyModel, searchTerm: string): string {
    // Quotes are needed to escape the ':' and the open term allows more flexible search of multi-token terms, e.g. ABC T
    return `+ontology:${ontology.abbreviation} AND ("${searchTerm}" OR ${searchTerm})`;
}
