import React, { ReactNode } from 'react';
import { Panel } from 'react-bootstrap';

import { Alert } from '../base/Alert';

import { DomainPanelStatus } from './models';
import { getDomainAlertClasses, getDomainPanelClass, updateDomainPanelClassList } from './actions';
import { CollapsiblePanelHeader } from './CollapsiblePanelHeader';
import { PROPERTIES_PANEL_ERROR_MSG } from './constants';
import { InjectedDomainPropertiesPanelCollapseProps } from './DomainPropertiesPanelCollapse';

// This is needed to suppress JS warning about providing an expanded prop without onToggle
// eslint-disable-next-line no-empty-function,@typescript-eslint/no-empty-function
const noop = (): void => {};

export interface BasePropertiesPanelProps {
    panelStatus: DomainPanelStatus;
    useTheme: boolean;
    validate: boolean;
    warning?: string;
}

interface OwnProps {
    headerId: string;
    isValid: boolean;
    title: string;
    titlePrefix?: string;
    todoIconHelpMsg?: string;
    updateValidStatus: (model?: any) => void;
}

type Props = OwnProps & BasePropertiesPanelProps & InjectedDomainPropertiesPanelCollapseProps;

export class BasePropertiesPanel extends React.PureComponent<Props> {
    static defaultProps = {
        title: 'Properties',
        validate: false,
        useTheme: false,
    };

    componentDidMount(): void {
        updateDomainPanelClassList(this.props.useTheme, undefined, this.props.headerId);
    }

    componentDidUpdate(prevProps: Props): void {
        const { validate, updateValidStatus } = this.props;
        updateDomainPanelClassList(prevProps.useTheme, undefined, this.props.headerId);

        if (validate && prevProps.validate !== validate) {
            updateValidStatus();
        }
    }

    toggleLocalPanel = (): void => {
        const { togglePanel, collapsed, updateValidStatus } = this.props;

        updateValidStatus();
        togglePanel(!collapsed);
    };

    render(): ReactNode {
        const {
            collapsed,
            collapsible,
            controlledCollapse,
            panelStatus,
            useTheme,
            headerId,
            titlePrefix,
            title,
            isValid,
            children,
            warning,
            todoIconHelpMsg,
        } = this.props;

        return (
            <>
                <Panel className={getDomainPanelClass(collapsed, true, useTheme)} expanded={!collapsed} onToggle={noop}>
                    <CollapsiblePanelHeader
                        id={headerId}
                        title={title}
                        titlePrefix={titlePrefix}
                        togglePanel={this.toggleLocalPanel}
                        collapsed={collapsed}
                        collapsible={collapsible}
                        controlledCollapse={controlledCollapse}
                        panelStatus={panelStatus}
                        isValid={isValid}
                        iconHelpMsg={PROPERTIES_PANEL_ERROR_MSG}
                        todoIconHelpMsg={todoIconHelpMsg}
                        useTheme={useTheme}
                    />
                    <Panel.Body collapsible={collapsible || controlledCollapse}>{children}</Panel.Body>
                </Panel>
                {!isValid && (
                    <div onClick={this.toggleLocalPanel} className={getDomainAlertClasses(collapsed, true, useTheme)}>
                        <Alert bsStyle="danger">{PROPERTIES_PANEL_ERROR_MSG}</Alert>
                    </div>
                )}
                {isValid && warning && (
                    <div onClick={this.toggleLocalPanel} className={getDomainAlertClasses(collapsed, true, useTheme)}>
                        <Alert bsStyle="warning">{warning}</Alert>
                    </div>
                )}
            </>
        );
    }
}
