import React, { FC, memo, PropsWithChildren, ReactNode } from 'react';
import classNames from 'classnames';

import { isApp } from '../../app/utils';

import { LabelHelpTip } from '../base/LabelHelpTip';

import { DomainPanelStatus } from './models';
import { useEnterEscape } from '../../../public/useEnterEscape';

interface Props extends PropsWithChildren {
    collapsed: boolean;
    collapsible: boolean;
    controlledCollapse: boolean;
    headerDetails?: string;
    iconHelpMsg?: string;
    id: string;
    isValid: boolean;
    panelStatus: DomainPanelStatus;
    title: string;
    titlePrefix?: string;
    todoIconHelpMsg?: string;
    togglePanel: () => void;
}

export const CollapsiblePanelHeader: FC<Props> = memo(props => {
    const {
        children,
        collapsed,
        collapsible,
        controlledCollapse,
        headerDetails,
        iconHelpMsg,
        id,
        isValid,
        panelStatus,
        title,
        titlePrefix,
        todoIconHelpMsg,
        togglePanel,
    } = props;
    const isApp_ = isApp();
    const onKeyDown = useEnterEscape(togglePanel);

    let iconHelpMsgStr: string;
    if (panelStatus && panelStatus !== 'NONE') {
        if (!isValid) {
            iconHelpMsgStr = iconHelpMsg;
        } else if (panelStatus === 'TODO') {
            iconHelpMsgStr =
                todoIconHelpMsg || 'This section does not contain any user-defined fields. You may want to review.';
        }
    }

    const validComplete = isValid && panelStatus === 'COMPLETE';
    const headerIconComponent: ReactNode = (
        <span
            className={classNames('domain-panel-status-icon', {
                'domain-panel-status-icon-green': collapsed && validComplete,
                'domain-panel-status-icon-blue': collapsed && !validComplete,
            })}
        >
            <span className={!isValid || panelStatus === 'TODO' ? 'fa fa-exclamation-circle' : 'fa fa-check-circle'} />
        </span>
    );

    let prefix = titlePrefix;
    if (prefix && prefix.length > 70) {
        prefix = prefix.substring(0, 70) + '...';
    }
    const titlePrefixStr = prefix ? prefix + ' - ' : '';

    const collapsedIconClass = classNames('fa', 'fa-lg', {
        'fa-chevron-right': collapsed,
        'fa-chevron-down': !collapsed,
        'domain-form-expand-btn': collapsed,
        'domain-form-collapse-btn': !collapsed,
    });
    const panelHeaderClass = classNames('domain-panel-header', {
        'panel-heading': isApp_,
        'domain-heading-collapsible': collapsible || controlledCollapse,
        'domain-panel-header-expanded': !collapsed,
        'domain-panel-header-collapsed': collapsed,
        'labkey-page-nav': !collapsed && !isApp_,
        'domain-panel-header-no-theme': !collapsed && isApp_,
    });

    return (
        <div
            className={panelHeaderClass}
            id={id}
            onClick={togglePanel}
            onKeyDown={onKeyDown}
            role="button"
            tabIndex={0}
        >
            {iconHelpMsgStr && (
                <LabelHelpTip iconComponent={headerIconComponent} title={title}>
                    {iconHelpMsgStr}
                </LabelHelpTip>
            )}
            {panelStatus && panelStatus !== 'NONE' && !iconHelpMsgStr && headerIconComponent}

            <h2 className="domain-panel-title">{titlePrefixStr + title}</h2>

            {(controlledCollapse || collapsible) && (
                <span className="pull-right">
                    <span className={collapsedIconClass} />
                </span>
            )}

            {children && <LabelHelpTip title={title}>{children}</LabelHelpTip>}

            {controlledCollapse && headerDetails && (
                <span className="domain-panel-header-fields-defined">{headerDetails}</span>
            )}
        </div>
    );
});
CollapsiblePanelHeader.displayName = 'CollapsiblePanelHeader';
