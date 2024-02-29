import React, { ReactNode } from 'react';
import classNames from 'classnames';

import { isApp } from '../../app/utils';

import { LabelHelpTip } from '../base/LabelHelpTip';

import { DomainPanelStatus } from './models';

interface Props {
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

export class CollapsiblePanelHeader extends React.PureComponent<Props> {
    getHeaderIconHelpMsg = (): string => {
        const { isValid, panelStatus, iconHelpMsg, todoIconHelpMsg } = this.props;

        if (!isValid) {
            return iconHelpMsg;
        }

        if (panelStatus === 'TODO') {
            return todoIconHelpMsg || 'This section does not contain any user-defined fields. You may want to review.';
        }

        return undefined;
    };

    getHeaderIconComponent = (): ReactNode => {
        const { collapsed, isValid, panelStatus } = this.props;
        const validComplete = isValid && panelStatus === 'COMPLETE';
        const wrapperClassName = classNames('domain-panel-status-icon', {
            'domain-panel-status-icon-green': collapsed && validComplete,
            'domain-panel-status-icon-blue': collapsed && !validComplete,
        });
        const iconClassName = !isValid || panelStatus === 'TODO' ? 'fa fa-exclamation-circle' : 'fa fa-check-circle';

        return (
            <span className={wrapperClassName}>
                <span className={iconClassName} />
            </span>
        );
    };

    getTitlePrefix = (): string => {
        let prefix = this.props.titlePrefix;

        // ellipsis after certain length
        if (prefix && prefix.length > 70) {
            prefix = prefix.substr(0, 70) + '...';
        }

        return prefix ? prefix + ' - ' : '';
    };

    render() {
        const {
            children,
            collapsed,
            collapsible,
            controlledCollapse,
            headerDetails,
            id,
            panelStatus,
            title,
            togglePanel,
        } = this.props;
        const isApp_ = isApp();
        const iconHelpMsg = panelStatus && panelStatus !== 'NONE' ? this.getHeaderIconHelpMsg() : undefined;
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
            <div id={id} onClick={togglePanel} className={panelHeaderClass}>
                {/* Header help icon*/}
                {iconHelpMsg && (
                    <LabelHelpTip iconComponent={this.getHeaderIconComponent()} title={title}>
                        {iconHelpMsg}
                    </LabelHelpTip>
                )}
                {panelStatus && panelStatus !== 'NONE' && !iconHelpMsg && this.getHeaderIconComponent()}

                {/* Header name*/}
                <span className="domain-panel-title">{this.getTitlePrefix() + title}</span>

                {/* Expand/Collapse Icon*/}
                {(controlledCollapse || collapsible) && (
                    <span className="pull-right">
                        <span className={collapsedIconClass} />
                    </span>
                )}

                {/* Help tip*/}
                {children && (
                    <LabelHelpTip title={title}>
                        {children}
                    </LabelHelpTip>
                )}

                {/* Header details, shown on the right side*/}
                {controlledCollapse && headerDetails && (
                    <span className="domain-panel-header-fields-defined">{headerDetails}</span>
                )}
            </div>
        );
    }
}
