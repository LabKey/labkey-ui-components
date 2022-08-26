import React, { FC, PureComponent } from 'react';
import { List } from 'immutable';
import { PermissionTypes } from '@labkey/api';

import { getOmittedSampleTypeColumns } from './utils';
import { getSampleAliquotsQueryConfig } from './actions';
import { JobsButton, SampleStorageButton } from './models';
import {User} from "../base/models/User";
import {SamplesAssayButton} from "./SamplesAssayButton";
import {PicklistButton} from "../picklist/PicklistButton";
import {RequiresPermission} from "../base/Permissions";
import {DisableableButton} from "../buttons/DisableableButton";
import {ResponsiveMenuButtonGroup} from "../buttons/ResponsiveMenuButtonGroup";
import {SchemaQuery} from "../../../public/SchemaQuery";
import {QueryModel} from "../../../public/QueryModel/QueryModel";
import {GridPanel} from "../../../public/QueryModel/GridPanel";
import {EntityDeleteModal} from "../entities/EntityDeleteModal";
import {SampleTypeDataType} from "../entities/constants";
import {createGridModelId} from "../../models";
import {SCHEMAS} from "../../schemas";

import {
    InjectedQueryModels,
    RequiresModelAndActions,
    withQueryModels,
} from '../../../public/QueryModel/withQueryModels';

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
    rootLsid?: string; // if sample is an aliquot, use the aliquot's root to find subaliquots
    sampleLsid: string;
    schemaQuery: SchemaQuery;
}

export const SampleAliquotsGridPanel: FC<SampleAliquotsGridPanelProps> = props => {
    const { sampleLsid, schemaQuery, rootLsid, user } = props;
    const id = createGridModelId(
        'sample-aliquots',
        SchemaQuery.create(SCHEMAS.SAMPLE_SETS.SCHEMA, schemaQuery.getQuery())
    );

    const queryConfigs = {
        [id]: getSampleAliquotsQueryConfig(
            schemaQuery.getQuery(),
            sampleLsid,
            true,
            rootLsid,
            List(getOmittedSampleTypeColumns(user))
        ),
    };

    return <SampleAliquotsGridPanelWithModel {...props} queryConfigs={queryConfigs} />;
};

SampleAliquotsGridPanel.displayName = 'SampleAliquotsGridPanel';
