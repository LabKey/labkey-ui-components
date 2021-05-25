import React, { FC, memo, useCallback, useEffect, useState } from 'react';
import { Button, Modal } from 'react-bootstrap';

import { OntologyBrowserPanel } from './OntologyBrowserPanel';
import { ConceptModel } from './models';
import { fetchConceptForCode } from './actions';

interface OntologyBrowserModalProps {
    title: string;
    initOntologyId?: string;
    successBsStyle?: string;
    onCancel: () => void;
    onApply: (concept: ConceptModel) => void;
    initConcept?: ConceptModel;
}

export const OntologyBrowserModal: FC<OntologyBrowserModalProps> = memo(props => {
    const { title, initOntologyId, successBsStyle, onCancel, onApply, initConcept } = props;
    const [selectedConcept, setSelectedConcept] = useState<ConceptModel>();

    const onApplyClick = useCallback(() => {
        onApply(selectedConcept);
    }, [onApply, selectedConcept]);

    const onConceptSelect = useCallback( (concept: ConceptModel) => {
        setSelectedConcept(concept);
    }, [setSelectedConcept]);

    return (
        <Modal bsSize="large" show={true} onHide={onCancel}>
            <Modal.Header closeButton>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <OntologyBrowserPanel
                    asPanel={false}
                    initOntologyId={initOntologyId}
                    onConceptSelect={onConceptSelect}
                    initConcept={initConcept}
                />
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={onCancel} className="domain-adv-footer domain-adv-cancel-btn">
                    Cancel
                </Button>
                <Button
                    className="domain-adv-footer domain-adv-apply-btn pull-right"
                    disabled={!selectedConcept}
                    onClick={onApplyClick}
                    bsStyle={successBsStyle}
                >
                    Apply
                </Button>
            </Modal.Footer>
        </Modal>
    );
});

OntologyBrowserModal.defaultProps = {
    successBsStyle: 'success',
};
