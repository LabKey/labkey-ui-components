import React, { ComponentType, PureComponent } from 'react';

import { fetchLineage, fetchLineageNodes, processLineageResult } from './actions';
import { ILineage, Lineage, LineageLoadingState, LineageResult } from './models';
import { LineageOptions } from './types';
import { VisGraphOptions } from './vis/VisGraphGenerator';
import { DEFAULT_LINEAGE_DISTANCE } from './constants';

export interface InjectedLineage {
    lineage: Lineage
    visGraphOptions: VisGraphOptions
}

export interface LoadLineage {
    cacheResults?: boolean
    distance?: number
    prefetchSeed?: boolean
}

export interface WithLineageOptions extends LoadLineage, LineageOptions {
    lsid: string
}

interface State {
    lineage: Lineage
}

const lineageCache: { [seed:string]: Lineage } = {};

export function withLineage<Props>(ComponentToWrap: ComponentType<Props & InjectedLineage>)
    : ComponentType<Props & WithLineageOptions> {
    class ComponentWithLineage extends PureComponent<Props & WithLineageOptions, State> {

        static defaultProps;

        readonly state: State = { lineage: undefined };

        cacheLineage = (): void => {
            const { cacheResults, prefetchSeed, lsid } = this.props;
            const { lineage } = this.state;

            if (cacheResults && lineage &&
                lineage.resultLoadingState === LineageLoadingState.LOADED &&
                (!prefetchSeed || lineage.seedResultLoadingState === LineageLoadingState.LOADED)) {
                lineageCache[lsid] = lineage;
            }
        };

        loadLineage = (): void => {
            const { cacheResults, distance, prefetchSeed, lsid } = this.props;

            // Lineage is already processed
            if (this.state.lineage) {
                return;
            } else if (cacheResults && lineageCache[lsid]) {
                this.setState({ lineage: lineageCache[lsid] });
                return;
            }

            // Create the initial lineage model for this seed
            this.setState({
                lineage: new Lineage({ seed: lsid })
            }, async () => {
                if (prefetchSeed === true) {
                    // Fetch seed node asynchronously to allow for decoupled loading
                    this.loadSeed();
                }

                await this.persistLineage({ resultLoadingState: LineageLoadingState.LOADING });

                try {
                    const result = await fetchLineage(lsid, distance)
                        .then(r => processLineageResult(r, this.props));

                    await this.persistLineage({
                        result,
                        resultLoadingState: LineageLoadingState.LOADED,
                    });
                } catch(e) {
                    console.error(e);
                    await this.persistLineage({
                        error: e.message,
                        resultLoadingState: LineageLoadingState.LOADED,
                    });
                }

                this.cacheLineage();
            });

        };

        loadSeed = async (): Promise<void> => {
            const { lsid } = this.props;

            await this.persistLineage({ seedResultLoadingState: LineageLoadingState.LOADING });

            try {
                const seedNode = (await fetchLineageNodes([lsid]))[0];

                const seedResult = await processLineageResult(LineageResult.create({
                    nodes: { [lsid]: seedNode },
                    seed: lsid,
                }));

                await this.persistLineage({
                    seedResult,
                    seedResultLoadingState: LineageLoadingState.LOADED,
                });
            } catch(e) {
                console.error(e);
                await this.persistLineage({
                    seedResultError: 'Error while pre-fetching the lineage seed',
                    seedResultLoadingState: LineageLoadingState.LOADED,
                });
            }

            this.cacheLineage();
        };

        persistLineage = async (lineageProps: Partial<ILineage>): Promise<void> => {
            return new Promise((resolve) => {
                this.setState((state) => ({
                    lineage: state.lineage.mutate(lineageProps)
                }), () => { resolve(); });
            });
        };

        componentDidMount(): void {
            this.loadLineage();
        }

        render() {
            const { ...props } = this.props;
            const { lineage } = this.state;

            return <ComponentToWrap
                lineage={lineage}
                visGraphOptions={lineage?.generateGraph(this.props)}
                {...props as Props}
            />
        }
    }

    ComponentWithLineage.defaultProps = {
        cacheResults: true,
        distance: DEFAULT_LINEAGE_DISTANCE,
        prefetchSeed: true,
    };

    return ComponentWithLineage;
}
