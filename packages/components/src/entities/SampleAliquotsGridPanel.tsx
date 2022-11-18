import React, { FC, memo, useCallback, useState } from 'react';
import { PermissionTypes } from '@labkey/api';

import { User } from '../internal/components/base/models/User';

import { PicklistButton } from '../internal/components/picklist/PicklistButton';
import { RequiresPermission } from '../internal/components/base/Permissions';
import { DisableableButton } from '../internal/components/buttons/DisableableButton';
import { ResponsiveMenuButtonGroup } from '../internal/components/buttons/ResponsiveMenuButtonGroup';
import { SchemaQuery } from '../public/SchemaQuery';
import { GridPanel } from '../public/QueryModel/GridPanel';

import { SampleTypeDataType } from '../internal/components/entities/constants';

import { InjectedQueryModels, RequiresModelAndActions, withQueryModels } from '../public/QueryModel/withQueryModels';

import { getSampleAliquotsQueryConfig } from '../internal/components/samples/actions';
import { getOmittedSampleTypeColumns } from '../internal/components/samples/utils';
import { isAssayEnabled, isWorkflowEnabled } from '../internal/app/utils';

import { AssayResultsForSamplesButton } from '../internal/components/entities/AssayResultsForSamplesButton';

import { EXPORT_TYPES, EXPORT_TYPES_WITH_LABEL } from '../internal/constants';
import { useLabelPrintingContext } from '../internal/components/labels/LabelPrintingContextProvider';
import { PrintLabelsModal } from '../internal/components/labels/PrintLabelsModal';
import { useNotificationsContext } from '../internal/components/notifications/NotificationsContext';

import { useSampleTypeAppContext } from './SampleTypeAppContext';
import { EntityDeleteModal } from './EntityDeleteModal';
import { SamplesAssayButton } from './SamplesAssayButton';

// We are only looking at single model here
const SUB_MENU_WIDTH = 1350;

interface AliquotGridButtonsProps {
    afterAction: () => void;
    assayProviderType?: string;
    lineageUpdateAllowed: boolean;
    onDelete: () => void;
    user: User;
}

const AliquotGridButtons: FC<AliquotGridButtonsProps & RequiresModelAndActions> = props => {
    const { afterAction, lineageUpdateAllowed, model, onDelete, user, assayProviderType } = props;
    const { JobsButtonComponent, SampleStorageButtonComponent } = useSampleTypeAppContext();
    const metricFeatureArea = 'sampleAliquots';

    const moreItems = [];
    moreItems.push({
        button: <SamplesAssayButton model={model} providerType={assayProviderType} />,
        perm: PermissionTypes.Insert,
    });
    moreItems.push({
        button: <PicklistButton model={model} user={user} metricFeatureArea={metricFeatureArea} />,
        perm: PermissionTypes.ManagePicklists,
    });
    if (JobsButtonComponent && isWorkflowEnabled()) {
        moreItems.push({
            button: <JobsButtonComponent model={model} user={user} metricFeatureArea={metricFeatureArea} />,
            perm: PermissionTypes.ManageSampleWorkflows,
        });
    }
    if (SampleStorageButtonComponent) {
        moreItems.push({
            button: (
                <SampleStorageButtonComponent
                    afterStorageUpdate={afterAction}
                    queryModel={model}
                    user={user}
                    nounPlural="aliquots"
                    metricFeatureArea={metricFeatureArea}
                />
            ),
            perm: PermissionTypes.EditStorageData,
        });
    }
    if (isAssayEnabled()) {
        moreItems.push({
            button: <AssayResultsForSamplesButton user={user} model={model} metricFeatureArea={metricFeatureArea} />,
            perm: PermissionTypes.ReadAssay,
        });
    }

    return (
        <RequiresPermission
            permissionCheck="any"
            perms={[
                PermissionTypes.Insert,
                PermissionTypes.Update,
                PermissionTypes.Delete,
                PermissionTypes.ManagePicklists,
                PermissionTypes.ManageSampleWorkflows,
                PermissionTypes.EditStorageData,
            ]}
        >
            <div className="responsive-btn-group">
                {lineageUpdateAllowed && (
                    <RequiresPermission perms={PermissionTypes.Delete}>
                        <DisableableButton
                            bsStyle="default"
                            onClick={onDelete}
                            disabledMsg={!model.hasSelections ? 'Select one or more aliquots.' : undefined}
                        >
                            <span className="fa fa-trash" />
                            <span>&nbsp;Delete</span>
                        </DisableableButton>
                    </RequiresPermission>
                )}
                <ResponsiveMenuButtonGroup user={user} items={moreItems} subMenuWidth={SUB_MENU_WIDTH} />
            </div>
        </RequiresPermission>
    );
};

interface Props {
    assayProviderType?: string;
    lineageUpdateAllowed: boolean;
    onSampleChangeInvalidate: (schemaQuery: SchemaQuery) => void;
    showLabelOption?: boolean;
    user: User;
}

export const SampleAliquotsGridPanelImpl: FC<Props & InjectedQueryModels> = memo(props => {
    const { actions, queryModels, showLabelOption = true, ...buttonProps } = props;
    const [showConfirmDelete, setConfirmDelete] = useState<boolean>(false);
    const [showPrintDialog, setShowPrintDialog] = useState<boolean>(false);
    const { createNotification } = useNotificationsContext();
    const { canPrintLabels, printServiceUrl, labelTemplate } = useLabelPrintingContext();

    const queryModel = queryModels.model;

    const resetState = useCallback((): void => {
        setConfirmDelete(false);
        setShowPrintDialog(false);
    }, []);

    const afterAction = useCallback((): void => {
        const { onSampleChangeInvalidate } = props;

        resetState();
        onSampleChangeInvalidate(queryModel.schemaQuery);
        actions.loadModel(queryModel.id, true);
    }, [actions, props, queryModel.id, queryModel.schemaQuery, resetState]);

    const onDelete = useCallback((): void => {
        if (queryModel.hasSelections) {
            setConfirmDelete(true);
        }
    }, [queryModel]);

    const onPrintLabel = useCallback(() => setShowPrintDialog(true), []);

    const afterPrint = useCallback(
        (numSamples: number, numLabels: number): void => {
            setShowPrintDialog(false);
            createNotification(`Successfully printed ${numLabels * numSamples} labels.`);
        },
        [createNotification]
    );

    const exportOption = {
        [EXPORT_TYPES.LABEL]: onPrintLabel,
    };

    const showPrintOption = showLabelOption && canPrintLabels;

    return (
        <>
            <GridPanel
                actions={actions}
                ButtonsComponent={AliquotGridButtons}
                buttonsComponentProps={{
                    ...buttonProps,
                    afterAction,
                    onDelete,
                }}
                model={queryModel}
                supportedExportTypes={showPrintOption ? EXPORT_TYPES_WITH_LABEL : undefined}
                onExport={exportOption}
            />

            {showConfirmDelete && (
                <EntityDeleteModal
                    afterDelete={afterAction}
                    entityDataType={SampleTypeDataType}
                    onCancel={resetState}
                    queryModel={queryModel}
                    useSelected
                    verb="deleted and removed from storage"
                />
            )}

            {showPrintDialog && canPrintLabels && (
                <PrintLabelsModal
                    afterPrint={afterPrint}
                    labelTemplate={labelTemplate}
                    printServiceUrl={printServiceUrl}
                    model={queryModel}
                    onCancel={resetState}
                    sampleIds={[...queryModel.selections]}
                    show={true}
                    showSelection={true}
                />
            )}
        </>
    );
});

const SampleAliquotsGridPanelWithModel = withQueryModels<Props>(SampleAliquotsGridPanelImpl);

interface SampleAliquotsGridPanelProps extends Omit<Props, 'queryModelId'> {
    omittedColumns?: string[];
    rootLsid?: string;
    sampleId: string | number;
    sampleLsid: string; // if sample is an aliquot, use the aliquot's root to find subaliquots
    schemaQuery: SchemaQuery;
}

export const SampleAliquotsGridPanel: FC<SampleAliquotsGridPanelProps> = props => {
    const { sampleLsid, schemaQuery, rootLsid, user, omittedColumns } = props;
    const omitted = omittedColumns
        ? [...getOmittedSampleTypeColumns(user), ...omittedColumns]
        : getOmittedSampleTypeColumns(user);

    const queryConfigs = {
        model: getSampleAliquotsQueryConfig(schemaQuery.getQuery(), sampleLsid, true, rootLsid, omitted),
    };

    return <SampleAliquotsGridPanelWithModel {...props} queryConfigs={queryConfigs} />;
};

SampleAliquotsGridPanel.displayName = 'SampleAliquotsGridPanel';
