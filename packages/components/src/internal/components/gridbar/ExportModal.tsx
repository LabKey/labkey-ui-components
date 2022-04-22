import React, { FC, memo, useCallback, useState } from 'react';
import { Checkbox, Label, Modal } from 'react-bootstrap';
import { QueryModelMap } from '../../../public/QueryModel/withQueryModels';
import { QueryModel } from '../../../public/QueryModel/QueryModel';

interface ExportModalProperties {
    queryModels: QueryModelMap;
    tabOrder: string[];
    onExport: (tabs: Set<string>) => Promise<void>;
    onClose?: () => void;
    canExport: boolean;
}

export const ExportModal: FC<ExportModalProperties> = memo((props) => {
    const {queryModels, tabOrder, onClose, onExport, canExport} = props;
    const [selected, setSelected] = useState<Set<string>>(new Set(tabOrder));

    const closeHandler = useCallback(() => {
        onClose?.();
    }, []);

    const exportHandler = useCallback(() => {
        onExport?.(selected);
    }, [selected]);

    const onChecked = useCallback((evt) => {
        const modelId = evt.target.value;
        if (evt.target.checked)
        {
            setSelected(new Set(selected.add(modelId)));
        }
        else {
            selected.delete(modelId);
            setSelected(new Set(selected));
        }
    }, [selected]);

    if (queryModels == null)
        return undefined;

    return (<>
        <Modal onHide={closeHandler} show={true}>
            <Modal.Header closeButton>
                <Modal.Title>Select the Tabs to Export to Excel</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="excel-export-modal-body" >
                    <ul>
                        {tabOrder.map( modelId => {
                            return <Checkbox checked={selected.has(modelId)} className='export-modal-checkbox' key={modelId} value={modelId} onChange={onChecked}>{queryModels[modelId].title}</Checkbox>
                        })}
                    </ul>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <div className="pull-left">
                    <button type="button" className="btn btn-default" onClick={closeHandler}>
                        Cancel
                    </button>
                </div>
                <div className="pull-right">
                    <button
                        type="button"
                        className="btn btn-success"
                        onClick={exportHandler}
                        disabled={ selected.size === 0 || !canExport }
                    >
                        Export
                    </button>
                </div>
            </Modal.Footer>
        </Modal>
    </>);
});
