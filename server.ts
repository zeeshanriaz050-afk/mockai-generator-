import express from "express";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// In-memory Mock Store for projects and resources
interface MockResource {
  id: string | number;
  [key: string]: any;
}

interface EndpointDef {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  description: string;
  requestBodySample?: any;
  responseSample?: any;
}

interface MockProject {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  collections: Record<string, MockResource[]>;
  initialCollections: Record<string, MockResource[]>;
  endpoints: EndpointDef[];
  latencyMs: number;
}

const mockProjects: Record<string, MockProject> = {};

// Helper: seed default clothing store mock project
function createDefaultClothingProject(): MockProject {
  const products: MockResource[] = [
    {
      id: "prod_01",
      name: "Vintage Oversized Washed Hoodie",
      category: "streetwear",
      price: 68.0,
      currency: "USD",
      stock: 42,
      sizes: ["S", "M", "L", "XL"],
      colors: ["Charcoal", "Washed Olive", "Faded Rust"],
      rating: 4.8,
      reviewsCount: 124,
      image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80",
      description: "Heavyweight 450 GSM French terry cotton with dropped shoulder seams and raw vintage wash."
    },
    {
      id: "prod_02",
      name: "Relaxed Fit Denim Cargo Pants",
      category: "bottoms",
      price: 85.0,
      currency: "USD",
      stock: 19,
      sizes: ["30", "32", "34", "36"],
      colors: ["Vintage Blue", "Distressed Grey"],
      rating: 4.6,
      reviewsCount: 89,
      image: "https://images.unsplash.com/photo-1542272604-780c96856592?w=800&auto=format&fit=crop&q=80",
      description: "100% Japanese denim with ergonomic deep cargo pockets and adjustable ankle cinch straps."
    },
    {
      id: "prod_03",
      name: "Boxy Minimalist Heavyweight Tee",
      category: "t-shirts",
      price: 38.0,
      currency: "USD",
      stock: 65,
      sizes: ["XS", "S", "M", "L", "XL"],
      colors: ["Off-White", "Onyx Black", "Sage"],
      rating: 4.9,
      reviewsCount: 310,
      image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
      description: "Crafted from organic 280 GSM combed cotton with high-density ribbed collar that never sags."
    },
    {
      id: "prod_04",
      name: "Water-Resistant Technical Windbreaker",
      category: "outerwear",
      price: 135.0,
      currency: "USD",
      stock: 14,
      sizes: ["S", "M", "L"],
      colors: ["Matte Black", "Storm Cloud"],
      rating: 4.7,
      reviewsCount: 56,
      image: "https://images.unsplash.com/photo-1544441893-675973e31985?w=800&auto=format&fit=crop&q=80",
      description: "Ripstop nylon shell with taped sealed zippers, concealable hood, and breathable underarm vents."
    },
    {
      id: "prod_05",
      name: "Chunky Lug-Sole Combat Boots",
      category: "footwear",
      price: 160.0,
      currency: "USD",
      stock: 8,
      sizes: ["8", "9", "10", "11", "12"],
      colors: ["Matte Black"],
      rating: 4.9,
      reviewsCount: 78,
      image: "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=800&auto=format&fit=crop&q=80",
      description: "Full-grain calfskin leather with lightweight Vibram-inspired lugged tread for all-day cushioning."
    }
  ];

  const cartItems: MockResource[] = [
    {
      id: "cart_item_1",
      productId: "prod_01",
      name: "Vintage Oversized Washed Hoodie",
      size: "L",
      color: "Charcoal",
      quantity: 1,
      unitPrice: 68.0,
      totalPrice: 68.0,
      image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80"
    },
    {
      id: "cart_item_2",
      productId: "prod_03",
      name: "Boxy Minimalist Heavyweight Tee",
      size: "M",
      color: "Off-White",
      quantity: 2,
      unitPrice: 38.0,
      totalPrice: 76.0,
      image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80"
    }
  ];

  const users: MockResource[] = [
    {
      id: "usr_991",
      email: "alex.dev@example.com",
      name: "Alex Rivera",
      role: "customer",
      token: "mock-jwt-token-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.alex-rivera-token",
      shippingAddress: {
        street: "742 Evergreen Terrace",
        city: "Seattle",
        state: "WA",
        zip: "98101",
        country: "USA"
      }
    }
  ];

  const endpoints: EndpointDef[] = [
    {
      method: "GET",
      path: "/products",
      description: "Get all clothing products (supports ?category= & ?search= & ?limit=)",
      responseSample: products
    },
    {
      method: "GET",
      path: "/products/:id",
      description: "Get a single product by ID",
      responseSample: products[0]
    },
    {
      method: "POST",
      path: "/products",
      description: "Create a new clothing product",
      requestBodySample: {
        name: "Linen Camp Collar Shirt",
        category: "shirts",
        price: 52.0,
        currency: "USD",
        stock: 30,
        sizes: ["M", "L"]
      },
      responseSample: {
        id: "prod_06",
        name: "Linen Camp Collar Shirt",
        category: "shirts",
        price: 52.0,
        currency: "USD",
        stock: 30,
        sizes: ["M", "L"],
        createdAt: "2026-10-29T12:00:00Z"
      }
    },
    {
      method: "PUT",
      path: "/products/:id",
      description: "Update product attributes (price, stock, details)",
      requestBodySample: { price: 62.0, stock: 35 },
      responseSample: { ...products[0], price: 62.0, stock: 35 }
    },
    {
      method: "DELETE",
      path: "/products/:id",
      description: "Delete a product from catalog",
      responseSample: { success: true, message: "Product prod_01 removed" }
    },
    {
      method: "GET",
      path: "/cart",
      description: "Fetch current shopping cart items with subtotal calculation",
      responseSample: {
        items: cartItems,
        itemCount: 3,
        subtotal: 144.0,
        shipping: 0.0,
        tax: 11.52,
        total: 155.52
      }
    },
    {
      method: "POST",
      path: "/cart",
      description: "Add an item to the shopping cart",
      requestBodySample: {
        productId: "prod_02",
        size: "32",
        quantity: 1
      },
      responseSample: {
        success: true,
        message: "Added to cart",
        cartItem: {
          id: "cart_item_3",
          productId: "prod_02",
          quantity: 1,
          addedAt: "2026-10-29T12:00:00Z"
        }
      }
    },
    {
      method: "DELETE",
      path: "/cart/:id",
      description: "Remove item from cart",
      responseSample: { success: true, message: "Cart item deleted" }
    },
    {
      method: "POST",
      path: "/auth/login",
      description: "Simulate user authentication login and return JWT token",
      requestBodySample: { email: "alex.dev@example.com", password: "password123" },
      responseSample: {
        success: true,
        token: "mock-jwt-token-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.alex-rivera-token",
        user: users[0]
      }
    },
    {
      method: "GET",
      path: "/auth/me",
      description: "Get authenticated user profile details",
      responseSample: users[0]
    }
  ];

  return {
    id: "clothify-store",
    name: "Clothify Online Fashion Store",
    description: "Clothing boutique API with products catalog, shopping cart, and mock auth authentication.",
    createdAt: new Date().toISOString(),
    collections: {
      products: JSON.parse(JSON.stringify(products)),
      cart: JSON.parse(JSON.stringify(cartItems)),
      users: JSON.parse(JSON.stringify(users))
    },
    initialCollections: {
      products: JSON.parse(JSON.stringify(products)),
      cart: JSON.parse(JSON.stringify(cartItems)),
      users: JSON.parse(JSON.stringify(users))
    },
    endpoints,
    latencyMs: 150
  };
}

// Initialize seed
mockProjects["clothify-store"] = createDefaultClothingProject();

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Fallback intelligent procedural generator when Gemini key is not set or network fails
function generateProceduralMock(prompt: string): MockProject {
  const p = prompt.toLowerCase();
  const slug = "api-" + Math.random().toString(36).substring(2, 8);

  // Clothing / Ecommerce (English, Roman Urdu, Hindi)
  if (p.includes("cloth") || p.includes("kapr") || p.includes("fashion") || p.includes("wear") || p.includes("dress") || p.includes("shop") || p.includes("store")) {
    const defaultClothing = createDefaultClothingProject();
    return {
      ...defaultClothing,
      id: "clothing-" + Math.random().toString(36).substring(2, 7),
      name: "Urban Threads Fashion Store API",
      description: `E-commerce fashion API generated for: "${prompt}"`,
    };
  }

  // Food / Restaurant
  if (p.includes("food") || p.includes("restaurant") || p.includes("khana") || p.includes("pizza") || p.includes("burger") || p.includes("meal")) {
    const dishes: MockResource[] = [
      { id: "dish_1", name: "Artisanal Truffle Mushroom Pizza", category: "Pizza", price: 18.5, rating: 4.9, calories: 780, image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80", isVegetarian: true },
      { id: "dish_2", name: "Smash Wagyu Cheeseburger", category: "Burgers", price: 15.0, rating: 4.8, calories: 920, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80", isVegetarian: false },
      { id: "dish_3", name: "Crispy Peri Peri Chicken Tenders", category: "Sides", price: 9.5, rating: 4.7, calories: 540, image: "https://images.unsplash.com/photo-1562967914-608f82629710?w=800&auto=format&fit=crop&q=80", isVegetarian: false },
      { id: "dish_4", name: "Matcha Crepe Cake", category: "Desserts", price: 8.0, rating: 4.9, calories: 380, image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80", isVegetarian: true }
    ];
    const orders: MockResource[] = [
      { id: "ord_101", customerName: "Zeeshan", status: "preparing", total: 43.0, deliveryAddress: "Main Boulevard, Gulberg III", estimatedDeliveryMins: 25 },
      { id: "ord_102", customerName: "Sara", status: "in-transit", total: 28.5, deliveryAddress: "Sector F-7/2, Islamabad", estimatedDeliveryMins: 12 }
    ];
    return {
      id: slug,
      name: "Gourmet Bites Food & Restaurant API",
      description: `Food delivery and restaurant menu mock API for: "${prompt}"`,
      createdAt: new Date().toISOString(),
      collections: { dishes, orders },
      initialCollections: { dishes: JSON.parse(JSON.stringify(dishes)), orders: JSON.parse(JSON.stringify(orders)) },
      endpoints: [
        { method: "GET", path: "/dishes", description: "List all delicious menu items", responseSample: dishes },
        { method: "GET", path: "/dishes/:id", description: "Get specific dish details", responseSample: dishes[0] },
        { method: "POST", path: "/dishes", description: "Add new item to kitchen menu", requestBodySample: { name: "Spicy Garlic Wings", price: 11.0, category: "Sides" }, responseSample: { id: "dish_5", name: "Spicy Garlic Wings", price: 11.0 } },
        { method: "PUT", path: "/dishes/:id", description: "Update dish price or details", requestBodySample: { price: 19.5 }, responseSample: { ...dishes[0], price: 19.5 } },
        { method: "DELETE", path: "/dishes/:id", description: "Delete dish from menu", responseSample: { success: true } },
        { method: "GET", path: "/orders", description: "Get customer active orders", responseSample: orders },
        { method: "POST", path: "/orders", description: "Place new meal order", requestBodySample: { items: [{ dishId: "dish_1", qty: 2 }], deliveryAddress: "Flat 4B, Blue Area" }, responseSample: { id: "ord_103", status: "confirmed", total: 37.0 } }
      ],
      latencyMs: 120
    };
  }

  // Crypto / Finance
  if (p.includes("crypto") || p.includes("finance") || p.includes("bank") || p.includes("stock") || p.includes("paisa") || p.includes("wallet")) {
    const assets: MockResource[] = [
      { id: "btc", symbol: "BTC", name: "Bitcoin", priceUsd: 94250.0, change24h: 3.45, marketCap: 1850000000000, sparkline: [91000, 92400, 93800, 94250] },
      { id: "eth", symbol: "ETH", name: "Ethereum", priceUsd: 3450.2, change24h: -1.12, marketCap: 415000000000, sparkline: [3520, 3490, 3470, 3450.2] },
      { id: "sol", symbol: "SOL", name: "Solana", priceUsd: 198.8, change24h: 7.82, marketCap: 94000000000, sparkline: [184, 189, 194, 198.8] }
    ];
    const portfolio: MockResource[] = [
      { id: "hold_1", assetSymbol: "BTC", amount: 0.45, currentValuation: 42412.5, buyPriceAverage: 65000 },
      { id: "hold_2", assetSymbol: "ETH", amount: 3.2, currentValuation: 11040.64, buyPriceAverage: 3100 }
    ];
    return {
      id: slug,
      name: "Crypto & Financial Market API",
      description: `Live cryptocurrency prices and user portfolio tracking for: "${prompt}"`,
      createdAt: new Date().toISOString(),
      collections: { assets, portfolio },
      initialCollections: { assets: JSON.parse(JSON.stringify(assets)), portfolio: JSON.parse(JSON.stringify(portfolio)) },
      endpoints: [
        { method: "GET", path: "/assets", description: "Fetch all coins & market stats", responseSample: assets },
        { method: "GET", path: "/assets/:id", description: "Get specific coin breakdown", responseSample: assets[0] },
        { method: "GET", path: "/portfolio", description: "Get user wallet portfolio holdings", responseSample: portfolio },
        { method: "POST", path: "/portfolio", description: "Execute trade / add holding", requestBodySample: { assetSymbol: "SOL", amount: 5 }, responseSample: { id: "hold_3", assetSymbol: "SOL", amount: 5, status: "filled" } }
      ],
      latencyMs: 100
    };
  }

  // SaaS Workspace & Team
  if (p.includes("saas") || p.includes("team") || p.includes("project") || p.includes("workspace") || p.includes("task") || p.includes("member")) {
    const projects: MockResource[] = [
      { id: "proj_1", name: "Mobile App Redesign", status: "in-progress", progress: 68, lead: "Sarah Jenkins", budget: 24000 },
      { id: "proj_2", name: "Payment Gateway v3", status: "completed", progress: 100, lead: "David Kim", budget: 18000 },
      { id: "proj_3", name: "SOC2 Compliance Audit", status: "review", progress: 92, lead: "Amina Khan", budget: 35000 }
    ];
    const members: MockResource[] = [
      { id: "mem_1", name: "Sarah Jenkins", email: "sarah@company.io", role: "Design Lead", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80" },
      { id: "mem_2", name: "David Kim", email: "david@company.io", role: "Senior Backend Engineer", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80" }
    ];
    return {
      id: slug,
      name: "SaaS Team & Workspace API",
      description: `Team collaboration, project tracking and workspace management API for: "${prompt}"`,
      createdAt: new Date().toISOString(),
      collections: { projects, members },
      initialCollections: { projects: JSON.parse(JSON.stringify(projects)), members: JSON.parse(JSON.stringify(members)) },
      endpoints: [
        { method: "GET", path: "/projects", description: "List all workspace projects", responseSample: projects },
        { method: "GET", path: "/projects/:id", description: "Get single project detail", responseSample: projects[0] },
        { method: "POST", path: "/projects", description: "Create new project", requestBodySample: { name: "AI Search Engine", budget: 45000 }, responseSample: { id: "proj_4", name: "AI Search Engine" } },
        { method: "GET", path: "/members", description: "List all team members", responseSample: members },
        { method: "POST", path: "/members", description: "Invite new team member", requestBodySample: { email: "new@company.io", role: "Frontend Dev" }, responseSample: { id: "mem_3", email: "new@company.io", status: "invited" } }
      ],
      latencyMs: 140
    };
  }

  // Doctor / Clinic / Healthcare
  if (p.includes("doctor") || p.includes("clinic") || p.includes("hospital") || p.includes("health") || p.includes("patient") || p.includes("appointment")) {
    const doctors: MockResource[] = [
      { id: "doc_1", name: "Dr. Evelyn Reed", specialty: "Cardiologist", experienceYears: 14, rating: 4.9, fee: 120, image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80" },
      { id: "doc_2", name: "Dr. Marcus Vance", specialty: "Neurologist", experienceYears: 18, rating: 4.8, fee: 150, image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80" }
    ];
    const appointments: MockResource[] = [
      { id: "apt_1", patientName: "Ayesha Malik", doctorId: "doc_1", doctorName: "Dr. Evelyn Reed", date: "2026-11-05", time: "10:30 AM", status: "confirmed" }
    ];
    return {
      id: slug,
      name: "Healthcare & Doctor Appointments API",
      description: `Doctor listings, clinic schedules, and patient booking API for: "${prompt}"`,
      createdAt: new Date().toISOString(),
      collections: { doctors, appointments },
      initialCollections: { doctors: JSON.parse(JSON.stringify(doctors)), appointments: JSON.parse(JSON.stringify(appointments)) },
      endpoints: [
        { method: "GET", path: "/doctors", description: "List available doctors & specialists", responseSample: doctors },
        { method: "GET", path: "/doctors/:id", description: "Get doctor profile & credentials", responseSample: doctors[0] },
        { method: "GET", path: "/appointments", description: "List patient appointments", responseSample: appointments },
        { method: "POST", path: "/appointments", description: "Book new appointment slot", requestBodySample: { doctorId: "doc_1", date: "2026-11-06", time: "02:00 PM" }, responseSample: { id: "apt_2", status: "confirmed" } }
      ],
      latencyMs: 130
    };
  }

  // Default generic rich entity generator based on prompt
  const baseItems: MockResource[] = [
    {
      id: "item_01",
      title: "Design System Tokens v2.0",
      status: "active",
      category: "Engineering",
      priority: "high",
      tags: ["design", "ui", "typescript"],
      createdAt: "2026-10-25T08:30:00Z",
      metrics: { score: 98, views: 1420 }
    },
    {
      id: "item_02",
      title: "Realtime WebSocket Notification Gateway",
      status: "in-progress",
      category: "Backend",
      priority: "critical",
      tags: ["realtime", "infra", "sockets"],
      createdAt: "2026-10-26T11:15:00Z",
      metrics: { score: 85, views: 890 }
    },
    {
      id: "item_03",
      title: "Authentication & OAuth Multi-tenant Flow",
      status: "completed",
      category: "Security",
      priority: "medium",
      tags: ["auth", "security", "jwt"],
      createdAt: "2026-10-27T16:45:00Z",
      metrics: { score: 92, views: 2300 }
    }
  ];

  return {
    id: slug,
    name: prompt.slice(0, 40) || "Dynamic Mock Service",
    description: `Auto-generated mock API based on: "${prompt}"`,
    createdAt: new Date().toISOString(),
    collections: { items: baseItems },
    initialCollections: { items: JSON.parse(JSON.stringify(baseItems)) },
    endpoints: [
      { method: "GET", path: "/items", description: "List all items", responseSample: baseItems },
      { method: "GET", path: "/items/:id", description: "Retrieve single item by ID", responseSample: baseItems[0] },
      { method: "POST", path: "/items", description: "Create item", requestBodySample: { title: "New Item", status: "active" }, responseSample: { id: "item_04", title: "New Item", status: "active" } },
      { method: "PUT", path: "/items/:id", description: "Update item", requestBodySample: { status: "completed" }, responseSample: { ...baseItems[0], status: "completed" } },
      { method: "DELETE", path: "/items/:id", description: "Delete item", responseSample: { success: true } }
    ],
    latencyMs: 150
  };
}

// Route: Generate Mock API via Gemini 3.8 Flash (with fast timeout & intelligent fallback)
app.post("/api/generate-mock", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== "string") {
      res.status(400).json({ error: "Prompt string is required" });
      return;
    }

    // Try Gemini if API key is present
    if (process.env.GEMINI_API_KEY) {
      try {
        const systemInstruction = `You are MockAI Studio, a specialized backend mock generator.
The user describes their backend requirements in English, Urdu, or Roman Urdu.
Generate a comprehensive, production-grade mock REST API schema as valid JSON.`;

        // 6-second timeout for Gemini call
        const geminiPromise = ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: `Create a mock REST API for: "${prompt}".
Output JSON with:
{
  "id": "kebab-case-slug",
  "name": "API Title",
  "description": "What it does",
  "collections": {
    "resourceName": [ { "id": "1", ...realistic fields and Unsplash image if visual... } ]
  },
  "endpoints": [
    { "method": "GET", "path": "/resourceName", "description": "...", "responseSample": [...] }
  ],
  "latencyMs": 150
}`,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
          }
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Gemini generation timed out")), 6000)
        );

        const response: any = await Promise.race([geminiPromise, timeoutPromise]);
        const text = response.text?.trim() || "";
        const parsed = JSON.parse(text);

        if (parsed.collections && Object.keys(parsed.collections).length > 0) {
          // Ensure endpoints exist for every collection
          const endpoints: EndpointDef[] = parsed.endpoints || [];
          for (const [colName, colItems] of Object.entries(parsed.collections)) {
            const hasGet = endpoints.some((e) => e.path === `/${colName}` && e.method === "GET");
            if (!hasGet) {
              endpoints.unshift({
                method: "GET",
                path: `/${colName}`,
                description: `List all ${colName}`,
                responseSample: colItems,
              });
              endpoints.push({
                method: "GET",
                path: `/${colName}/:id`,
                description: `Get single ${colName} by ID`,
                responseSample: Array.isArray(colItems) ? colItems[0] : colItems,
              });
              endpoints.push({
                method: "POST",
                path: `/${colName}`,
                description: `Create new ${colName}`,
                requestBodySample: Array.isArray(colItems) && colItems[0] ? colItems[0] : { title: "New" },
                responseSample: { success: true },
              });
            }
          }

          const project: MockProject = {
            id: (parsed.id || "mock-" + Date.now()).toLowerCase().replace(/[^a-z0-9_-]/g, "-"),
            name: parsed.name || "Generated Mock API",
            description: parsed.description || `Generated via MockAI Studio for "${prompt}"`,
            createdAt: new Date().toISOString(),
            collections: parsed.collections,
            initialCollections: JSON.parse(JSON.stringify(parsed.collections)),
            endpoints,
            latencyMs: parsed.latencyMs || 150
          };

          mockProjects[project.id] = project;
          res.json({ success: true, project });
          return;
        }
      } catch (geminiErr: any) {
        console.warn("Gemini generation fallback:", geminiErr?.message);
      }
    }

    // Fallback if no Gemini key or call errored/timed out
    const fallbackProject = generateProceduralMock(prompt);
    mockProjects[fallbackProject.id] = fallbackProject;
    res.json({ success: true, project: fallbackProject, fallback: true });
  } catch (error: any) {
    console.error("API generation failed:", error);
    res.status(500).json({ error: error?.message || "Failed to generate mock API" });
  }
});

// Route: Get all existing mock projects
app.get("/api/projects", (_req, res) => {
  const list = Object.values(mockProjects).map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    createdAt: p.createdAt,
    resourceCount: Object.keys(p.collections).length,
    endpointCount: p.endpoints.length,
    resources: Object.keys(p.collections),
    latencyMs: p.latencyMs
  }));
  res.json({ projects: list });
});

// Route: Get single project complete data
app.get("/api/projects/:projectId", (req, res) => {
  const project = mockProjects[req.params.projectId];
  if (!project) {
    res.status(404).json({ error: `Mock project '${req.params.projectId}' not found` });
    return;
  }
  res.json({ project });
});

// Route: Reset mock project data back to seed
app.post("/api/projects/:projectId/reset", (req, res) => {
  const project = mockProjects[req.params.projectId];
  if (!project) {
    res.status(404).json({ error: `Mock project '${req.params.projectId}' not found` });
    return;
  }
  project.collections = JSON.parse(JSON.stringify(project.initialCollections));
  res.json({ success: true, message: "Collections reset to original seed data", project });
});

// Route: Update project settings (e.g. latency simulation)
app.patch("/api/projects/:projectId/settings", (req, res) => {
  const project = mockProjects[req.params.projectId];
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  if (typeof req.body.latencyMs === "number") {
    project.latencyMs = Math.max(0, Math.min(5000, req.body.latencyMs));
  }
  res.json({ success: true, latencyMs: project.latencyMs });
});

// ==========================================
// LIVE MOCK REST ENGINE: /api/m/:projectId/*
// Handles GET, POST, PUT, PATCH, DELETE for any mock resource!
// ==========================================
app.all("/api/m/:projectId/*", async (req, res) => {
  const { projectId } = req.params;
  const project = mockProjects[projectId];

  // Optional simulated latency via query (?delay=500), header (x-mock-delay), or project setting
  const queryDelay = parseInt(req.query.delay as string, 10);
  const headerDelay = parseInt(req.headers["x-mock-delay"] as string, 10);
  const latency = !isNaN(queryDelay) ? queryDelay : !isNaN(headerDelay) ? headerDelay : project?.latencyMs || 0;

  if (latency > 0) {
    await new Promise((r) => setTimeout(r, latency));
  }

  // Simulated status test via query (?status=500, ?status=401, ?status=404)
  const forcedStatus = parseInt(req.query.status as string, 10);
  if (!isNaN(forcedStatus) && forcedStatus >= 400 && forcedStatus <= 599) {
    res.status(forcedStatus).json({
      error: `Simulated HTTP ${forcedStatus} error`,
      status: forcedStatus,
      timestamp: new Date().toISOString(),
      tip: "Remove '?status=' query param to resume normal responses."
    });
    return;
  }

  if (!project) {
    res.status(404).json({
      error: `Mock project '${projectId}' does not exist on this server.`,
      availableProjects: Object.keys(mockProjects)
    });
    return;
  }

  // Parse path after /api/m/:projectId/
  const subPath = (req.params as any)[0] || ""; // e.g. "products", "products/prod_01", "cart", "auth/login"
  const segments = subPath.split("/").filter(Boolean);

  if (segments.length === 0) {
    res.json({
      project: project.name,
      description: project.description,
      endpoints: project.endpoints.map((e) => `${e.method} /api/m/${projectId}${e.path}`),
      resources: Object.keys(project.collections)
    });
    return;
  }

  // Special Auth routes mock handling: /auth/login, /auth/register, /auth/me
  if (segments[0] === "auth") {
    const authAction = segments[1];
    if (authAction === "login" && req.method === "POST") {
      const email = req.body?.email || "developer@mockai.dev";
      res.json({
        success: true,
        token: `mock-jwt-token-${Math.random().toString(36).substring(2, 15)}`,
        user: {
          id: "usr_mock_1",
          email,
          name: email.split("@")[0].toUpperCase(),
          role: "user",
          lastLogin: new Date().toISOString()
        }
      });
      return;
    }
    if (authAction === "register" && req.method === "POST") {
      res.status(201).json({
        success: true,
        message: "User registered successfully in mock database",
        token: `mock-jwt-token-${Math.random().toString(36).substring(2, 15)}`,
        user: {
          id: `usr_${Date.now()}`,
          email: req.body?.email || "newuser@mockai.dev",
          name: req.body?.name || "New Developer",
          role: "user"
        }
      });
      return;
    }
    if (authAction === "me" && req.method === "GET") {
      const authHeader = req.headers.authorization;
      res.json({
        id: "usr_mock_1",
        email: "developer@mockai.dev",
        name: "MockAI Developer",
        verified: true,
        bearerTokenProvided: !!authHeader
      });
      return;
    }
  }

  // Collection resource routing
  const resourceName = segments[0];
  const resourceId = segments[1];

  let collection = project.collections[resourceName];
  if (!collection) {
    // If resource doesn't exist yet, check if matching endpoint sample exists
    const matchingEndpoint = project.endpoints.find(
      (e) => e.method === req.method && (e.path === "/" + subPath || e.path === subPath)
    );
    if (matchingEndpoint?.responseSample) {
      res.json(matchingEndpoint.responseSample);
      return;
    }
    // Initialize collection if none
    project.collections[resourceName] = [];
    collection = project.collections[resourceName];
  }

  // Handle standard REST operations
  switch (req.method) {
    case "GET": {
      if (resourceId) {
        const item = collection.find(
          (x) => String(x.id) === String(resourceId) || String((x as any)._id) === String(resourceId)
        );
        if (!item) {
          res.status(404).json({ error: `Item with id '${resourceId}' not found in '${resourceName}'` });
          return;
        }
        res.json(item);
        return;
      }

      // Query filters
      let result = [...collection];
      const { search, limit, page, sort, ...filters } = req.query;

      // Filter by properties: ?category=streetwear
      for (const [key, val] of Object.entries(filters)) {
        if (val !== undefined && val !== "") {
          result = result.filter((item) => {
            const itemVal = item[key];
            if (itemVal === undefined) return false;
            return String(itemVal).toLowerCase() === String(val).toLowerCase();
          });
        }
      }

      // Search keyword across all fields
      if (typeof search === "string" && search.trim()) {
        const q = search.toLowerCase();
        result = result.filter((item) => JSON.stringify(item).toLowerCase().includes(q));
      }

      // Pagination
      const pageNum = parseInt(page as string, 10) || 1;
      const limitNum = parseInt(limit as string, 10);

      if (!isNaN(limitNum) && limitNum > 0) {
        const startIndex = (pageNum - 1) * limitNum;
        const pagedData = result.slice(startIndex, startIndex + limitNum);
        res.json({
          data: pagedData,
          total: result.length,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(result.length / limitNum)
        });
        return;
      }

      res.json(result);
      return;
    }

    case "POST": {
      const newItem: MockResource = {
        id: req.body?.id || `${resourceName.slice(0, 4)}_${Date.now().toString(36)}`,
        ...req.body,
        createdAt: new Date().toISOString()
      };
      collection.unshift(newItem);
      res.status(201).json(newItem);
      return;
    }

    case "PUT":
    case "PATCH": {
      if (!resourceId) {
        res.status(400).json({ error: "Item ID required in path for update (e.g. /" + resourceName + "/123)" });
        return;
      }
      const index = collection.findIndex(
        (x) => String(x.id) === String(resourceId) || String((x as any)._id) === String(resourceId)
      );
      if (index === -1) {
        res.status(404).json({ error: `Item with id '${resourceId}' not found to update` });
        return;
      }
      collection[index] = {
        ...collection[index],
        ...req.body,
        updatedAt: new Date().toISOString()
      };
      res.json(collection[index]);
      return;
    }

    case "DELETE": {
      if (!resourceId) {
        res.status(400).json({ error: "Item ID required in path for delete" });
        return;
      }
      const prevLen = collection.length;
      project.collections[resourceName] = collection.filter(
        (x) => String(x.id) !== String(resourceId) && String((x as any)._id) !== String(resourceId)
      );
      if (project.collections[resourceName].length === prevLen) {
        res.status(404).json({ error: `Item with id '${resourceId}' not found to delete` });
        return;
      }
      res.json({ success: true, message: `Resource item '${resourceId}' deleted successfully` });
      return;
    }

    default:
      res.status(405).json({ error: `Method ${req.method} not allowed on this mock endpoint` });
  }
});

// In production, serve dist; in dev, mount Vite middlewares
async function startServer() {
  const isProd = process.env.NODE_ENV === "production";

  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 MockAI Studio server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
