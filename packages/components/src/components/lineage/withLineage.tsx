import React, { ComponentType, PureComponent } from 'react';
import { Draft, produce } from 'immer';

import { fetchLineageNodes, processLineageResult, loadLineageResult } from './actions';
import { ILineage, Lineage, LineageLoadingState, LineageResult } from './models';
import { LineageOptions } from './types';
import { DEFAULT_LINEAGE_DISTANCE } from './constants';

export interface InjectedLineage {
    lineage: Lineage
}

export interface LoadLineage {
    distance?: number
    prefetchSeed?: boolean
}

export interface WithLineageOptions extends LoadLineage, LineageOptions {
    lsid: string
}

interface State {
    lineage: Lineage
}

export function withLineage<Props>(
    ComponentToWrap: ComponentType<Props & InjectedLineage>,
    allowSeedPrefetch: boolean = true
): ComponentType<Props & WithLineageOptions> {
    class ComponentWithLineage extends PureComponent<Props & WithLineageOptions, State> {

        static defaultProps;

        readonly state: State = produce({ lineage: undefined }, () => {});

        private _mounted = true;

        loadLineage = async (): Promise<void> => {
            const { distance, prefetchSeed, lsid } = this.props;

            // Lineage is already processed
            if (this.state.lineage && lsid === this.state.lineage.seed) {
                return;
            }

            // Create the initial lineage model for this seed
            await this.setLineage(new Lineage({
                seed: lsid,
                resultLoadingState: LineageLoadingState.LOADING,
            }));

            if (allowSeedPrefetch && prefetchSeed === true) {
                // Fetch seed node asynchronously to allow for decoupled loading
                this.loadSeed();
            }

            try {
                const result = await loadLineageResult(lsid, distance, this.props);

                await this.updateLineage({
                    result,
                    resultLoadingState: LineageLoadingState.LOADED,
                });
            } catch(e) {
                console.error(e);
                await this.updateLineage({
                    error: e.message,
                    resultLoadingState: LineageLoadingState.LOADED,
                });
            }
        };

        loadSeed = async (): Promise<void> => {
            const { lsid } = this.props;

            await this.updateLineage({ seedResultLoadingState: LineageLoadingState.LOADING });

            try {
                const seedNodes = await fetchLineageNodes([lsid]);

                if (seedNodes.length !== 1) {
                    throw new Error('withLineage: Can only process a single seed node.');
                }

                const seedResult = await processLineageResult(LineageResult.create({
                    nodes: { [lsid]: seedNodes[0] },
                    seed: lsid,
                }), this.props);

                await this.updateLineage({
                    seedResult,
                    seedResultLoadingState: LineageLoadingState.LOADED,
                });
            } catch(e) {
                console.error(e);
                await this.updateLineage({
                    seedResultError: 'Error while pre-fetching the lineage seed',
                    seedResultLoadingState: LineageLoadingState.LOADED,
                });
            }
        };

        /**
         * An asynchronous helper function to update properties of the state's lineage.
         * Throws an error if called prior to the state's lineage having been initialized.
         * @param lineageProps The lineage properties to update. Properties not specified will be left unchanged.
         */
        updateLineage = async (lineageProps: Partial<ILineage>): Promise<void> => {
            if (!this.state.lineage) {
                throw new Error('withLineage: Called "updateLineage" prior to setting lineage.');
            }
            return this.setLineage(this.state.lineage.mutate(lineageProps));
        };

        /**
         * An asynchronous helper function that sets the lineage on state.
         * @param lineage The lineage object to set to
         */
        setLineage = async (lineage: Lineage): Promise<void> => {
            return new Promise((resolve) => {
                if (this._mounted) {
                    this.setState(produce((draft: Draft<State>) => {
                        draft.lineage = lineage;
                    }), () => { resolve(); });
                }
            });
        };

        componentDidMount(): void {
            this._mounted = true;
            this.loadLineage();
        }

        componentDidUpdate(prevProps: Readonly<Props & WithLineageOptions>): void {
            if (prevProps.lsid !== this.props.lsid) {
                this.loadLineage();
            }
        }

        componentWillUnmount(): void {
            this._mounted = false;
        }

        render() {
            const { ...props } = this.props;
            const { lineage } = this.state;

            return <ComponentToWrap {...props as Props} lineage={lineage} />;
        }
    }

    ComponentWithLineage.defaultProps = {
        distance: DEFAULT_LINEAGE_DISTANCE,
        prefetchSeed: true,
    };

    return ComponentWithLineage;
}
