export class AssetsResource {
    client;
    constructor(client) {
        this.client = client;
    }
    /**
     * Lists all underlying real-world assets registered in your organization workspace.
     */
    async list() {
        return this.client.request('GET', '/assets');
    }
    /**
     * Catalogs a new underlying physical or financial asset in your organization workspace.
     */
    async create(input) {
        return this.client.request('POST', '/assets', input);
    }
    /**
     * Retrieves a single registered real-world asset along with all investment offerings linked to it.
     */
    async get(assetId) {
        return this.client.request('GET', `/assets/${assetId}`);
    }
}
//# sourceMappingURL=assets.js.map