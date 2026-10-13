import type { HttpClient } from '../client';
import type { Asset, AssetWithOfferings, CreateAssetInput } from '../types';

export class AssetsResource {
  constructor(private readonly client: HttpClient) {}

  /**
   * Lists all underlying real-world assets registered in your organization workspace.
   */
  public async list(): Promise<Asset[]> {
    return this.client.request<Asset[]>('GET', '/assets');
  }

  /**
   * Catalogs a new underlying physical or financial asset in your organization workspace.
   */
  public async create(input: CreateAssetInput): Promise<Asset> {
    return this.client.request<Asset>('POST', '/assets', input);
  }

  /**
   * Retrieves a single registered real-world asset along with all investment offerings linked to it.
   */
  public async get(assetId: number): Promise<AssetWithOfferings> {
    return this.client.request<AssetWithOfferings>('GET', `/assets/${assetId}`);
  }
}
