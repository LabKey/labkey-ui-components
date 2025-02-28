import React, { FC, memo, useCallback, useMemo, useState } from 'react';
import classNames from 'classnames';

import { PermissionTypes } from '@labkey/api';

import { User } from '../../internal/components/base/models/User';
import { RequiresPermission } from '../../internal/components/base/Permissions';
import { DropdownButton, MenuItem } from '../../internal/dropdowns';
import { ImportTemplate } from '../QueryInfo';
import { SchemaQuery } from '../SchemaQuery';
import { useAppContext } from '../../internal/AppContext';
import { downloadAttachment } from '../../internal/util/utils';
import { DisableableMenuItem } from '../../internal/components/samples/DisableableMenuItem';
import { useServerContext } from '../../internal/components/base/ServerContext';
import { getAppHomeFolderPath } from '../../internal/app/utils';
import { LoadingState } from '../LoadingState';

const TITLE = 'Download Template';

interface Props {
    className?: string;
    defaultTemplateUrl?: string;
    isGridRenderer?: boolean;
    onDownloadDefault?: () => Promise<void>;
    schemaQuery?: SchemaQuery;
    text?: string;
    user?: User;
}

const TemplateDownloadButtonImpl: FC<Props> = memo(props => {
    const {
        className = 'small-right-spacing',
        defaultTemplateUrl,
        isGridRenderer,
        onDownloadDefault,
        schemaQuery,
    } = props;
    const text = props.text ?? (isGridRenderer ? 'Download' : 'Template');
    const [customTemplates, setCustomTemplates] = useState<ImportTemplate[]>([]);
    const [downloading, setDownloading] = useState<boolean>(false);
    const [loadingTemplates, setLoadingTemplates] = useState<LoadingState>(LoadingState.INITIALIZED);
    const { container, moduleContext } = useServerContext();
    const { api } = useAppContext();
    const isLoaded = loadingTemplates === LoadingState.LOADED;
    const isLoading = loadingTemplates === LoadingState.LOADING;
    const schemaName = schemaQuery?.schemaName;
    const queryName = schemaQuery?.queryName;
    const hasTemplates = customTemplates.length > 0;
    const isDownloadingOrLoading = downloading || isLoading;

    const loadCustomTemplates = useCallback(async (): Promise<boolean> => {
        let hasTemplates = false;

        try {
            setLoadingTemplates(LoadingState.LOADING);
            const queryInfo = await api.query.getQueryDetails({
                containerPath: getAppHomeFolderPath(container, moduleContext),
                schemaName,
                queryName,
            });

            const templates = queryInfo.getCustomTemplates() ?? [];
            hasTemplates = templates.length > 0;

            setCustomTemplates(templates);
        } catch (error) {
            console.error('Failed to load custom templates', error);
        } finally {
            setLoadingTemplates(LoadingState.LOADED);
        }

        return hasTemplates;
    }, [api.query, container, moduleContext, schemaName, queryName]);

    const downloadCustomTemplate = useCallback(
        (customTemplateUrl: string) => {
            return async () => {
                if (downloading) return;
                setDownloading(true);
                await downloadAttachment(customTemplateUrl);
                setDownloading(false);
            };
        },
        [downloading]
    );

    const downloadDefaultTemplate = useCallback(async () => {
        if (downloading) return;
        setDownloading(true);
        if (onDownloadDefault) {
            await onDownloadDefault();
        } else {
            await downloadAttachment(defaultTemplateUrl);
        }
        setDownloading(false);
    }, [defaultTemplateUrl, downloading, onDownloadDefault]);

    const fetchTemplates = useCallback(async () => {
        if (isDownloadingOrLoading || !schemaQuery) return;
        let hasCustomTemplates: boolean;

        if (isLoaded) {
            hasCustomTemplates = hasTemplates;
        } else {
            hasCustomTemplates = await loadCustomTemplates();
        }

        // There are no custom templates so download the default template
        if (!hasCustomTemplates) {
            downloadDefaultTemplate();
        }
    }, [downloadDefaultTemplate, hasTemplates, isDownloadingOrLoading, isLoaded, loadCustomTemplates, schemaQuery]);

    const buttonClassName = classNames({
        'button-small-padding': isGridRenderer,

        // marker classes to assist automated testing
        'has-templates': hasTemplates,
        'is-loaded': isLoaded,
    });

    const iconClassName = classNames('fa', {
        'fa-download': !isDownloadingOrLoading,
        'fa-spinner': isDownloadingOrLoading,
        'fa-pulse': isDownloadingOrLoading,
    });

    const dropdownTitle = useMemo(
        () => (
            <span title={TITLE}>
                <span className={iconClassName} /> {text}
            </span>
        ),
        [iconClassName, text]
    );

    return (
        <DropdownButton
            bsStyle="info"
            buttonClassName={buttonClassName}
            buttonTitle={TITLE}
            className={className}
            noCaret
            onClick={fetchTemplates}
            pullRight
            showMenu={hasTemplates}
            title={dropdownTitle}
        >
            {hasTemplates && (
                <MenuItem key={0} onClick={downloadDefaultTemplate}>
                    Default Template
                </MenuItem>
            )}
            {customTemplates.map(template => {
                if (template.url.endsWith('(unavailable)')) {
                    return (
                        <DisableableMenuItem key={template.label} disabled disabledMessage="File not found">
                            {template.label}
                        </DisableableMenuItem>
                    );
                }

                return (
                    <MenuItem key={template.label} onClick={downloadCustomTemplate(template.url)}>
                        {template.label}
                    </MenuItem>
                );
            })}
        </DropdownButton>
    );
});
TemplateDownloadButtonImpl.displayName = 'TemplateDownloadButtonImpl';

export const TemplateDownloadButton: FC<Props> = memo(props => {
    const { defaultTemplateUrl, onDownloadDefault, user } = props;

    if (!onDownloadDefault && !defaultTemplateUrl?.length) return null;

    return (
        <RequiresPermission perms={[PermissionTypes.Insert, PermissionTypes.Update]} permissionCheck="any" user={user}>
            <TemplateDownloadButtonImpl {...props} />
        </RequiresPermission>
    );
});
TemplateDownloadButton.displayName = 'TemplateDownloadButton';
