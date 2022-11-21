import React, { ReactNode } from 'react';
import { Map } from 'immutable';

import { Filter } from '@labkey/api';

import { SchemaQuery } from '../public/SchemaQuery';
import { InjectedQueryModels, withQueryModels } from '../public/QueryModel/withQueryModels';

import { GridPanel } from '../public/QueryModel/GridPanel';
import { LoadingSpinner } from '../internal/components/base/LoadingSpinner';

import { UpdateQCStatesButton } from './AssayButtons';

const QC_HISTORY_SQ = SchemaQuery.create('auditLog', 'ExperimentAuditEvent');
const QC_MODEL_ID = 'QC';

interface Props {
    assayContainer: string;
    onQCStateUpdate?: () => void;
    requireCommentOnQCStateChange: boolean;
    run: Map<string, any>;
}

class AssayRunQCHistoryImpl extends React.Component<Props & InjectedQueryModels, any> {
    componentDidMount(): void {
        const { actions, run } = this.props;

        actions.addModel(
            {
                id: QC_MODEL_ID,
                schemaQuery: QC_HISTORY_SQ,
                baseFilters: [
                    Filter.create('RunLsid', run.getIn(['LSID', 'value'])),
                    Filter.create('QCState', undefined, Filter.Types.NONBLANK),
                ],
            },
            true
        );
    }

    render(): ReactNode {
        const { actions, assayContainer, queryModels, onQCStateUpdate, run, requireCommentOnQCStateChange } =
            this.props;
        const model = queryModels[QC_MODEL_ID];
        const ButtonsComponent = () => (
            <UpdateQCStatesButton
                model={model}
                run={run}
                actions={actions}
                assayContainer={assayContainer}
                disabled={false}
                requireCommentOnQCStateChange={requireCommentOnQCStateChange}
                onQCStateUpdate={onQCStateUpdate}
            />
        );

        return (
            <div className="qc-history">
                {model !== undefined && (
                    <GridPanel
                        actions={actions}
                        ButtonsComponent={ButtonsComponent}
                        model={model}
                        showChartMenu={false}
                        showExport={false}
                        showViewMenu={false}
                        allowFiltering={false}
                        allowViewCustomization={false}
                        showFiltersButton={false}
                        showSearchInput={false}
                        allowSelections={false}
                        title="QC History"
                    />
                )}

                {model === undefined && <LoadingSpinner />}
            </div>
        );
    }
}

export const AssayRunQCHistory = withQueryModels<Props>(AssayRunQCHistoryImpl);
