import React from 'react';
import { Button, MenuItem, OverlayTrigger, Popover } from 'react-bootstrap';

import { AppURL, AssayContextConsumer, buildURL, PermissionTypes } from '../..';

interface AssayReImportRunButtonProps  {
    runId: string | number
    replacedByRunId? : string | number
}

export class AssayReimportRunButton extends React.Component<AssayReImportRunButtonProps> {

    render() {
        const { replacedByRunId, runId } = this.props;

        if (replacedByRunId) {
            return (
                <OverlayTrigger
                    overlay={<Popover
                        id="assay-submenu-warning">{"This run has already been replaced by Run " + replacedByRunId + " and cannot be re-imported."}</Popover>}
                    placement="left"
                >
                    <MenuItem disabled>Re-Import Run</MenuItem>
                </OverlayTrigger>
            );
        }
        else {
            return (
                <AssayContextConsumer>
                    {({assayDefinition, assayProtocol}) => {
                        if (runId !== undefined) {
                            const params = {
                                rowId: assayDefinition.id,
                                reRunId: runId
                            };
                            const options = {
                                returnURL: assayDefinition.getRunsUrl(),
                            };
                            let url = (assayProtocol.isGPAT()) ?
                                AppURL.create('assays', assayProtocol.providerName, assayProtocol.name, 'upload').addParam("runId", this.props.runId).toHref()
                                :
                                buildURL('assay', 'uploadWizard', params, options);
                            return (
                                <OverlayTrigger
                                    overlay={<Popover
                                        id="assay-submenu-info">{"Import a revised version of this run, with updated metadata or data file."}</Popover>}
                                    placement="left"
                                >
                                    <MenuItem href={url}>Re-Import Run</MenuItem>
                                </OverlayTrigger>
                            );
                        }

                        return null;
                    }}
                </AssayContextConsumer>
            )
        }
    }
}
