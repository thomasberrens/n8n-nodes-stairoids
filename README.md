# n8n-nodes-stairoids

This is an n8n community node package that integrates with the [Stairoids](https://stairoids.nl) lead generation platform.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## Installation

### Community Nodes (Recommended)

1. Go to **Settings > Community Nodes**
2. Select **Install**
3. Enter `n8n-nodes-stairoids` in the **npm Package Name** field
4. Accept the risks and click **Install**

### Manual Installation

To install this node manually:

```bash
cd ~/.n8n
npm install n8n-nodes-stairoids
```

Then restart n8n.

### Development Installation

For local development and testing:

```bash
cd n8n-nodes-stairoids
npm install
npm run build
npm link

cd ~/.n8n/custom
npm link n8n-nodes-stairoids
```

Or use the environment variable approach:

```bash
N8N_CUSTOM_EXTENSIONS="/path/to/n8n-nodes-stairoids" npx n8n
```

## Nodes

### Stairoids Trigger

Webhook-based trigger node that listens for events from Stairoids.

**Available Events:**

| Event | Description |
|-------|-------------|
| Funnel Change | Triggers when a company's funnel state changes |
| Score Change | Triggers when a company's lead score changes |
| ICP Change | Triggers when a company's ICP assignment changes |
| New Activity | Triggers when a company has new engagement activities |

### Stairoids (Action)

Add activities to leads in Stairoids.

**Fields:**

| Field | Required | Description |
|-------|----------|-------------|
| Display Name | Yes | The name of the activity (e.g., "Has raised a lot of funding") |
| LinkedIn URL | No | LinkedIn URL of the person or company (preferred) |
| Website URL | No | Website URL of the company (fallback if no LinkedIn URL) |
| Score | No | Points to assign (only used on first occurrence of this display name) |

Provide at least a LinkedIn URL or Website URL to link the activity to a lead. If neither is provided, the activity is saved as standalone.

## Authentication

This node uses OAuth2 (PKCE) authentication with the Stairoids API.

### Setup Steps

1. In n8n, create new **Stairoids API** credentials
2. Set the **API URL** (default: `http://localhost:8080/api`, production: `https://app.stairoids.com/api`)
3. Complete the OAuth2 authorization flow

## API Endpoints

The node interacts with the following Stairoids API endpoints:

| Operation | Method | Endpoint |
|-----------|--------|----------|
| Subscribe Webhook | POST | `/integrations/webhook/n8n/hooks/{event}/subscribe` |
| Unsubscribe Webhook | DELETE | `/integrations/webhook/n8n/hooks/{subscriptionId}` |
| Add Activity | POST | `/integrations/webhook/n8n/actions/add_activity` |

## Example Workflow

```
[Stairoids Trigger: Score Change]
           |
           v
   [IF: Score > 80]
           |
     +-----+-----+
     |           |
     v           v
[Slack:      [Stairoids:
 Notify]      Add Activity]
```

1. Trigger on score change
2. Check if lead score is above threshold
3. Notify team on Slack
4. Log a follow-up activity

## Compatibility

- n8n version: 1.0.0+
- Node.js: 18+

## Support

For support, contact [sam@stairoids.com](mailto:sam@stairoids.com).

## License

[MIT](LICENSE)
