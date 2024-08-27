import React, { ComponentType, PureComponent, ReactNode } from 'react';
import { produce } from 'immer';

import { LoadingState } from '../../../public/LoadingState';

import { LineageAPIWrapper, ServerLineageAPIWrapper } from './actions';
import { Lineage } from './models';
import { LineageOptions } from './types';
import { DEFAULT_LINEAGE_DISTANCE } from './constants';

export interface InjectedLineage {
    lineage: Lineage;
}

export interface LoadLineage {
    distance?: number;
    prefetchSeed?: boolean;
}

export interface WithLineageOptions extends LoadLineage, LineageOptions {
    containerPath?: string;
    lsid: string;
    api?: LineageAPIWrapper;
}

interface State {
    lineage: Lineage;
}

export function withLineage<Props>(
    ComponentToWrap: ComponentType<Props & InjectedLineage>,
    allowSeedPrefetch = true,
    allowLoadSampleStats = false,
    applyDefaultDistance = true
): ComponentType<Props & WithLineageOptions> {
    class ComponentWithLineage extends PureComponent<Props & WithLineageOptions, State> {
        static defaultProps;

        readonly state: State = produce({ lineage: undefined }, () => {});

        private _mounted = true;

        loadLineage = async (forceReload?: boolean): Promise<void> => {
            const { api, containerPath, distance, prefetchSeed, lsid } = this.props;

            // Lineage is already processed
            if (this.state.lineage && lsid === this.state.lineage.seed && !forceReload) {
                return;
            }

            // Create the initial lineage model for this seed
            this.setLineage(
                new Lineage({
                    seed: lsid,
                    resultLoadingState: LoadingState.LOADING,
                })
            );

            if (allowSeedPrefetch && prefetchSeed === true) {
                // Fetch seed node asynchronously to allow for decoupled loading
                this.loadSeed();
            }

            try {
                const result = await api.loadLineageResult(lsid, containerPath, distance, this.props);

                let sampleStats: any;
                if (allowLoadSampleStats) {
                    sampleStats = await api.loadSampleStats(result);
                }

                this.updateLineage({
                    result,
                    resultLoadingState: LoadingState.LOADED,
                    sampleStats,
                });
            } catch (e) {
                console.error(e);
                this.updateLineage({
                    error: e.message,
                    resultLoadingState: LoadingState.LOADED,
                });
            }
        };

        loadSeed = async (): Promise<void> => {
            const { api, containerPath, lsid } = this.props;

            this.updateLineage({ seedResultLoadingState: LoadingState.LOADING });

            try {
                const seedResult = await api.loadSeedResult(lsid, containerPath, this.props);

                this.updateLineage({
                    seedResult,
                    seedResultLoadingState: LoadingState.LOADED,
                });
            } catch (e) {
                console.error(e);
                this.updateLineage({
                    seedResultError: 'Error while pre-fetching the lineage seed',
                    seedResultLoadingState: LoadingState.LOADED,
                });
            }
        };

        /**
         * Helper function to update properties of the state's lineage.
         * @param lineageProps The lineage properties to update. Properties not specified will be left unchanged.
         */
        updateLineage = (lineageProps: Partial<Lineage>): void => {
            if (this._mounted) {
                this.setState(
                    produce<State>(draft => {
                        draft.lineage = draft.lineage.mutate(lineageProps);
                    })
                )
            }
        };

        /**
         * Helper function that sets the lineage on state.
         * @param lineage The lineage object to set to
         */
        setLineage = (lineage: Lineage): void => {
            if (this._mounted) {
                this.setState(
                    produce<State>(draft => {
                        draft.lineage = lineage;
                    })
                )
            }
        };

        componentDidMount(): void {
            this._mounted = true;
            this.loadLineage();
        }

        componentDidUpdate(prevProps: Readonly<Props & WithLineageOptions>): void {
            if (
                prevProps.lsid !== this.props.lsid ||
                prevProps.filters !== this.props.filters ||
                prevProps.runProtocolLsid !== this.props.runProtocolLsid
            ) {
                this.loadLineage(prevProps.runProtocolLsid !== this.props.runProtocolLsid);
            }
        }

        componentWillUnmount(): void {
            this._mounted = false;
        }

        render(): ReactNode {
            const { ...props } = this.props;
            const { lineage } = this.state;

            return <ComponentToWrap {...(props as Props)} lineage={lineage} />;
        }
    }

    ComponentWithLineage.defaultProps = {
        distance: applyDefaultDistance ? DEFAULT_LINEAGE_DISTANCE : undefined,
        prefetchSeed: true,
        api: new ServerLineageAPIWrapper(),
    };

    return ComponentWithLineage;
}
