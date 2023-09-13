import React, { FC, memo, useEffect, useMemo, useState } from 'react';
import { MenuItem } from 'react-bootstrap';

import { useServerContext } from '../base/ServerContext';
import { AppURL } from '../../url/AppURL';
import { BasePermissionsCheckPage } from '../permissions/BasePermissionsCheckPage';
import { GridPanelWithModel } from '../../../public/QueryModel/GridPanel';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { QueryConfig } from '../../../public/QueryModel/QueryModel';
import { RequiresModelAndActions } from '../../../public/QueryModel/withQueryModels';
import { ManageDropdownButton } from '../buttons/ManageDropdownButton';
import { AUDIT_KEY } from '../../app/constants';
import { AUDIT_EVENT_TYPE_PARAM, PROJECT_AUDIT_QUERY } from '../auditlog/constants';
import { Alert } from '../base/Alert';
import { getLocation, removeParameters } from '../../util/URL';

const Buttons: FC<RequiresModelAndActions> = memo(() => {
    return (
        <a className="btn btn-success" href={AppURL.create('admin', 'projects', 'new').toHref()}>
            Create
        </a>
    );
});

export const ProjectManagementPage: FC = memo(() => {
    const [successMsg, setSuccessMsg] = useState<string>();
    const { user } = useServerContext();

    useEffect(() => {
        const successMessage = getLocation().query?.get('successMsg');
        if (successMessage) {
            setSuccessMsg(`${decodeURI(successMessage)} successfully deleted.`);
            removeParameters(getLocation(), 'successMsg');
        }
    }, []);

    const queryConfig: QueryConfig = useMemo(
        () => ({
            bindURL: true,
            schemaQuery: new SchemaQuery('core', 'ProjectManagement'),
            includeTotalCount: true,
            useSavedSettings: true,
        }),
        []
    );

    const renderButtons = useMemo(
        () => () =>
            (
                <ManageDropdownButton collapsed id="project-page-manage" pullRight>
                    <MenuItem
                        href={AppURL.create(AUDIT_KEY)
                            .addParam(AUDIT_EVENT_TYPE_PARAM, PROJECT_AUDIT_QUERY.value)
                            .toHref()}
                    >
                        View Audit History
                    </MenuItem>
                </ManageDropdownButton>
            ),
        []
    );

    return (
        <>
            {successMsg && (
                <Alert bsStyle="success" className="admin-settings-error">
                    {successMsg}
                </Alert>
            )}

            <BasePermissionsCheckPage
                hasPermission={user.isAdmin}
                renderButtons={renderButtons}
                title="Projects"
                user={user}
            >
                <GridPanelWithModel
                    allowViewCustomization={false}
                    ButtonsComponent={Buttons}
                    queryConfig={queryConfig}
                />
            </BasePermissionsCheckPage>
        </>
    );
});
