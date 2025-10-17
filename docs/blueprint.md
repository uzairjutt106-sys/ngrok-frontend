# **App Name**: Scrapit

## Core Features:

- Add Scrap Item: Record the addition of a scrap item including its type, weight (kgs), and purchase price.
- Update Stock Levels: Modify the existing stock levels based on purchases or sales using the /transactions endpoint. API key is required.
- View Current Inventory: Display current inventory levels in kgs and total value, updated based on transactions via the API.
- Generate Period Reports: Produce end-of-period reports on purchases, sales, and expenses via the Daily Summary endpoint, filtered by date range.
- Health Check: Verify the functionality of the /health endpoint to assure connection with the API backend.
- List Items: Generate dropdown list from item names using /items API endpoint.

## Style Guidelines:

- Primary color: Earthy green (#8FBC8F) to align with the industrial theme, giving a natural and grounded feel.
- Background color: Light desaturated green (#F0FAF0) as a calming backdrop to enhance readability.
- Accent color: Metallic gray (#A9A9A9) to provide contrast and reinforce the industrial aesthetic.
- Body and headline font: 'PT Sans', a humanist sans-serif suitable for both headlines and body text, offering a modern yet accessible feel.
- Use solid, simple icons in metallic gray to represent different scrap materials and actions (e.g., plus sign for adding items, chart for reports).
- Implement a clean, professional layout with clearly defined sections for data input, inventory display, and report generation. Use a grid system for responsiveness.
- Incorporate subtle transitions and loading animations to enhance user experience without being distracting. For example, smoothly update inventory values upon adding new scrap.