import React, { FC, memo, useCallback, useEffect, useState } from 'react';
import { Col, Row } from 'react-bootstrap';

import { Alert, LabelHelpTip, LoadingSpinner } from '../../..';

import { fetchAlternatePaths, fetchConceptForCode, getOntologyDetails } from './actions';
import { ConceptModel, OntologyModel, PathModel } from './models';
import { ConceptInformationTabs } from './ConceptInformationTabs';
import { OntologyTreePanel } from './OntologyTreePanel';
import { OntologySelectionPanel } from './OntologySelectionPanel';
import { OntologyTreeSearchContainer } from './OntologyTreeSearchContainer';

export interface OntologyBrowserProps {
    initOntologyId?: string;
    asPanel?: boolean;
    onPathSelect?: (path: PathModel, concept: ConceptModel) => void;
    hideConceptInfo?: boolean;
    filters?: Map<string, PathModel>;
    filterChangeHandler?: (filter: PathModel) => void;
    initConcept?: ConceptModel;
}

export const OntologyBrowserPanel: FC<OntologyBrowserProps> = memo(props => {
    const {
        initOntologyId,
        asPanel,
        onPathSelect,
        hideConceptInfo = false,
        filters,
        filterChangeHandler,
        initConcept,
    } = props;
    const [error, setError] = useState<string>();
    const [selectedOntologyId, setSelectedOntologyId] = useState<string>();
    const [ontology, setOntologyModel] = useState<OntologyModel>();
    const [selectedConcept, setSelectedConcept] = useState<ConceptModel>(initConcept);
    const [selectedPath, setSelectedPath] = useState<PathModel>();
    const [alternatePath, setAlternatePath] = useState<PathModel>();
    const [conceptCache, setConceptCache] = useState<Map<string, ConceptModel>>(new Map<string, ConceptModel>());
    const ontologyId = selectedOntologyId ?? (!error ? initOntologyId : undefined);

    const cacheConcepts = useCallback(
        (concepts: ConceptModel[]): void => {
            concepts.forEach((concept): void => {
                if (!conceptCache.has(concept.code)) {
                    conceptCache.set(concept.code, concept);
                }
            });
            setConceptCache(new Map(conceptCache));
        },
        [conceptCache, setConceptCache]
    );

    const onSelectedPathChange = useCallback(
        async (path: PathModel, isAlternatePath = false): Promise<void> => {
            if (path === undefined) {
                return;
            }

            const { code } = path;
            if (!conceptCache.has(code)) {
                const concept = await fetchConceptForCode(code);
                cacheConcepts([concept]);
            }

            if (isAlternatePath) {
                setAlternatePath(path);
            } else {
                setSelectedPath(path);
                if (!path.hasChildren) {
                    filterChangeHandler?.(path);
                }
            }
        },
        [conceptCache, setSelectedPath, setAlternatePath]
    );

    const onOntologySelection = useCallback(
        (name: string, value: string, model: PathModel) => {
            setSelectedOntologyId(model?.path.replace(/\//g, ''));
        },
        [setSelectedOntologyId]
    );

    const setInitialConceptPath = async (code: string) => {
        if (code != null) {
            const paths = await fetchAlternatePaths(code);
            onSelectedPathChange(paths?.[0], true);
        }
    };

    useEffect(() => {
        if (ontologyId) {
            getOntologyDetails(ontologyId)
                .then((ontology: OntologyModel) => {
                    setOntologyModel(ontology);
                    setInitialConceptPath(initConcept?.code);
                })
                .catch(() => {
                    setError('Error: unable to load ontology concept information for ' + ontologyId + '.');
                    setSelectedOntologyId(undefined);
                });
        } else {
            setOntologyModel(undefined);
        }
    }, [initConcept, setOntologyModel, selectedOntologyId, setSelectedOntologyId, setError]);

    useEffect(() => {
        if (selectedPath?.code) {
            const concept = conceptCache.get(selectedPath.code);
            setSelectedConcept(concept);
            onPathSelect?.(selectedPath, concept);
        }
    }, [selectedPath, conceptCache, setSelectedConcept, onPathSelect]);

    return (
        <>
            <Alert>{error}</Alert>
            {!ontologyId && <OntologySelectionPanel onOntologySelection={onOntologySelection} asPanel={asPanel} />}
            {ontologyId && (
                <OntologyBrowserPanelImpl
                    ontology={ontology}
                    selectedConcept={selectedConcept}
                    alternatePath={alternatePath}
                    selectedPath={selectedPath}
                    setSelectedPath={onSelectedPathChange}
                    asPanel={asPanel}
                    hideConceptInfo={hideConceptInfo}
                    filters={filters}
                    onFilterChange={filterChangeHandler}
                />
            )}
        </>
    );
});

OntologyBrowserPanel.defaultProps = {
    asPanel: true,
};

interface OntologyBrowserPanelImplProps {
    ontology: OntologyModel;
    selectedConcept?: ConceptModel;
    alternatePath?: PathModel;
    selectedPath?: PathModel;
    setSelectedPath: (path: PathModel, isAlternatePath?: boolean) => void;
    asPanel: boolean;
    hideConceptInfo?: boolean;
    filters?: Map<string, PathModel>;
    onFilterChange?: (changedNode: PathModel) => void;
}

// exported for jest testing
export const OntologyBrowserPanelImpl: FC<OntologyBrowserPanelImplProps> = memo(props => {
    const { ontology, selectedConcept, alternatePath, selectedPath, setSelectedPath, asPanel, hideConceptInfo, filters, onFilterChange } = props;

    if (!ontology) {
        return <LoadingSpinner />;
    }

    const { conceptCount, description } = ontology;
    const root = ontology.getPathModel();

    const body = (
        <Row className={hideConceptInfo ? 'filter-panel-row' : ''}>
            <Col xs={hideConceptInfo ? 12 : 6} className={hideConceptInfo ? '' : 'left-panel'}>
                <OntologyTreeSearchContainer ontology={ontology} searchPathClickHandler={setSelectedPath} />
                <OntologyTreePanel root={root} onNodeSelection={setSelectedPath} alternatePath={alternatePath} showFilterIcon={hideConceptInfo} filters={filters} onFilterChange={onFilterChange} />
            </Col>
            {!hideConceptInfo && (
                <Col xs={6} className="right-panel">
                    <ConceptInformationTabs
                        concept={selectedConcept}
                        selectedPath={selectedPath}
                        alternatePathClickHandler={setSelectedPath}
                    />
                </Col>
            )}
        </Row>
    );

    if (!asPanel) {
        return <div className="ontology-browser-container">{body}</div>;
    }

    return (
        <div className="panel panel-default ontology-browser-container">
            <div className="panel-heading">
                Browse {ontology.getDisplayName()}
                &nbsp;
                <LabelHelpTip
                    title="Ontology Details"
                    placement="bottom"
                    iconComponent={<i className="fa fa-info-circle" />}
                >
                    {description && <p className="ontology-description">{description}</p>}
                    <p className="ontology-concept-count">{Number(conceptCount).toLocaleString()} total concepts</p>
                </LabelHelpTip>
            </div>
            <div className="panel-body">{body}</div>
        </div>
    );
});
