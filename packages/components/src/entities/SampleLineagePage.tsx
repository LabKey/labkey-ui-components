import React, { FC, memo, PureComponent } from 'react';
import { Map } from 'immutable';

import { LINEAGE_DIRECTIONS, LineageGroupingOptions } from '../internal/components/lineage/types';
import { ProductMenuModel } from '../internal/components/navigation/model';
import { AppURL } from '../internal/url/AppURL';
import { SOURCES_KEY } from '../internal/app/constants';
import { VisGraphNode } from '../internal/components/lineage/models';
import { InsufficientPermissionsAlert } from '../internal/components/permissions/InsufficientPermissionsAlert';

import { hasAllPermissions } from '../internal/components/base/models/User';

import { SampleLineageGraph } from './SampleLineageGraph';
import { SampleDetailContextConsumer, SampleDetailPage } from './SampleDetailPage';
import { useSampleTypeAppContext } from './SampleTypeAppContext';

interface PageProps {
    menu: ProductMenuModel;
    navigate: (url: string | AppURL, replace?: boolean) => void;
}

interface Props extends PageProps {
    groupingOptions?: LineageGroupingOptions;
    sampleID: string;
    sampleLsid: string;
}

class SampleLineagePanel extends PureComponent<Props> {
    onLineageNodeDblClick = (node: VisGraphNode) => {
        if (node?.lineageNode?.links?.lineage) {
            this.props.navigate(node.lineageNode.links.lineage);
        }
    };

    goToLineageGrid = () => {
        const { sampleLsid, groupingOptions } = this.props;
        this.props.navigate(
            AppURL.create('lineage').addParams({ seeds: sampleLsid, distance: groupingOptions?.childDepth })
        );
    };

    getSourceParentTitlesForLineage(): Map<LINEAGE_DIRECTIONS, Map<string, string>> {
        const { menu } = this.props;
        if (menu.getSection(SOURCES_KEY)) {
            let titleMap = Map<string, string>();
            menu.getSection(SOURCES_KEY)?.items.forEach(item => {
                titleMap = titleMap.set(item.label, 'Sources');
            });
            const parentMap = Map<LINEAGE_DIRECTIONS, Map<string, string>>();
            return parentMap.set(LINEAGE_DIRECTIONS.Parent, titleMap);
        }

        return undefined;
    }

    render() {
        const { sampleLsid, groupingOptions, sampleID } = this.props;
        return (
            <SampleLineageGraph
                sampleLsid={sampleLsid}
                sampleID={sampleID}
                goToLineageGrid={this.goToLineageGrid}
                onLineageNodeDblClick={this.onLineageNodeDblClick}
                groupTitles={this.getSourceParentTitlesForLineage()}
                groupingOptions={groupingOptions}
            />
        );
    }
}

export const SampleLineagePage: FC<PageProps> = memo(props => {
    const { linagePagePermissions } = useSampleTypeAppContext();

    return (
        <SampleDetailPage {...props} title="Sample Lineage">
            <SampleDetailContextConsumer>
                {({ sampleName, sampleLsid, user }) => {
                    // can't render lineage if the user can't see all entities in the lineage
                    if (!hasAllPermissions(user, linagePagePermissions)) {
                        return <InsufficientPermissionsAlert />;
                    }

                    return <SampleLineagePanel {...props} sampleLsid={sampleLsid} sampleID={sampleName} />;
                }}
            </SampleDetailContextConsumer>
        </SampleDetailPage>
    );
});
