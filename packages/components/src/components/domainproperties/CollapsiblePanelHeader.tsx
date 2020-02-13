import React from "react";
import {Panel} from "react-bootstrap";
import {faCheckCircle, faExclamationCircle, faMinusSquare, faPlusSquare} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import { LabelHelpTip } from "../..";
import { DomainPanelStatus } from "./models";

interface Props {
    id: string
    title: string
    titlePrefix?: string
    collapsed: boolean
    collapsible: boolean
    controlledCollapse: boolean
    headerDetails?: string
    iconHelpMsg?: string
    panelStatus: DomainPanelStatus
    togglePanel: (evt: any, collapsed?: boolean) => any
    useTheme: boolean
    isValid: boolean
}

export class CollapsiblePanelHeader extends React.PureComponent<Props, any> {

    getPanelHeaderClass(): string {
        const { collapsed, collapsible, controlledCollapse, useTheme } = this.props;

        let classes = 'domain-panel-header ' + ((collapsible || controlledCollapse) ? 'domain-heading-collapsible' : '');
        classes += (!collapsed ? ' domain-panel-header-expanded' : ' domain-panel-header-collapsed');
        if (!collapsed) {
            classes += (useTheme ? ' labkey-page-nav' : ' domain-panel-header-no-theme');
        }

        return classes;
    }

    getHeaderIconHelpMsg(): string {
        const { isValid, panelStatus, iconHelpMsg } = this.props;

        if (!isValid) {
            return iconHelpMsg;
        }

        if (panelStatus === 'TODO') {
            return 'This section does not contain any user defined fields. You may want to review.'
        }

        return undefined;
    }

    getHeaderIconComponent = () => {
        return (
            <span className={this.getHeaderIconClass()}>
                <FontAwesomeIcon icon={this.getHeaderIcon()}/>
            </span>
        )
    };

    getHeaderIconClass() {
        const { collapsed, isValid, panelStatus } = this.props;
        const classes = 'domain-panel-status-icon';

        if (collapsed) {
            if (isValid && panelStatus === 'COMPLETE') {
                return classes + ' domain-panel-status-icon-green';
            }
            return classes + ' domain-panel-status-icon-blue';
        }

        return classes;
    };

    getHeaderIcon() {
        const { isValid, panelStatus } = this.props;

        if (!isValid || panelStatus === 'TODO') {
            return faExclamationCircle;
        }

        return faCheckCircle;
    };

    renderHeader() {
        const { children, collapsed, titlePrefix, panelStatus, controlledCollapse, collapsible, title, headerDetails } = this.props;
        const iconHelpMsg = ((panelStatus && panelStatus !== 'NONE') ? this.getHeaderIconHelpMsg() : undefined);

        return (
            <>
                {/*Header help icon*/}
                {iconHelpMsg &&
                    <LabelHelpTip title={title} body={() => (iconHelpMsg)} placement="top" iconComponent={this.getHeaderIconComponent}/>
                }
                {panelStatus && panelStatus !== 'NONE' && !iconHelpMsg && this.getHeaderIconComponent()}

                {/*Header name*/}
                <span className={'domain-panel-title'}>{(titlePrefix ? titlePrefix + ' - ' : '') + title}</span>

                {/*Expand/Collapse Icon*/}
                {(controlledCollapse || collapsible) && collapsed &&
                    <span className={'pull-right'}>
                        <FontAwesomeIcon size={'lg'} icon={faPlusSquare} className={"domain-form-expand-btn"}/>
                    </span>
                }
                {(controlledCollapse || collapsible) && !collapsed &&
                    <span className={'pull-right'}>
                        <FontAwesomeIcon size={'lg'} icon={faMinusSquare} className={"domain-form-collapse-btn"}/>
                    </span>
                }

                {/*Help tip*/}
                {children &&
                    <LabelHelpTip customStyle={{verticalAlign: 'top', marginLeft: '5px'}} placement={'top'} title={title} body={() => (children)}/>
                }

                {/*Header details, shown on the right side*/}
                {controlledCollapse && headerDetails &&
                    <span className='domain-panel-header-fields-defined'>{headerDetails}</span>
                }
            </>
        )
    }

    render(){
        const { id, togglePanel } = this.props;

        return(
            <Panel.Heading
                id={id}
                onClick={togglePanel}
                className={this.getPanelHeaderClass()}
            >
                {this.renderHeader()}
            </Panel.Heading>
        );
    }
}
