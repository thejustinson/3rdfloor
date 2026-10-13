import type { HttpClient } from '../client';
import type { Asset, AssetWithOfferings, CreateAssetInput } from '../types';
export declare class AssetsResource {
    private readonly client;
    constructor(client: HttpClient);
    /**
     * Lists all underlying real-world assets registered in your organization workspace.
     */
    list(): Promise<Asset[]>;
    /**
     * Catalogs a new underlying physical or financial asset in your organization workspace.
     */
    create(input: CreateAssetInput): Promise<Asset>;
    /**
     * Retrieves a single registered real-world asset along with all investment offerings linked to it.
     */
    get(assetId: number): Promise<AssetWithOfferings>;
}
//# sourceMappingURL=assets.d.ts.map