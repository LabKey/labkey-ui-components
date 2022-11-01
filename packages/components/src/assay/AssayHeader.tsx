import React, { FC, ReactNode, useCallback, useState } from 'react';
import { ProductMenuModel } from '../internal/components/navigation/model';
import { AppURL } from '../internal/url/AppURL';
import { AssayProtocolModel } from '../internal/components/domainproperties/assay/models';
import { AssayDefinitionModel } from '../internal/AssayDefinitionModel';
import { clearAssayDefinitionCache } from '../internal/components/assay/actions';
import { getTitleDisplay, hasActivePipelineJob } from '../internal/components/pipeline/utils';
import { PageDetailHeader } from '../internal/components/forms/PageDetailHeader';
import { TemplateDownloadButton } from '../public/files/TemplateDownloadButton';
import { RequiresPermission } from '../internal/components/base/Permissions';
import { PermissionTypes } from '@labkey/api';
import { ManageDropdownButton } from '../internal/components/buttons/ManageDropdownButton';
import { MenuItem } from 'react-bootstrap';
import { ASSAY_DESIGN_KEY, ASSAYS_KEY, AUDIT_KEY } from '../internal/app/constants';
import { isAssayDesignExportEnabled } from '../internal/app/utils';
import { AssayExportDesignButton } from './AssayButtons';
import { ASSAY_AUDIT_QUERY } from '../internal/components/auditlog/constants';
import { AssayDesignDeleteModal } from './AssayDesignDeleteModal';
import { Notifications } from '../internal/components/notifications/Notifications';
import { onAssayDesignChange } from './actions';

interface Props {
    assayDefinition?: AssayDefinitionModel;
    assayProtocol?: AssayProtocolModel;
    title?: ReactNode;
    subTitle?: ReactNode;
    staticTitle?: ReactNode; // TODO LKB uses this. Unclear when.
    description?: ReactNode;
    renderButtons?: () => ReactNode;
    menu: ProductMenuModel,
    menuInit: (invalidate?: boolean) => void;
    navigate: (url: string | AppURL, replace?: boolean) => void;
}

export const AssayHeader: FC<Props> = props => {
    const { assayDefinition, assayProtocol, staticTitle, title, subTitle, description, renderButtons, menu, menuInit, navigate } = props;

    const [showConfirmDeleteAssayDesign, setShowConfirmDeleteAssayDesign] = useState<boolean>(false);

    const resetState = useCallback(() => {
        setShowConfirmDeleteAssayDesign(false)
    }, []);

    const onDeleteAssayDesign = useCallback(() => {
        setShowConfirmDeleteAssayDesign(true);
    }, []);

    const beforeAssayDesignDelete = useCallback(() => {
        onAssayDesignChange(assayDefinition.protocolSchemaName);
    }, [assayDefinition?.protocolSchemaName]);

    const afterAssayDesignDelete = useCallback((success: boolean) => {
        if (success) {
            menuInit();
            clearAssayDefinitionCache();
            navigate(AppURL.create(ASSAYS_KEY));
        } else {
            // delay to make sure grid invalidate form beforeAssayDesignDelete is finished
            window.setTimeout(resetState, 100);
        }
    }, [menuInit, navigate]);


    const isJobActive = assayDefinition ? hasActivePipelineJob(menu, ASSAYS_KEY, assayDefinition.name) : false;
    let titleDisplay = staticTitle ?? title;

    if (!title && assayDefinition) {
        titleDisplay = getTitleDisplay(assayDefinition.name, isJobActive);
    }

    let descriptionDisplay = description;
    if (assayDefinition && description === assayDefinition.name) {
        descriptionDisplay = getTitleDisplay(assayDefinition.name, isJobActive);
    }

    return (
        <>
            <PageDetailHeader
                iconSrc="assay"
                title={titleDisplay}
                subTitle={subTitle}
                description={descriptionDisplay}
                leftColumns={9}
            >
                <TemplateDownloadButton templateUrl={assayDefinition?.templateLink} className="button-right-spacing" />
                {!!renderButtons && renderButtons()}
                {!renderButtons && assayDefinition && (
                    <RequiresPermission permissionCheck="any" perms={[PermissionTypes.Read, PermissionTypes.DesignAssay, PermissionTypes.CanSeeAuditLog]}>
                        <ManageDropdownButton id={'assayheader'} pullRight collapsed>

                            <RequiresPermission perms={PermissionTypes.DesignAssay}>
                                <MenuItem href={AppURL.create(ASSAYS_KEY, assayDefinition.type, assayDefinition.name, 'design').toHref()}>Edit Assay Design</MenuItem>
                            </RequiresPermission>
                            {/* Allow linking to copy design if user has permissions in current container */}
                            <RequiresPermission perms={PermissionTypes.DesignAssay}>
                                <MenuItem
                                    href={AppURL.create(
                                        ASSAY_DESIGN_KEY,
                                        assayProtocol.providerName,
                                        assayProtocol.name,
                                        'copy'
                                    ).toHref()}
                                >
                                    Copy Design
                                </MenuItem>
                            </RequiresPermission>
                            {isAssayDesignExportEnabled() && <AssayExportDesignButton asMenuItem />}
                            <RequiresPermission perms={PermissionTypes.DesignAssay}>
                                <MenuItem onClick={onDeleteAssayDesign}>Delete Assay Design</MenuItem>
                            </RequiresPermission>
                            <RequiresPermission perms={PermissionTypes.CanSeeAuditLog}>
                                <MenuItem href={AppURL.create(AUDIT_KEY).addParams({
                                    eventType: ASSAY_AUDIT_QUERY.value,
                                    'query.q': assayDefinition.name
                                }).toHref()}>
                                    View Audit History
                                </MenuItem>
                            </RequiresPermission>
                        </ManageDropdownButton>
                    </RequiresPermission>
                )}
            </PageDetailHeader>
            <Notifications />
            {showConfirmDeleteAssayDesign && (
                <AssayDesignDeleteModal
                    assay={assayDefinition}
                    beforeDelete={beforeAssayDesignDelete}
                    afterDelete={afterAssayDesignDelete}
                    onCancel={resetState}
                />
            )}
        </>
    );
}
