import React, { FC, memo } from 'react';
import { MenuItem, OverlayTrigger, Popover } from 'react-bootstrap';

import { AppURL, AssayContextConsumer, AssayLink } from '../../..';
import { applyURL } from '../../url/AppURL';

interface AssayReImportRunButtonProps {
    runId: string | number;
    replacedByRunId?: string | number;
}

export const AssayReimportRunButton: FC<AssayReImportRunButtonProps> = memo(({ replacedByRunId, runId }) => {
    if (replacedByRunId) {
        return (
            <OverlayTrigger
                overlay={
                    <Popover id="assay-submenu-warning">
                        This run has already been replaced by Run {replacedByRunId} and cannot be re-imported.
                    </Popover>
                }
                placement="left"
            >
                <MenuItem disabled>Re-Import Run</MenuItem>
            </OverlayTrigger>
        );
    }

    return (
        <AssayContextConsumer>
            {({ assayDefinition, assayProtocol }) => {
                if (runId !== undefined && assayDefinition.reRunSupport?.toLowerCase() !== 'none') {
                    let url;
                    if (assayProtocol.isGPAT()) {
                        url = AppURL.create('assays', assayProtocol.providerName, assayProtocol.name, 'upload')
                            .addParam('runId', runId)
                            .toHref();
                    } else {
                        url =
                            assayDefinition.links.get(AssayLink.IMPORT) +
                            '&reRunId=' +
                            runId +
                            applyURL('returnURL', { returnURL: assayDefinition.getRunsUrl() });
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
});
