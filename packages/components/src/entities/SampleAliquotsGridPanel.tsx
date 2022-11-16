import React, { FC, PureComponent, ReactNode } from 'react';
import { PermissionTypes } from '@labkey/api';

import { User } from '../internal/components/base/models/User';

import { PicklistButton } from '../internal/components/picklist/PicklistButton';
import { RequiresPermission } from '../internal/components/base/Permissions';
import { DisableableButton } from '../internal/components/buttons/DisableableButton';
import { ResponsiveMenuButtonGroup } from '../internal/components/buttons/ResponsiveMenuButtonGroup';
import { SchemaQuery } from '../public/SchemaQuery';
import { QueryModel } from '../public/QueryModel/QueryModel';
import { GridPanel } from '../public/QueryModel/GridPanel';

import { SampleTypeDataType } from '../internal/components/entities/constants';
import { createGridModelId } from '../internal/models';
import { SCHEMAS } from '../internal/schemas';

import { InjectedQueryModels, RequiresModelAndActions, withQueryModels } from '../public/QueryModel/withQueryModels';

import { getSampleAliquotsQueryConfig } from '../internal/components/samples/actions';
import { getOmittedSampleTypeColumns } from '../internal/components/samples/utils';
import { isAssayEnabled } from '../internal/app/utils';

import { AssayResultsForSamplesButton } from '../internal/components/entities/AssayResultsForSamplesButton';

import { SamplesAssayButton } from './SamplesAssayButton';
import { EntityDeleteModal } from './EntityDeleteModal';
import { useSampleTypeAppContext } from './SampleTypeAppContext';

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
    if (JobsButtonComponent) {
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
    user: User;
}

interface State {
    showConfirmDelete: boolean;
}

export class SampleAliquotsGridPanelImpl extends PureComponent<Props & InjectedQueryModels, State> {
    state: Readonly<State> = { showConfirmDelete: false };

    getQueryModel = (): QueryModel => {
        return Object.values(this.props.queryModels)[0];
    };

    afterAction = (): void => {
        const { actions, onSampleChangeInvalidate } = this.props;
        const model = this.getQueryModel();

        this.resetState();
        onSampleChangeInvalidate(model.schemaQuery);
        actions.loadModel(model.id, true);
    };

    onDelete = (): void => {
        if (this.hasSelection()) {
            this.setState({ showConfirmDelete: true });
        }
    };

    resetState = (): void => {
        if (this.hasSelection()) {
            this.setState({ showConfirmDelete: false });
        }
    };

    hasSelection(): boolean {
        return this.getQueryModel().hasSelections;
    }

    render(): ReactNode {
        const { actions, ...buttonProps } = this.props;
        const queryModel = this.getQueryModel();

        return (
            <>
                <GridPanel
                    actions={actions}
                    ButtonsComponent={AliquotGridButtons}
                    buttonsComponentProps={{
                        ...buttonProps,
                        afterAction: this.afterAction,
                        onDelete: this.onDelete,
                    }}
                    model={queryModel}
                />

                {this.state.showConfirmDelete && (
                    <EntityDeleteModal
                        afterDelete={this.afterAction}
                        entityDataType={SampleTypeDataType}
                        onCancel={this.resetState}
                        queryModel={queryModel}
                        useSelected
                        verb="deleted and removed from storage"
                    />
                )}
            </>
        );
    }
}

const SampleAliquotsGridPanelWithModel = withQueryModels<Props>(SampleAliquotsGridPanelImpl);

interface SampleAliquotsGridPanelProps extends Props {
    omittedColumns?: string[];
    rootLsid?: string;
    sampleId: string | number;
    sampleLsid: string; // if sample is an aliquot, use the aliquot's root to find subaliquots
    schemaQuery: SchemaQuery;
}

export const SampleAliquotsGridPanel: FC<SampleAliquotsGridPanelProps> = props => {
    const { sampleId, sampleLsid, schemaQuery, rootLsid, user, omittedColumns } = props;
    const id = createGridModelId(
        'sample-aliquots-' + sampleId,
        SchemaQuery.create(SCHEMAS.SAMPLE_SETS.SCHEMA, schemaQuery.getQuery())
    );
    const omitted = omittedColumns
        ? [...getOmittedSampleTypeColumns(user), ...omittedColumns]
        : getOmittedSampleTypeColumns(user);

    const queryConfigs = {
        [id]: getSampleAliquotsQueryConfig(schemaQuery.getQuery(), sampleLsid, true, rootLsid, omitted),
    };

    return <SampleAliquotsGridPanelWithModel {...props} queryConfigs={queryConfigs} />;
};

SampleAliquotsGridPanel.displayName = 'SampleAliquotsGridPanel';
