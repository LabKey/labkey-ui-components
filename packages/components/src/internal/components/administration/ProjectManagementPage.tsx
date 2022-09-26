import React, { FC, memo, useMemo } from 'react';
import { MenuItem } from 'react-bootstrap';

import { useServerContext } from '../base/ServerContext';
import { AppURL } from '../../url/AppURL';
import { BasePermissionsCheckPage } from '../permissions/BasePermissionsCheckPage';
import { GridPanelWithModel } from '../../../public/QueryModel/GridPanel';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { QueryConfig } from '../../../public/QueryModel/QueryModel';
import { RequiresModelAndActions } from '../../../public/QueryModel/withQueryModels';
import { ManageDropdownButton } from '../buttons/ManageDropdownButton';

const Buttons: FC<RequiresModelAndActions> = memo(() => {
    return (
        <a className="btn btn-success" href={AppURL.create('admin', 'projects', 'new').toHref()}>
            Create
        </a>
    );
});

export const ProjectManagementPage: FC = memo(() => {
    const { user } = useServerContext();
    const queryConfig: QueryConfig = useMemo(
        () => ({
            bindURL: true,
            schemaQuery: SchemaQuery.create('core', 'ProjectManagement'),
        }),
        []
    );

    const renderButtons = useMemo(
        () => () =>
            (
                <ManageDropdownButton collapsed id="project-page-manage" pullRight>
                    <MenuItem href={AppURL.create('audit', 'containerauditevent').toHref()}>
                        View Audit History
                    </MenuItem>
                </ManageDropdownButton>
            ),
        []
    );

    return (
        <BasePermissionsCheckPage
            hasPermission={user.isAdmin}
            renderButtons={renderButtons}
            title="Projects"
            user={user}
        >
            <GridPanelWithModel allowViewCustomization={false} ButtonsComponent={Buttons} queryConfig={queryConfig} />
        </BasePermissionsCheckPage>
    );
});
