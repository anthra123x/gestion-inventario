# Storefront API Contract — Tecnicell

Base URL: `https://tecnicell.vercel.app/api`

---

## Products

### `GET /api/ecommerce/products`

List visible ecommerce products with stock.

**Query params:**

| Param     | Type    | Default | Description                                    |
|-----------|---------|---------|------------------------------------------------|
| category  | string  | —       | Filter by `ProductCategory` (ACCESSORY, REPAIR_PART, DEVICE, OTHER). Pass `ALL` for no filter. |
| search    | string  | —       | Text search on product name (case-insensitive contains) |
| page      | number  | 1       | Page number                                    |
| limit     | number  | 50      | Items per page (max 100)                       |
| featured  | boolean | —       | `"true"` to filter featured products only      |
| slugs     | string  | —       | Comma-separated slugs to fetch specific products |

**Response:**
```json
{
  "products": [
    {
      "id": "clx...",
      "slug": "cargador-rapido-20w",
      "name": "Cargador Rápido 20W",
      "description": "Cargador original 20W",
      "shortDescription": "Cargador original 20W USB-C",
      "longDescription": "<p>Larga descripción HTML</p>",
      "category": "ACCESSORY",
      "price": 45000,
      "compareAtPrice": 55000,
      "salePrice": 50000,
      "stock": 15,
      "showStock": true,
      "inStock": true,
      "featured": true,
      "badges": ["Nuevo", "Oferta"],
      "tags": ["cargador", "20w", "usb-c"],
      "image": {
        "url": "https://...",
        "alt": "Cargador Rápido 20W",
        "width": 800,
        "height": 800
      },
      "createdAt": "2026-05-13T00:00:00.000Z",
      "updatedAt": "2026-05-13T00:00:00.000Z"
    }
  ],
  "total": 42,
  "page": 1,
  "totalPages": 5
}
```

Notes:
- `price` = `ecommercePrice` if set, otherwise falls back to `salePrice`.
- Only products with `visible: true` AND `stock > 0` AND `deletedAt: null` are returned.

---

### `GET /api/ecommerce/products/:id`

Single product detail. `:id` can be a **product ID** (cuid) or a **slug**.

**Response:**
```json
{
  "product": {
    "id": "clx...",
    "slug": "cargador-rapido-20w",
    "name": "Cargador Rápido 20W",
    "description": "Cargador original 20W",
    "shortDescription": "Cargador original 20W USB-C",
    "longDescription": "<p>Larga descripción HTML</p>",
    "category": "ACCESSORY",
    "price": 45000,
    "compareAtPrice": 55000,
    "salePrice": 50000,
    "stock": 15,
    "showStock": true,
    "inStock": true,
    "featured": true,
    "badges": ["Nuevo", "Oferta"],
    "tags": ["cargador", "20w", "usb-c"],
    "metaTitle": "Cargador Rápido 20W | Tecnicell",
    "metaDescription": "Cargador original 20W con carga rápida USB-C",
    "images": [
      {
        "id": "cm...",
        "url": "https://...",
        "alt": "Cargador Rápido 20W",
        "width": 800,
        "height": 800,
        "sortOrder": 0,
        "isPrimary": true
      }
    ],
    "primaryImage": {
      "url": "https://...",
      "alt": "Cargador Rápido 20W",
      "width": 800,
      "height": 800
    },
    "createdAt": "2026-05-13T00:00:00.000Z",
    "updatedAt": "2026-05-13T00:00:00.000Z"
  }
}
```

**404:** `{ "error": "Producto no encontrado" }`

---

## Orders

### `POST /api/orders`

Create a new order from the storefront.

**Request body:**
```json
{
  "clientName": "Juan Pérez",
  "clientPhone": "3001234567",
  "clientEmail": "juan@example.com",
  "clientCity": "Bogotá",
  "clientAddress": "Calle 123 #45-67",
  "clientNotes": "Entregar en portería",
  "subtotal": 90000,
  "shipping": 5000,
  "total": 95000,
  "externalReference": "ORD-001",
  "items": [
    {
      "productId": "clx...",
      "quantity": 2,
      "unitPrice": 45000
    }
  ]
}
```

**Validation rules:**
| Field            | Required | Constraints                                  |
|------------------|----------|----------------------------------------------|
| clientName       | yes      | min 2 chars                                  |
| clientPhone      | yes      | min 8 chars                                  |
| clientEmail      | no       | valid email if provided                       |
| clientCity       | no       | —                                            |
| clientAddress    | no       | —                                            |
| clientNotes      | no       | —                                            |
| subtotal         | no       | default 0, min 0                             |
| shipping         | no       | default 0, min 0                             |
| total            | yes      | min 0                                        |
| externalReference| no       | unique — 409 if duplicate                     |
| items            | yes      | min 1 item                                   |

**Per item:**
| Field     | Required | Constraints              |
|-----------|----------|--------------------------|
| productId | yes      | valid product ID         |
| quantity  | yes      | min 1, must have stock   |
| unitPrice | yes      | min 0                    |

**Error responses:**

| Status | Meaning                                     |
|--------|---------------------------------------------|
| 400    | Validation error — `{ "error": "..." }`     |
| 409    | Insufficient stock or duplicate reference   |
| 500    | Server error                                |

**Success (201):**
```json
{
  "order": {
    "id": "clx...",
    "clientName": "Juan Pérez",
    "clientPhone": "3001234567",
    "status": "PENDING",
    "total": 95000,
    "items": [...],
    "createdAt": "..."
  }
}
```

---

### `GET /api/orders/:id`

Order tracking / status lookup. `:id` can be an **order ID** or an **externalReference**.

**Response:**
```json
{
  "order": {
    "id": "clx...",
    "clientName": "Juan Pérez",
    "clientPhone": "3001234567",
    "clientEmail": "juan@example.com",
    "clientCity": "Bogotá",
    "clientAddress": "Calle 123 #45-67",
    "clientNotes": "Entregar en portería",
    "status": "CONFIRMED",
    "subtotal": 90000,
    "shipping": 5000,
    "total": 95000,
    "externalReference": "ORD-001",
    "createdAt": "2026-05-13T00:00:00.000Z",
    "updatedAt": "2026-05-13T00:00:00.000Z",
    "items": [
      {
        "id": "cm...",
        "quantity": 2,
        "unitPrice": 45000,
        "total": 90000,
        "product": {
          "id": "clx...",
          "name": "Cargador Rápido 20W",
          "description": "...",
          "category": "ACCESSORY",
          "salePrice": 50000
        }
      }
    ]
  }
}
```

**404:** `{ "error": "Pedido no encontrado" }`

---

## Enums

### `OrderStatus`
```
PENDING → CONFIRMED → PREPARING → SHIPPED → DELIVERED
                                                 → CANCELLED (any state)
```

### `ProductCategory`
```
ACCESSORY | REPAIR_PART | DEVICE | OTHER
```

---

## Shared Database (read-only for storefront)

The storefront has **read-only** access to the shared PostgreSQL database. It MUST NOT write directly.

Tables available:
- `product_ecommerce` — ecommerce-specific fields
- `product_media` — product images
- `products` — base product data (stock, name, etc.)
- `orders` — order tracking (read)

Mutations happen exclusively through the API endpoints above.
