import React, { FC, PureComponent } from 'react';
import { List } from 'immutable';
import { PermissionTypes } from '@labkey/api';

import { User } from '../internal/components/base/models/User';

import { PicklistButton } from '../internal/components/picklist/PicklistButton';
import { RequiresPermission } from '../internal/components/base/Permissions';
import { DisableableButton } from '../internal/components/buttons/DisableableButton';
import { ResponsiveMenuButtonGroup } from '../internal/components/buttons/ResponsiveMenuButtonGroup';
import { SchemaQuery } from '../public/SchemaQuery';
import { QueryModel } from '../public/QueryModel/QueryModel';
import { GridPanel } from '../public/QueryModel/GridPanel';
import { EntityDeleteModal } from './EntityDeleteModal';
import { SampleTypeDataType } from '../internal/components/entities/constants';
import { createGridModelId } from '../internal/models';
import { SCHEMAS } from '../internal/schemas';

import {
    InjectedQueryModels,
    RequiresModelAndActions,
    withQueryModels,
} from '../public/QueryModel/withQueryModels';

import { SamplesAssayButton } from './SamplesAssayButton';
import { JobsButton, SampleStorageButton } from '../internal/components/samples/models';
import { getSampleAliquotsQueryConfig } from '../internal/components/samples/actions';
import { getOmittedSampleTypeColumns } from '../internal/components/samples/utils';
import { ViewInfo } from '../internal/ViewInfo';

const SUB_MENU_WIDTH = 800;

interface AliquotGridButtonsProps {
    JobsButtonComponent?: JobsButton;
    StorageButtonComponent?: SampleStorageButton;
    afterAction: () => void;
    assayProviderType?: string;
    lineageUpdateAllowed: boolean;
    onDelete: () => void;
    user: User;
}

const AliquotGridButtons: FC<AliquotGridButtonsProps & RequiresModelAndActions> = props => {
    const {
        afterAction,
        lineageUpdateAllowed,
        model,
        onDelete,
        StorageButtonComponent,
        JobsButtonComponent,
        user,
        assayProviderType,
    } = props;
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
    if (StorageButtonComponent) {
        moreItems.push({
            button: (
                <StorageButtonComponent
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
    jobsButton?: JobsButton;
    lineageUpdateAllowed: boolean;
    onSampleChangeInvalidate: (schemaQuery: SchemaQuery) => void;
    storageButton?: SampleStorageButton;
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

    render() {
        const { actions, storageButton, jobsButton, ...buttonProps } = this.props;
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
                        StorageButtonComponent: storageButton,
                        JobsButtonComponent: jobsButton,
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
    // if sample is an aliquot, use the aliquot's root to find subaliquots
    sampleLsid: string;
    schemaQuery: SchemaQuery;
}

export const SampleAliquotsGridPanel: FC<SampleAliquotsGridPanelProps> = props => {
    const { sampleLsid, schemaQuery, rootLsid, user, omittedColumns } = props;
    const id = createGridModelId(
        'sample-aliquots',
        SchemaQuery.create(SCHEMAS.SAMPLE_SETS.SCHEMA, schemaQuery.getQuery(), ViewInfo.DETAIL_NAME)
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
