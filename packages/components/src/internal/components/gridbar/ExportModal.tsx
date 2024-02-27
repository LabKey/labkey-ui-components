import React, { FC, memo, useCallback, useState } from 'react';
import { Checkbox } from 'react-bootstrap';

import { Modal } from '../../Modal';

import { QueryModelMap } from '../../../public/QueryModel/withQueryModels';

interface ExportModalProperties {
    canExport: boolean;
    onClose: () => void;
    onExport: (tabs: Set<string>) => Promise<void>;
    queryModels: QueryModelMap;
    tabOrder: string[];
    tabRowCounts?: { [key: string]: number };
    title?: string;
}
const DEFAULT_TITLE = 'Select the Tabs to Export';

export const ExportModal: FC<ExportModalProperties> = memo(props => {
    const { queryModels, tabOrder, onClose, onExport, canExport, tabRowCounts, title = DEFAULT_TITLE } = props;
    const [selected, setSelected] = useState<Set<string>>(() => {
        let selected = new Set<string>();
        tabOrder.forEach(modelId => {
            if (tabRowCounts?.[modelId] > 0) selected = selected.add(modelId);
            if (queryModels[modelId].rowCount > 0) selected = selected.add(modelId);
        });
        return selected;
    });

    const closeHandler = useCallback(() => {
        onClose();
    }, [onClose]);

    const exportHandler = useCallback(() => {
        onExport(selected);
    }, [onExport, selected]);

    const onChecked = useCallback(
        evt => {
            const modelId = evt.target.value;
            const draftSelected = new Set(selected);
            if (evt.target.checked) {
                setSelected(draftSelected.add(modelId));
            } else {
                draftSelected.delete(modelId);
                setSelected(draftSelected);
            }
        },
        [selected]
    );

    if (queryModels == null) return null;

    return (
        <Modal
            canConfirm={canExport && selected.size > 0}
            confirmText="Export"
            onCancel={closeHandler}
            onConfirm={exportHandler}
            title={title}
        >
            <table className="export-modal-body">
                <tbody>
                    <tr>
                        <th></th>
                        <th className="pull-right">Count</th>
                        <th className="view-name">View</th>
                    </tr>
                    {tabOrder.map(modelId => {
                        const model = queryModels[modelId];
                        let rowCountDisplay = model.rowCount;
                        if (rowCountDisplay === undefined && !model.isActivelyLoadingTotalCount) {
                            rowCountDisplay = tabRowCounts?.[modelId];
                        }

                        return (
                            <tr key={modelId}>
                                <td>
                                    <Checkbox checked={selected.has(modelId)} value={modelId} onChange={onChecked}>
                                        {model.title}
                                    </Checkbox>
                                </td>
                                <td className="pull-right">{rowCountDisplay}</td>
                                <td className="view-name">
                                    {!model.viewName || model.viewName.startsWith('~~') ? 'Default' : model.viewName}{' '}
                                    {model.currentView?.session && <span className="text-muted">(edited)</span>}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </Modal>
    );
});
