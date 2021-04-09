import React, { FC, memo, useCallback, useEffect, useState } from 'react';
import { Col, Row } from 'react-bootstrap';

import { Alert, LabelHelpTip, LoadingSpinner } from '../../..';

import { fetchConceptForCode, getOntologyDetails } from './actions';
import { ConceptModel, OntologyModel, PathModel } from './models';
import { ConceptInformationTabs } from './ConceptInformationTabs';
import { OntologyTreePanel } from './OntologyTreePanel';
import { OntologySelectionPanel } from './OntologySelectionPanel';
import { OntologyTreeSearchContainer } from './OntologyTreeSearchContainer';

export interface OntologyBrowserProps {
    initOntologyId?: string;
    asPanel?: boolean;
    onConceptSelect?: (concept: ConceptModel) => void;
    hideConceptInfo?: boolean;
    initialConcept?: ConceptModel;
}

export const OntologyBrowserPanel: FC<OntologyBrowserProps> = memo(props => {
    const { initOntologyId, asPanel, onConceptSelect, hideConceptInfo = false, initialConcept = undefined } = props;
    const [error, setError] = useState<string>();
    const [selectedOntologyId, setSelectedOntologyId] = useState<string>();
    const [ontology, setOntologyModel] = useState<OntologyModel>();
    const [selectedConcept, setSelectedConcept] = useState<ConceptModel>(initialConcept);
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
            const { code } = path;
            if (!conceptCache.has(code)) {
                const concept = await fetchConceptForCode(code);
                cacheConcepts([concept]);
            }

            if (isAlternatePath) {
                setAlternatePath(path);
            } else {
                setSelectedPath(path);
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

    useEffect(() => {
        if (ontologyId) {
            getOntologyDetails(ontologyId)
                .then(setOntologyModel)
                .catch(() => {
                    setError('Error: unable to load ontology concept information for ' + ontologyId + '.');
                    setSelectedOntologyId(undefined);
                });
        } else {
            setOntologyModel(undefined);
        }
    }, [setOntologyModel, selectedOntologyId, setSelectedOntologyId, setError]);

    useEffect(() => {
        if (selectedPath?.code) {
            const concept = conceptCache.get(selectedPath.code);
            setSelectedConcept(concept);
            onConceptSelect?.(concept);
        }
    }, [selectedPath, conceptCache, setSelectedConcept, onConceptSelect]);

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
}

// exported for jest testing
export const OntologyBrowserPanelImpl: FC<OntologyBrowserPanelImplProps> = memo(props => {
    const { ontology, selectedConcept, alternatePath, selectedPath, setSelectedPath, asPanel, hideConceptInfo } = props;

    if (!ontology) {
        return <LoadingSpinner />;
    }

    const { conceptCount, description } = ontology;
    const root = ontology.getPathModel();

    const body = (
        <Row>
            <Col xs={hideConceptInfo ? 12 : 6} className="left-panel">
                <OntologyTreeSearchContainer ontology={ontology} searchPathClickHandler={setSelectedPath} />
                <OntologyTreePanel root={root} onNodeSelection={setSelectedPath} alternatePath={alternatePath} />
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
