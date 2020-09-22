import React from 'react';
import { MenuItem, OverlayTrigger, Popover } from 'react-bootstrap';

import { AppURL, AssayContextConsumer, AssayLink } from '../../../index';
import { applyURL } from '../../../url/ActionURL';

interface AssayReImportRunButtonProps {
    runId: string | number;
    replacedByRunId?: string | number;
}

export class AssayReimportRunButton extends React.Component<AssayReImportRunButtonProps> {
    render() {
        const { replacedByRunId, runId } = this.props;

        if (replacedByRunId) {
            return (
                <OverlayTrigger
                    overlay={
                        <Popover id="assay-submenu-warning">
                            {'This run has already been replaced by Run ' +
                                replacedByRunId +
                                ' and cannot be re-imported.'}
                        </Popover>
                    }
                    placement="left"
                >
                    <MenuItem disabled>Re-Import Run</MenuItem>
                </OverlayTrigger>
            );
        } else {
            return (
                <AssayContextConsumer>
                    {({ assayDefinition, assayProtocol }) => {
                        if (
                            runId !== undefined &&
                            assayDefinition.reRunSupport &&
                            assayDefinition.reRunSupport.toLowerCase() != 'none'
                        ) {
                            let url;
                            if (assayProtocol.isGPAT()) {
                                url = AppURL.create('assays', assayProtocol.providerName, assayProtocol.name, 'upload')
                                    .addParam('runId', this.props.runId)
                                    .toHref();
                            } else {
                                const params = {
                                    reRunId: runId,
                                };
                                const options = {
                                    returnURL: assayDefinition.getRunsUrl(),
                                };

                                url =
                                    assayDefinition.links.get(AssayLink.IMPORT) +
                                    '&reRunId=' +
                                    runId +
                                    applyURL('returnURL', options);
                            }
                            return (
                                <OverlayTrigger
                                    overlay={
                                        <Popover id="assay-submenu-info">
                                            Import a revised version of this run, with updated metadata or data file.
                                        </Popover>
                                    }
                                    placement="left"
                                >
                                    <MenuItem href={url}>Re-Import Run</MenuItem>
                                </OverlayTrigger>
                            );
                        }

                        return null;
                    }}
                </AssayContextConsumer>
            );
        }
    }
}
