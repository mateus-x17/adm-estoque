# 📑 RELATÓRIO TÉCNICO 09 — ARQUITETURA E SYSTEM DESIGN
**Projeto:** Estoque.OS  
**Data da Atualização:** 2026-11-10  
**Branch Auditada:** `feature/multitenant`  
**Nível:** MEDIUM (Monólito Modular Multi-Organização / Multi-Filial vs Alvo Escalável)  

---

## 1. Diagrama da Arquitetura Atual Implementada (Pós-Fase H) `[IMPLEMENTADO (verificado)]`

```mermaid
flowchart TD
    subgraph Portals["Portais Web (Clientes Multi-Organização / Multi-Filial)"]
        AdminPortal["/admin/login\nADMIN Global (Rede ou X-Loja-Id)"]
        StorePortal["/login\nGERENTE & OPERADOR (Travados em lojaId)"]
    end

    subgraph FrontendSPA["Frontend SPA (Vercel / React 19 + Vite 7)"]
        Zustand["Zustand Stores\nuseAuthStore · userStore · useTenantStore"]
        APIClient["apiClient.js\nInjeca Bearer JWT + X-Loja-Id"]
        UI["Páginas & Modais Portal\nPedidos · Desempenho · Lojas · PDF A4"]
    end

    subgraph BackendAPI["Backend Modular (Render / Express 5 ESM)"]
        Security["Helmet + CORS + Pino X-Request-Id\nauthMiddleware (userCache 60s) + permit()"]
        Scope["tenantScope.js\nresolveReadScope / resolveWriteStore"]
        CoreServices["Services Transacionais\norderService (ORDER BY id FOR UPDATE)\nmovementService · storeService\nuserService · productSpreadsheetService"]
    end

    subgraph CloudInfra["Persistência & CDN"]
        NeonDB[("PostgreSQL Neon\nOrganizacao -> Lojas -> Pedidos\nDecimal(10,2) + vendedorRefId")]
        Cloudinary["Cloudinary CDN (Timeout 10s)\nestoque-os/organizacoes/<org>/lojas/<loja>/"]
    end

    AdminPortal --> UI
    StorePortal --> UI
    UI --> Zustand --> APIClient
    APIClient -->|HTTPS + JWT + X-Loja-Id| Security
    Security --> Scope --> CoreServices
    CoreServices -->|Prisma Transactions + Native SQL| NeonDB
    CoreServices -->|Upload Multer -> Unlink| Cloudinary
```

---

## 2. Arquitetura Alvo Recomendada (+100 Usuários Simultâneos / Multi-Instância) `[RECOMENDAÇÃO]`

```mermaid
flowchart TD
    Edge["Cloudflare / Vercel Edge (TLS 1.3 + WAF)"] --> LB["Load Balancer HTTP"]
    LB --> NodeA["API Node Instance 1"]
    LB --> NodeB["API Node Instance 2"]
    NodeA & NodeB <--> Redis[("Redis / Upstash\nAuth Cache + Rate Limit\nIdempotency-Key + Filas")]
    Redis --> Worker["Async Worker\nCloudinary + Lotes Excel >5k"]
    NodeA & NodeB --> PgBouncer["Neon PgBouncer Pooler"]
    Worker --> PgBouncer --> Postgres[("PostgreSQL Neon Primary")]
```

### Principais Pontos de Atenção para Escala Horizontal
- Hoje `userCache`, `namesCacheByScope`, `idempotencyStore`, `orderIdempotencyStore` e `rate-limit` residem em RAM de processo único (`Map`), funcionando com consistência perfeita em **1 instância** (Render standard/free), mas exigirão **Redis** antes de ativar *horizontal auto-scaling*.
- Uploads de imagem para o Cloudinary ainda rodam de forma síncrona durante o POST/PUT de produtos/usuários (mitigado pelo timeout rígido de 10s).
