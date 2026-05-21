--
-- PostgreSQL database dump
--

\restrict 1zGRfnRA6QfKDuBh8QRSsRu2xZaLDLFKD1HXH87eEufl07bEvd7TVao43H6H9Q0

-- Dumped from database version 17.10
-- Dumped by pg_dump version 17.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: CashMovementType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."CashMovementType" AS ENUM (
    'INCOME',
    'EXPENSE',
    'SALE'
);


--
-- Name: CashSessionStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."CashSessionStatus" AS ENUM (
    'OPEN',
    'CLOSED'
);


--
-- Name: DocumentType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."DocumentType" AS ENUM (
    'CC',
    'NIT',
    'CE',
    'TI',
    'PASSPORT',
    'OTHER'
);


--
-- Name: InvoiceStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."InvoiceStatus" AS ENUM (
    'ACTIVE',
    'CANCELLED',
    'VOIDED',
    'ACTIVE_ADJUSTED'
);


--
-- Name: KardexType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."KardexType" AS ENUM (
    'IN',
    'OUT',
    'ADJUST'
);


--
-- Name: PaymentMethod; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PaymentMethod" AS ENUM (
    'CASH',
    'CARD',
    'TRANSFER',
    'MIXED'
);


--
-- Name: PurchaseStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PurchaseStatus" AS ENUM (
    'DRAFT',
    'ORDERED',
    'RECEIVED',
    'CANCELLED'
);


--
-- Name: RoleName; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."RoleName" AS ENUM (
    'SUPER_ADMINISTRADOR',
    'ADMINISTRADOR',
    'CAJERO'
);


--
-- Name: SaleAdjustmentAction; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."SaleAdjustmentAction" AS ENUM (
    'ADD',
    'REMOVE'
);


--
-- Name: SaleStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."SaleStatus" AS ENUM (
    'PENDING',
    'COMPLETED',
    'SUSPENDED',
    'CANCELLED',
    'REFUNDED'
);


--
-- Name: UnitCategory; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."UnitCategory" AS ENUM (
    'COUNT',
    'LENGTH',
    'VOLUME',
    'WEIGHT',
    'AREA'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: app_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_settings (
    id text NOT NULL,
    key text NOT NULL,
    value text DEFAULT ''::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id text NOT NULL,
    "userId" text,
    action text NOT NULL,
    module text NOT NULL,
    "entityId" text,
    "entityType" text,
    "oldData" jsonb,
    "newData" jsonb,
    "ipAddress" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: cash_movements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cash_movements (
    id text NOT NULL,
    "sessionId" text NOT NULL,
    type public."CashMovementType" NOT NULL,
    amount numeric(12,2) NOT NULL,
    description text,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: cash_registers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cash_registers (
    id text NOT NULL,
    name text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: cash_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cash_sessions (
    id text NOT NULL,
    "cashRegisterId" text NOT NULL,
    "userId" text NOT NULL,
    "openingAmount" numeric(12,2) NOT NULL,
    "closingAmount" numeric(12,2),
    "expectedAmount" numeric(12,2),
    difference numeric(12,2),
    "openedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "closedAt" timestamp(3) without time zone,
    status public."CashSessionStatus" DEFAULT 'OPEN'::public."CashSessionStatus" NOT NULL
);


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "parentId" text,
    "imageUrl" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: company_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.company_settings (
    id text NOT NULL,
    name text NOT NULL,
    nit text NOT NULL,
    address text,
    city text,
    phone text,
    email text,
    logo text,
    "taxRegime" text,
    "invoiceFooter" text
);


--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id text NOT NULL,
    "documentType" public."DocumentType" DEFAULT 'CC'::public."DocumentType" NOT NULL,
    "documentNumber" text NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    address text,
    city text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documents (
    id text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    path text NOT NULL,
    size integer NOT NULL,
    "mimeType" text NOT NULL,
    module text NOT NULL,
    "entityId" text,
    "uploadedBy" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: inventory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory (
    id text NOT NULL,
    "productId" text NOT NULL,
    quantity numeric(14,4) DEFAULT 0 NOT NULL,
    "reservedQty" numeric(14,4) DEFAULT 0 NOT NULL
);


--
-- Name: inventory_adjustments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_adjustments (
    id text NOT NULL,
    "productId" text NOT NULL,
    type text NOT NULL,
    "previousQty" numeric(14,4) NOT NULL,
    "newQty" numeric(14,4) NOT NULL,
    reason text NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: invoice_numbering; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoice_numbering (
    id text NOT NULL,
    prefix text NOT NULL,
    "resolutionNumber" text NOT NULL,
    "startNumber" integer NOT NULL,
    "endNumber" integer NOT NULL,
    "currentNumber" integer NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id text NOT NULL,
    "saleId" text NOT NULL,
    number integer NOT NULL,
    prefix text NOT NULL,
    "resolutionNumber" text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    subtotal numeric(12,2) NOT NULL,
    "taxTotal" numeric(12,2) NOT NULL,
    total numeric(12,2) NOT NULL,
    status public."InvoiceStatus" DEFAULT 'ACTIVE'::public."InvoiceStatus" NOT NULL,
    "customerName" text,
    "customerDoc" text,
    "pdfUrl" text,
    "xmlUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "electronicTrackId" text,
    cufe text,
    "qrPayload" text
);


--
-- Name: kardex_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kardex_entries (
    id text NOT NULL,
    "productId" text NOT NULL,
    type public."KardexType" NOT NULL,
    quantity numeric(14,4) NOT NULL,
    "previousStock" numeric(14,4) NOT NULL,
    "newStock" numeric(14,4) NOT NULL,
    "unitCost" numeric(12,2) NOT NULL,
    "totalCost" numeric(12,2) NOT NULL,
    "referenceType" text,
    "referenceId" text,
    notes text,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "operationalQuantity" numeric(14,4),
    "operationalUnitId" text,
    "conversionFactor" numeric(14,6)
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id text NOT NULL,
    "userId" text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type text DEFAULT 'info'::text NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    module text,
    "entityId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id text NOT NULL,
    "saleId" text NOT NULL,
    method public."PaymentMethod" NOT NULL,
    amount numeric(12,2) NOT NULL,
    reference text,
    change numeric(12,2) DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    module text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: product_alternate_units; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_alternate_units (
    id text NOT NULL,
    "productId" text NOT NULL,
    "unitOfMeasureId" text NOT NULL,
    "factorToBase" numeric(14,6) NOT NULL,
    label character varying(64),
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id text NOT NULL,
    sku text NOT NULL,
    barcode text,
    name text NOT NULL,
    description text,
    "categoryId" text,
    "costPrice" numeric(12,2) NOT NULL,
    "salePrice" numeric(12,2) NOT NULL,
    "taxRate" numeric(5,2) DEFAULT 0 NOT NULL,
    "minStock" numeric(14,4) DEFAULT 0 NOT NULL,
    "maxStock" numeric(14,4) DEFAULT 0 NOT NULL,
    "imageUrl" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "unitOfMeasureId" text NOT NULL,
    "measureDetail" character varying(255),
    "contentPerUnit" numeric(14,4),
    "contentUnitId" text
);


--
-- Name: purchase_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchase_items (
    id text NOT NULL,
    "purchaseId" text NOT NULL,
    "productId" text NOT NULL,
    quantity numeric(14,4) NOT NULL,
    "unitCost" numeric(12,2) NOT NULL,
    "taxRate" numeric(5,2) NOT NULL,
    subtotal numeric(12,2) NOT NULL,
    "baseQuantity" numeric(14,4) NOT NULL,
    "purchaseUnitId" text
);


--
-- Name: purchases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchases (
    id text NOT NULL,
    "supplierId" text NOT NULL,
    number text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    subtotal numeric(12,2) NOT NULL,
    "taxTotal" numeric(12,2) NOT NULL,
    total numeric(12,2) NOT NULL,
    status public."PurchaseStatus" DEFAULT 'DRAFT'::public."PurchaseStatus" NOT NULL,
    notes text,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    id text NOT NULL,
    "roleId" text NOT NULL,
    "permissionId" text NOT NULL,
    "assignedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id text NOT NULL,
    name public."RoleName" NOT NULL,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: sale_adjustment_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sale_adjustment_lines (
    id text NOT NULL,
    "adjustmentId" text NOT NULL,
    action public."SaleAdjustmentAction" NOT NULL,
    "productId" text NOT NULL,
    "saleItemId" text,
    quantity numeric(14,4) NOT NULL,
    "unitPrice" numeric(12,2),
    "lineSubtotal" numeric(12,2)
);


--
-- Name: sale_adjustments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sale_adjustments (
    id text NOT NULL,
    "saleId" text NOT NULL,
    "cashSessionId" text,
    reason text NOT NULL,
    "totalBefore" numeric(12,2) NOT NULL,
    "totalAfter" numeric(12,2) NOT NULL,
    "cashDelta" numeric(12,2) DEFAULT 0 NOT NULL,
    "createdById" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: sale_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sale_items (
    id text NOT NULL,
    "saleId" text NOT NULL,
    "productId" text NOT NULL,
    quantity numeric(14,4) NOT NULL,
    "unitPrice" numeric(12,2) NOT NULL,
    discount numeric(12,2) DEFAULT 0 NOT NULL,
    "taxRate" numeric(5,2) NOT NULL,
    subtotal numeric(12,2) NOT NULL,
    "saleUnitId" text,
    "baseQuantity" numeric(14,4) NOT NULL
);


--
-- Name: sales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales (
    id text NOT NULL,
    number text NOT NULL,
    "customerId" text,
    "userId" text NOT NULL,
    "cashSessionId" text,
    subtotal numeric(12,2) NOT NULL,
    "discountTotal" numeric(12,2) DEFAULT 0 NOT NULL,
    "taxTotal" numeric(12,2) NOT NULL,
    total numeric(12,2) NOT NULL,
    status public."SaleStatus" DEFAULT 'PENDING'::public."SaleStatus" NOT NULL,
    "paidAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.suppliers (
    id text NOT NULL,
    nit text NOT NULL,
    name text NOT NULL,
    "contactName" text,
    email text,
    phone text,
    address text,
    city text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_settings (
    id text NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    type text DEFAULT 'string'::text NOT NULL,
    category text DEFAULT 'general'::text NOT NULL
);


--
-- Name: units_of_measure; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.units_of_measure (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    symbol text NOT NULL,
    category public."UnitCategory" NOT NULL,
    "allowsDecimals" boolean DEFAULT false NOT NULL,
    "decimalPlaces" integer DEFAULT 0 NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_sessions (
    id text NOT NULL,
    "userId" text NOT NULL,
    "accessToken" text NOT NULL,
    "refreshToken" text,
    "ipAddress" text,
    "userAgent" text,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id text NOT NULL,
    "keycloakId" text,
    email text NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    phone text,
    avatar text,
    "roleId" text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "lastLoginAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
d91d9f4d-7ed0-4c6c-a97b-5558b078f06a	1d39cb626ef8aa48aa95f571c8e15d3b56a778320d84994adf4742d2f16f2906	2026-05-12 00:40:14.863897+00	20260512004014_	\N	\N	2026-05-12 00:40:14.504472+00	1
396f90d1-c901-4581-b6a2-6bf926561b76	04e51be9e33a58a5ae49c28939465921c401f174af7e6e5f12713f4006211ef1	2026-05-12 05:33:22.109543+00	20260512120000_add_app_settings	\N	\N	2026-05-12 05:33:22.006304+00	1
b55be9eb-9022-4530-89ab-5e37e742e3d1	e12e89252bc3928b601c5c9ffdde9886c630edf8723a4736252e667c22bf0ca4	2026-05-13 14:19:06.728118+00	20260513120000_invoice_electronic_fields	\N	\N	2026-05-13 14:19:06.702987+00	1
3e33f5bf-b81b-4f1f-a5f9-0f3d879c3423	9617fe06ab94d63b7536f6266f9517aa5ebb58b2aa0dc78ec7c8720e5941b53c	2026-05-18 19:35:17.33163+00	20260518120000_sale_adjustments	\N	\N	2026-05-18 19:35:17.320959+00	1
30174414-710f-4af2-9a8b-d816bdb48d5f	c395c31e96e0a4360148148c8a938158c6177722b26a6cacdd07fd0cc589940b	2026-05-18 20:26:38.050265+00	20260518160000_invoice_active_adjusted	\N	\N	2026-05-18 20:26:38.046005+00	1
c4a7fd8e-b069-4260-a472-ee27518d89b5	8a34c7cbc64db8b5faf03d296002814f01453bf236b756de44a58ab86fb3bdff	2026-05-18 22:02:40.035962+00	20260519120000_units_of_measure	\N	\N	2026-05-18 22:02:39.996954+00	1
b75d0b95-0d89-48a1-b8ff-2a942bf41e7f	358b286f0f80c6af918382ed21aa9e4030665e6972d34afdd298c13944b8411c	2026-05-18 22:11:42.013816+00	20260518221500_product_measure_detail	\N	\N	2026-05-18 22:11:42.003897+00	1
eb6dbc25-f905-4d42-9950-d5caac32b8d9	30ea029178c28764944df84e9475bb31e637295ab75931a4209e7a75b112fea8	2026-05-18 22:29:58.537799+00	20260518230000_product_dual_unit	\N	\N	2026-05-18 22:29:58.527365+00	1
af2682fd-0c3e-4a6d-920a-29e56948600a	e54a6a1de99761012065b19c488a3da4fa861a7f7b658cf76a4dc40183e22dc4	2026-05-21 00:18:19.368554+00	20260520120000_product_alternate_units_kardex	\N	\N	2026-05-21 00:18:19.346018+00	1
ce7a10c5-73e3-4cd5-b4f3-369dc591e650	1b65e86838736bc3b8a66b5a736062fc3903c622c11f9107321c67a19b0dad11	2026-05-21 01:23:51.891443+00	20260521130000_rename_fe_prefix_to_tkt	\N	\N	2026-05-21 01:23:51.886298+00	1
\.


--
-- Data for Name: app_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.app_settings (id, key, value, "createdAt", "updatedAt") FROM stdin;
0c53b934-08c2-4e70-829f-daeeb5b0ca58	company.name	TIENDAPOPACO	2026-05-12 05:33:40.959	2026-05-12 05:34:44.424
8cde8248-30d8-40b6-8a96-444f4ffa9d64	company.tax_id	10242345345	2026-05-12 05:33:40.962	2026-05-12 05:34:44.426
29411f83-2dc8-410c-b8a9-e65ef93fe69b	company.address	CRA 29 # 8 37	2026-05-12 05:33:40.964	2026-05-12 05:34:44.428
9efd4941-4c50-4c76-98c5-8af81714aeb5	company.phone	3214323423	2026-05-12 05:33:40.965	2026-05-12 05:34:44.429
476a1684-e192-41de-9e72-4cc10249c28b	company.email	estivenmendezr@gmail.com	2026-05-12 05:33:40.966	2026-05-12 05:34:44.43
a1e1e0e9-7919-426d-9b2d-c77abc471fa0	invoice.footer_note	Gracias por su compra.	2026-05-12 05:33:40.967	2026-05-12 05:34:44.432
3d230160-1bc4-4f78-8115-fbfd637c0693	pos.receipt_header	dfsdfsd	2026-05-12 05:33:40.968	2026-05-12 05:34:44.433
a1b2c3d4-e5f6-7890-abcd-ef1234567890	invoice.email	{"enabled":false,"smtpHost":"smtp.gmail.com","smtpPort":587,"smtpSecure":false,"smtpUser":"estivenmendezr@gmail.com","fromName":"Inventario","fromEmail":"estivenmendezr@gmail.com","defaultSubject":"Factura {{fullNumber}}","defaultBody":"Hola","attachPdf":true,"attachXml":true,"replyTo":""}	2026-05-18 16:40:30.682	2026-05-18 16:44:58.379
b2c3d4e5-f6a7-8901-bcde-f12345678901	invoice.email.smtp_password	ihsu wfho obik zcch	2026-05-18 16:40:30.748	2026-05-18 16:44:58.38
abb4c875-a6ce-4ae1-9d17-d0d7846d77c2	company.logo	{"filename":"company-logo.jpg","mimeType":"image/jpeg","updatedAt":"2026-05-18T21:07:07.512Z"}	2026-05-18 21:07:07.512	2026-05-18 21:07:07.512
80a4bbbc-e0cc-4bd0-b5c1-13bbe11c43d6	invoice.template	{"pageSize":"58mm","orientation":"portrait","marginTopMm":5,"marginRightMm":5,"marginBottomMm":5,"marginLeftMm":5,"fontSizeTitle":10,"fontSizeBody":10,"fontSizeItems":9,"fontSizeFooter":7.5,"headerBackgroundColor":"#f0f0f2","accentColor":"#994400","textColor":"#111111","showLogo":true,"showItemSku":true,"showSubtotal":true,"showTax":true,"footerText":"Gracias por su compra.","appendFooterNote":true,"showSimplifiedRegimeLine":true,"previewBeforePrint":true,"printerHint":"","openCashDrawer":false}	2026-05-18 23:01:38.542	2026-05-21 01:55:54.249
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, "userId", action, module, "entityId", "entityType", "oldData", "newData", "ipAddress", "createdAt") FROM stdin;
b5d6916e-7787-48c7-99bb-b14432f8dfe2	086c7a33-2f97-46ec-bed3-0ee95ee7a609	inventory.adjust	inventory	a5d45022-eafa-4fd9-a4bc-91459d501081	Product	{"previousQty": 12}	{"newQty": 5, "reason": "sss"}	10.89.0.115	2026-05-18 18:41:55.637
deb532ee-2a69-4bea-b3c0-fed449c2b17a	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sale.adjust	sales	f2e13e6b-7f64-4730-bcd4-ac55f5076c2f	Sale	{"items": [{"id": "e66c8254-e03b-4690-bd2c-a9564510bd1d", "quantity": 1, "productId": "2eab3442-7728-4655-b910-9c052e9fea2d"}], "total": "700000"}	{"total": "400000", "reason": "sasdasdas", "changes": [{"action": "ADD", "quantity": 1, "productId": "2eab3442-7728-4655-b910-9c052e9fea2d", "unitPrice": 200000}], "adjustmentId": "e5898d95-c40f-4b44-ad5b-78d21eb92777"}	10.89.0.115	2026-05-18 19:47:46.841
f1abb026-3d2f-4fa2-a985-0bfb6d69c0ae	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sale.adjust	sales	f2e13e6b-7f64-4730-bcd4-ac55f5076c2f	Sale	{"items": [{"id": "3aed08b3-438c-4dbd-bfa0-c39473145c00", "quantity": 2, "productId": "2eab3442-7728-4655-b910-9c052e9fea2d"}], "total": "400000"}	{"total": "2100000", "reason": "sasdasdas", "changes": [{"action": "ADD", "quantity": 1, "productId": "2eab3442-7728-4655-b910-9c052e9fea2d", "unitPrice": 700000}], "adjustmentId": "d344510b-e52b-4cf0-bd9a-1d68244d6891"}	10.89.0.115	2026-05-18 19:55:54.366
e48ca142-687c-420c-bf58-eab2d1581db0	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sale.adjust	sales	f2e13e6b-7f64-4730-bcd4-ac55f5076c2f	Sale	{"items": [{"id": "94b5c002-9082-4c19-8380-eab11613986b", "quantity": 3, "productId": "2eab3442-7728-4655-b910-9c052e9fea2d"}], "total": "2100000"}	{"total": "1400000", "reason": "sadasdasd", "changes": [{"action": "REMOVE", "quantity": 1, "productId": "2eab3442-7728-4655-b910-9c052e9fea2d", "saleItemId": "94b5c002-9082-4c19-8380-eab11613986b"}], "adjustmentId": "c3c86981-181d-49b7-946c-8fc5ebbd32af"}	10.89.0.115	2026-05-18 20:04:19.773
207e76ea-88bc-4251-a6df-11194ee8ae89	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sale.adjust	sales	0a631f29-6a76-49d4-a117-7fdb5934194a	Sale	{"items": [{"id": "78f8a689-e76b-4087-b570-ed397a802524", "quantity": 1, "productId": "2eab3442-7728-4655-b910-9c052e9fea2d"}, {"id": "9ac34ab8-a984-4cff-837a-bee6e7a0d037", "quantity": 1, "productId": "cd3f9e15-b894-430c-8bc2-afaccc3f6f8f"}], "total": "695000"}	{"total": "2815000", "reason": "xxxxxx", "changes": [{"action": "ADD", "quantity": 3, "productId": "2eab3442-7728-4655-b910-9c052e9fea2d", "unitPrice": 700000}], "adjustmentId": "a38c6392-2c63-4159-a2d0-a0db5736d47f"}	10.89.0.115	2026-05-18 20:04:46.883
a81fcca5-1cd9-46dd-bb7d-9c4cf425383e	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sale.adjust	sales	0a631f29-6a76-49d4-a117-7fdb5934194a	Sale	{"items": [{"id": "156c8743-9ef3-47ca-9693-e395207e8c3d", "quantity": 1, "productId": "cd3f9e15-b894-430c-8bc2-afaccc3f6f8f"}, {"id": "a592729e-ffe9-4a12-87a1-cc41581da75b", "quantity": 4, "productId": "2eab3442-7728-4655-b910-9c052e9fea2d"}], "total": "2815000"}	{"total": "2830000", "reason": "sdsad", "changes": [{"action": "ADD", "quantity": 1, "productId": "cd3f9e15-b894-430c-8bc2-afaccc3f6f8f", "unitPrice": 15000}], "adjustmentId": "e03fb1b0-0311-4210-8de0-4c08418c5926"}	10.89.0.115	2026-05-18 20:05:16.978
caa96d40-60c7-4a08-bdcf-7a5987681eb0	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sale.adjust	sales	0a631f29-6a76-49d4-a117-7fdb5934194a	Sale	{"items": [{"id": "2f331e2f-b0d9-4d17-bb45-8043b7128087", "quantity": 4, "productId": "2eab3442-7728-4655-b910-9c052e9fea2d"}, {"id": "7329b64f-fae2-4e05-8a50-561c22722502", "quantity": 2, "productId": "cd3f9e15-b894-430c-8bc2-afaccc3f6f8f"}], "total": "2830000"}	{"total": "30000", "reason": "sdfdsgsdfg", "changes": [{"action": "REMOVE", "quantity": 4, "productId": "2eab3442-7728-4655-b910-9c052e9fea2d", "saleItemId": "2f331e2f-b0d9-4d17-bb45-8043b7128087"}], "adjustmentId": "8adb68bf-9ecb-4c18-800a-67eb237c55f5"}	10.89.0.115	2026-05-18 20:05:42.828
b4db1a47-052d-463a-8605-1af5ad9b0e3c	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sale.adjust	sales	f2e13e6b-7f64-4730-bcd4-ac55f5076c2f	Sale	{"items": [{"id": "721bd41c-b6e9-4c2e-aa82-df128ba0d357", "quantity": 2, "productId": "2eab3442-7728-4655-b910-9c052e9fea2d"}], "total": "1400000"}	{"total": "700000", "reason": "error", "changes": [{"action": "REMOVE", "quantity": 1, "productId": "2eab3442-7728-4655-b910-9c052e9fea2d", "saleItemId": "721bd41c-b6e9-4c2e-aa82-df128ba0d357"}], "adjustmentId": "a073c13e-6dc5-4ecc-9107-61d693ff5ee7"}	10.89.0.115	2026-05-18 20:14:51.55
9cbb658a-93d7-4aeb-8206-8903c082d896	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sale.adjust	sales	f2e13e6b-7f64-4730-bcd4-ac55f5076c2f	Sale	{"items": [{"id": "39f9eaa1-b720-4bb4-9126-c58d28e2ca63", "quantity": 1, "productId": "2eab3442-7728-4655-b910-9c052e9fea2d"}], "total": "700000"}	{"total": "1400000", "reason": "saa", "changes": [{"action": "ADD", "quantity": 1, "productId": "2eab3442-7728-4655-b910-9c052e9fea2d", "unitPrice": 700000}], "adjustmentId": "7adc26ce-4e6b-42cf-a244-9f99ce0369a7"}	10.89.0.115	2026-05-18 20:15:36.952
1f738071-6004-4672-92a2-b09512dcf576	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sale.adjust	sales	f2e13e6b-7f64-4730-bcd4-ac55f5076c2f	Sale	{"items": [{"id": "fc87ced2-3658-418e-bc82-d172b06bb682", "quantity": 2, "productId": "2eab3442-7728-4655-b910-9c052e9fea2d"}], "total": "1400000"}	{"total": "1415000", "reason": "asdasdas", "changes": [{"action": "ADD", "quantity": 1, "productId": "cd3f9e15-b894-430c-8bc2-afaccc3f6f8f", "unitPrice": 15000}], "adjustmentId": "f91857a7-828e-4dd0-88e6-74dd02d2dadf"}	10.89.0.115	2026-05-18 20:19:54.063
985e1df8-ab93-4b4d-8538-8e3c6f5dd9c6	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sale.adjust	sales	f2e13e6b-7f64-4730-bcd4-ac55f5076c2f	Sale	{"items": [{"id": "556a86d0-aca8-4c82-9503-a79b8393c993", "quantity": 2, "productId": "2eab3442-7728-4655-b910-9c052e9fea2d"}, {"id": "e12ea14d-b31e-4516-be12-dc6e4c7782df", "quantity": 1, "productId": "cd3f9e15-b894-430c-8bc2-afaccc3f6f8f"}], "total": "1415000"}	{"total": "715000", "reason": "asdas", "changes": [{"action": "REMOVE", "quantity": 1, "productId": "2eab3442-7728-4655-b910-9c052e9fea2d", "saleItemId": "556a86d0-aca8-4c82-9503-a79b8393c993"}], "adjustmentId": "1557561a-eafb-4b9f-b01b-cc0f9fd65fcf"}	10.89.0.115	2026-05-18 20:20:41.156
cc9a5429-38c5-4149-baa6-1733d4d67f88	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sale.adjust	sales	f2e13e6b-7f64-4730-bcd4-ac55f5076c2f	Sale	{"items": [{"id": "0d133f01-0790-4a93-816d-e55f22f97b42", "quantity": 1, "productId": "2eab3442-7728-4655-b910-9c052e9fea2d"}, {"id": "8f143840-b655-4748-8d5c-c8d15857f072", "quantity": 1, "productId": "cd3f9e15-b894-430c-8bc2-afaccc3f6f8f"}], "total": "715000"}	{"total": "15000", "reason": "error", "changes": [{"action": "REMOVE", "quantity": 1, "productId": "2eab3442-7728-4655-b910-9c052e9fea2d", "saleItemId": "0d133f01-0790-4a93-816d-e55f22f97b42"}], "adjustmentId": "ee464824-13c4-452b-9a55-1775b755b7c4"}	10.89.0.115	2026-05-18 20:27:31.736
8522935f-bb8f-458b-9c86-88361d8c0e21	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sale.adjust	sales	0a631f29-6a76-49d4-a117-7fdb5934194a	Sale	{"items": [{"id": "34bd4002-9603-4add-a48a-3641ba7ceb3f", "quantity": 2, "productId": "cd3f9e15-b894-430c-8bc2-afaccc3f6f8f"}], "total": "30000"}	{"total": "15000", "reason": "aaaa", "changes": [{"action": "REMOVE", "quantity": 1, "productId": "cd3f9e15-b894-430c-8bc2-afaccc3f6f8f", "saleItemId": "34bd4002-9603-4add-a48a-3641ba7ceb3f"}], "adjustmentId": "eed30ea0-7720-4084-9427-c5acabc08ce9"}	10.89.0.115	2026-05-18 20:28:59.76
2dd2f320-ff77-4e73-ac91-854655ddd7fe	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sale.adjust	sales	0a631f29-6a76-49d4-a117-7fdb5934194a	Sale	{"items": [{"id": "158b127b-5afb-47e6-9d0c-091cd20ff529", "quantity": 1, "productId": "cd3f9e15-b894-430c-8bc2-afaccc3f6f8f"}], "total": "15000"}	{"total": "715000", "reason": "aaa", "changes": [{"action": "ADD", "quantity": 1, "productId": "2eab3442-7728-4655-b910-9c052e9fea2d", "unitPrice": 700000}], "adjustmentId": "aa992b15-5197-4d28-86b9-ad03a3024179"}	10.89.0.115	2026-05-18 20:30:40.423
f3d00536-d13d-46d6-bfca-b89182a9f6c2	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sale.adjust	sales	f2e13e6b-7f64-4730-bcd4-ac55f5076c2f	Sale	{"items": [{"id": "b23b5cc4-651c-412b-9080-838b5f81a8e6", "quantity": 1, "productId": "cd3f9e15-b894-430c-8bc2-afaccc3f6f8f"}], "total": "15000"}	{"total": "715000", "reason": "lllll", "changes": [{"action": "ADD", "quantity": 1, "productId": "2eab3442-7728-4655-b910-9c052e9fea2d", "unitPrice": 700000}], "adjustmentId": "648eb6b2-d99b-4f57-9b1a-e0ff081fc110"}	10.89.0.115	2026-05-18 20:35:50.538
ac27e7f6-7d7c-4a36-a45d-22a0eaa561db	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sale.adjust	sales	f2e13e6b-7f64-4730-bcd4-ac55f5076c2f	Sale	{"items": [{"id": "49f07d0c-d451-4c22-b9a7-13db91da54ed", "quantity": 1, "productId": "2eab3442-7728-4655-b910-9c052e9fea2d"}, {"id": "e077d1a6-6185-472b-a9a3-709befa4e6d6", "quantity": 1, "productId": "cd3f9e15-b894-430c-8bc2-afaccc3f6f8f"}], "total": "715000"}	{"total": "1415000", "reason": "jjjjjj", "changes": [{"action": "ADD", "quantity": 1, "productId": "2eab3442-7728-4655-b910-9c052e9fea2d", "unitPrice": 700000}], "adjustmentId": "5daa3219-b912-44bb-b880-1e3f00ff093e"}	10.89.0.115	2026-05-18 20:36:14.056
0b8e3080-1ae5-4ff3-bda3-e46fbefeacd6	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sale.adjust	sales	f2e13e6b-7f64-4730-bcd4-ac55f5076c2f	Sale	{"items": [{"id": "09da9a79-f5d5-4b00-8261-600b1cb4a4f1", "quantity": 2, "productId": "2eab3442-7728-4655-b910-9c052e9fea2d"}, {"id": "79783709-d18b-46fb-a50a-69053b907fc9", "quantity": 1, "productId": "cd3f9e15-b894-430c-8bc2-afaccc3f6f8f"}], "total": "1415000"}	{"total": "2115000", "reason": "ssss", "changes": [{"action": "ADD", "quantity": 1, "productId": "2eab3442-7728-4655-b910-9c052e9fea2d", "unitPrice": 700000}], "adjustmentId": "1e5e9f22-6656-4c1d-b2d8-0216b93ffb61"}	10.89.0.115	2026-05-18 20:36:38.616
9936d6b1-4ebd-47ef-8403-37806d96dff9	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sale.adjust	sales	f2e13e6b-7f64-4730-bcd4-ac55f5076c2f	Sale	{"items": [{"id": "15901e4a-6c8f-4a1a-adcc-2afe6e95c9ba", "quantity": 3, "productId": "2eab3442-7728-4655-b910-9c052e9fea2d"}, {"id": "5bad8ef7-8075-4838-861a-b0e683f0d70b", "quantity": 1, "productId": "cd3f9e15-b894-430c-8bc2-afaccc3f6f8f"}], "total": "2115000"}	{"total": "1415000", "reason": "ssss", "changes": [{"action": "REMOVE", "quantity": 1, "productId": "2eab3442-7728-4655-b910-9c052e9fea2d", "saleItemId": "15901e4a-6c8f-4a1a-adcc-2afe6e95c9ba"}], "adjustmentId": "fc303374-553e-4877-ac0a-4dbe864485ca"}	10.89.0.115	2026-05-18 20:38:19.457
d77fccd9-aabe-4990-9665-781894d450d2	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sale.adjust	sales	f2e13e6b-7f64-4730-bcd4-ac55f5076c2f	Sale	{"items": [{"id": "3df40b98-2176-4be7-9eda-a0dc134a81ee", "quantity": 2, "productId": "2eab3442-7728-4655-b910-9c052e9fea2d"}, {"id": "9c39911d-c7d0-4f37-bf4e-31c03841c509", "quantity": 1, "productId": "cd3f9e15-b894-430c-8bc2-afaccc3f6f8f"}], "total": "1415000"}	{"total": "715000", "reason": "ssss", "changes": [{"action": "REMOVE", "quantity": 1, "productId": "2eab3442-7728-4655-b910-9c052e9fea2d", "saleItemId": "3df40b98-2176-4be7-9eda-a0dc134a81ee"}], "adjustmentId": "bcf21482-51a0-43be-9a4c-bf48df76c84a"}	10.89.0.115	2026-05-18 20:40:01.362
acea547f-cb20-408f-b18f-5905953c6380	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sale.adjust	sales	f2e13e6b-7f64-4730-bcd4-ac55f5076c2f	Sale	{"items": [{"id": "027ceb36-4dcb-420a-8557-24590aaefeb8", "quantity": 1, "productId": "cd3f9e15-b894-430c-8bc2-afaccc3f6f8f"}, {"id": "564b9a55-5349-48a5-834e-524fbf60a97a", "quantity": 1, "productId": "2eab3442-7728-4655-b910-9c052e9fea2d"}], "total": "715000"}	{"total": "15000", "reason": "ssss", "changes": [{"action": "REMOVE", "quantity": 1, "productId": "2eab3442-7728-4655-b910-9c052e9fea2d", "saleItemId": "564b9a55-5349-48a5-834e-524fbf60a97a"}], "adjustmentId": "922964d1-bcab-4fcd-929d-f01409fae34d"}	10.89.0.115	2026-05-18 20:40:36.608
d9ab13ec-cd58-4c3e-aa74-f8bf6c2558ad	086c7a33-2f97-46ec-bed3-0ee95ee7a609	user.update	users	7d522b83-f005-46be-a3e8-df1f3a51ea50	User	{"phone": "3214213423", "roleId": "7b2f97e5-a88f-446a-8d20-69ad72235192", "isActive": true, "lastName": "cajero", "roleName": "CAJERO", "firstName": "cajero"}	{"phone": "3214213423", "roleId": "7b2f97e5-a88f-446a-8d20-69ad72235192", "isActive": true, "lastName": "cajero", "roleName": "CAJERO", "firstName": "cajero", "passwordChanged": true}	10.89.0.115	2026-05-18 20:50:17.347
4ac8e3f3-2bed-4cce-9e0c-c7b760425670	086c7a33-2f97-46ec-bed3-0ee95ee7a609	user.create	users	8f8c12c0-5df8-4b39-9b4d-6fde7d23f6cc	User	\N	{"email": "administrador@gmail.com", "roleId": "4af902e0-a9a1-4edb-a2bf-cd2295ab3ecc", "roleName": "ADMINISTRADOR"}	10.89.0.115	2026-05-18 20:58:10.048
cfa0b644-16e6-4b39-921c-57d85223a34f	086c7a33-2f97-46ec-bed3-0ee95ee7a609	user.update	users	7d522b83-f005-46be-a3e8-df1f3a51ea50	User	{"phone": "3214213423", "roleId": "7b2f97e5-a88f-446a-8d20-69ad72235192", "isActive": true, "lastName": "cajero", "roleName": "CAJERO", "firstName": "cajero"}	{"phone": "3214213423", "roleId": "7b2f97e5-a88f-446a-8d20-69ad72235192", "isActive": false, "lastName": "cajero", "roleName": "CAJERO", "firstName": "cajero", "passwordChanged": false}	10.89.0.115	2026-05-18 21:39:08.598
0495285a-c4ac-49ec-8515-f5152b3342cc	086c7a33-2f97-46ec-bed3-0ee95ee7a609	user.update	users	7d522b83-f005-46be-a3e8-df1f3a51ea50	User	{"phone": "3214213423", "roleId": "7b2f97e5-a88f-446a-8d20-69ad72235192", "isActive": false, "lastName": "cajero", "roleName": "CAJERO", "firstName": "cajero"}	{"phone": "3214213423", "roleId": "7b2f97e5-a88f-446a-8d20-69ad72235192", "isActive": true, "lastName": "cajero", "roleName": "CAJERO", "firstName": "cajero", "passwordChanged": false}	10.89.0.115	2026-05-18 21:39:25.405
69733583-e8c1-44df-b760-44f6da1e03f6	086c7a33-2f97-46ec-bed3-0ee95ee7a609	product.create	products	23142c19-f1e7-43d0-b86e-ed6e3c19a520	Product	\N	{"sku": "2143234", "name": "tubo PVC", "barcode": "3453452", "taxRate": "0", "isActive": true, "maxStock": "30", "minStock": "12", "stockQty": "0", "unitCode": "M", "unitName": "Metro", "costPrice": "2000", "productId": "23142c19-f1e7-43d0-b86e-ed6e3c19a520", "salePrice": "3000", "categoryId": "0d56fc57-cadb-40fe-af2c-f938a792d95a", "unitSymbol": "m", "description": null, "reservedQty": "0", "categoryName": "JBL", "unitOfMeasureId": "uom-m"}	10.89.0.115	2026-05-18 22:08:28.618
aef95f04-559f-48eb-860c-07387ac525d8	086c7a33-2f97-46ec-bed3-0ee95ee7a609	inventory.adjust	inventory	23142c19-f1e7-43d0-b86e-ed6e3c19a520	Product	{"sku": "2143234", "unitCost": "2000", "productId": "23142c19-f1e7-43d0-b86e-ed6e3c19a520", "previousQty": 0, "productName": "tubo PVC", "reservedQty": 0}	{"sku": "2143234", "delta": 30, "newQty": 30, "reason": "ingreso", "productId": "23142c19-f1e7-43d0-b86e-ed6e3c19a520", "productName": "tubo PVC"}	10.89.0.115	2026-05-18 22:13:20.225
af33b74d-c41a-40f8-9130-549ba6b79dc5	086c7a33-2f97-46ec-bed3-0ee95ee7a609	inventory.adjust	inventory	2eab3442-7728-4655-b910-9c052e9fea2d	Product	{"sku": "2332345", "unitCost": "600000", "productId": "2eab3442-7728-4655-b910-9c052e9fea2d", "previousQty": 33, "productName": "Xtream 5", "reservedQty": 2}	{"sku": "2332345", "delta": -31, "newQty": 2, "reason": "sss", "productId": "2eab3442-7728-4655-b910-9c052e9fea2d", "productName": "Xtream 5"}	10.89.0.115	2026-05-18 22:14:45.71
15b20a6a-fb81-4124-a435-02b218982874	086c7a33-2f97-46ec-bed3-0ee95ee7a609	inventory.adjust	inventory	2eab3442-7728-4655-b910-9c052e9fea2d	Product	{"sku": "2332345", "unitCost": "600000", "productId": "2eab3442-7728-4655-b910-9c052e9fea2d", "previousQty": 2, "productName": "Xtream 5", "reservedQty": 2}	{"sku": "2332345", "delta": 38, "newQty": 40, "reason": "ssss", "productId": "2eab3442-7728-4655-b910-9c052e9fea2d", "productName": "Xtream 5"}	10.89.0.115	2026-05-18 22:14:56.688
5a2a6860-ad6b-4a49-9eb9-e3cb2e0a7468	086c7a33-2f97-46ec-bed3-0ee95ee7a609	product.create	products	d3209abe-585d-4e85-ab26-8ed421df3fb9	Product	\N	{"sku": "243543563455", "name": "clavos", "barcode": "2345235423", "taxRate": "0", "isActive": true, "maxStock": "30", "minStock": "2", "stockQty": "0", "unitCode": "CM", "unitName": "Centímetro", "costPrice": "2000", "productId": "d3209abe-585d-4e85-ab26-8ed421df3fb9", "salePrice": "5000", "categoryId": "1e19bba2-82d6-44f0-88ae-ee49aa472c3c", "unitSymbol": "cm", "description": null, "reservedQty": "0", "categoryName": "General", "measureDetail": "5", "unitOfMeasureId": "uom-cm"}	10.89.0.115	2026-05-18 22:16:20.353
9d5b4589-07f3-40a9-9a61-6a95e6888d75	086c7a33-2f97-46ec-bed3-0ee95ee7a609	cash_register.session_open	cash_register	291208ee-f786-4555-a600-e3995f271b24	CashSession	\N	{"status": "OPEN", "openingAmount": "100000.00", "cashRegisterId": "3739f411-b076-4139-9fec-9a6b02fd21a2", "cashRegisterName": "Caja Principal"}	\N	2026-05-18 22:16:56.087
203f84e8-8a74-4d35-8368-78b92c9cb8e6	086c7a33-2f97-46ec-bed3-0ee95ee7a609	inventory.adjust	inventory	d3209abe-585d-4e85-ab26-8ed421df3fb9	Product	{"sku": "243543563455", "unitCost": "2000", "productId": "d3209abe-585d-4e85-ab26-8ed421df3fb9", "previousQty": 0, "productName": "clavos", "reservedQty": 0}	{"sku": "243543563455", "delta": 20, "newQty": 20, "reason": "sss", "productId": "d3209abe-585d-4e85-ab26-8ed421df3fb9", "productName": "clavos"}	10.89.0.115	2026-05-18 22:18:09.058
373c2885-6caf-4e84-b5f2-e616437a7b33	086c7a33-2f97-46ec-bed3-0ee95ee7a609	invoice.create	invoices	153038e2-546b-44dc-a213-a52a4852f7b9	Invoice	\N	{"total": "50000", "saleId": "eec0b8f5-f103-4e7b-8439-1d0835ef299b", "status": "ACTIVE", "subtotal": "50000", "taxTotal": "0", "invoiceId": "153038e2-546b-44dc-a213-a52a4852f7b9", "fullNumber": "FE-23", "saleNumber": "V-MPBRMUFI-KJ3CVB", "customerDoc": null, "customerName": "Consumidor final", "numberingApplied": 23}	\N	2026-05-18 22:18:32.078
a97ec42b-32b8-4be0-b89c-84e0c5cb8708	086c7a33-2f97-46ec-bed3-0ee95ee7a609	product.create	products	a645f50f-3fdc-40ff-8427-7b403934b700	Product	\N	{"sku": "1232143234", "name": "tubo PVC", "barcode": "345463456", "taxRate": "0", "isActive": true, "maxStock": "10", "minStock": "2", "stockQty": "0", "unitCode": "CM", "unitName": "Centímetro", "costPrice": "30000", "productId": "a645f50f-3fdc-40ff-8427-7b403934b700", "salePrice": "50000", "categoryId": "0d56fc57-cadb-40fe-af2c-f938a792d95a", "unitSymbol": "cm", "description": null, "reservedQty": "0", "categoryName": "JBL", "measureDetail": "10", "unitOfMeasureId": "uom-cm"}	10.89.0.115	2026-05-18 22:32:37.436
a68af95d-63cd-4b6b-92ec-ff4904b70994	086c7a33-2f97-46ec-bed3-0ee95ee7a609	inventory.adjust	inventory	a645f50f-3fdc-40ff-8427-7b403934b700	Product	{"sku": "1232143234", "unitCost": "30000", "productId": "a645f50f-3fdc-40ff-8427-7b403934b700", "previousQty": 0, "productName": "tubo PVC", "reservedQty": 0}	{"sku": "1232143234", "delta": 40, "newQty": 40, "reason": "ingreso", "productId": "a645f50f-3fdc-40ff-8427-7b403934b700", "productName": "tubo PVC"}	10.89.0.115	2026-05-18 22:32:54.963
938818bc-de82-4a10-b58f-777efdfe3b7a	086c7a33-2f97-46ec-bed3-0ee95ee7a609	invoice.create	invoices	d1873e0e-bbe2-4be2-86ee-a1148b1fea8f	Invoice	\N	{"total": "50000", "saleId": "e0bd691d-d874-427f-8df9-ed638ebacaa9", "status": "ACTIVE", "subtotal": "50000", "taxTotal": "0", "invoiceId": "d1873e0e-bbe2-4be2-86ee-a1148b1fea8f", "fullNumber": "FE-24", "saleNumber": "V-MPBS6OWZ-CAS24W", "customerDoc": "CC 1073478374", "customerName": "estiven", "numberingApplied": 24}	\N	2026-05-18 22:33:58.034
5d0f523f-676e-4a54-a017-8b57f4c4d0ac	8f8c12c0-5df8-4b39-9b4d-6fde7d23f6cc	product.create	products	a15a6f9a-8168-4526-a213-e5a7f480f057	Product	\N	{"sku": "38483443", "name": "LIJA", "barcode": "234992342", "taxRate": "0", "isActive": true, "maxStock": "999", "minStock": "2", "stockQty": "0", "unitCode": "UN", "unitName": "Unidad / pieza", "costPrice": "500", "productId": "a15a6f9a-8168-4526-a213-e5a7f480f057", "salePrice": "1000", "categoryId": "1e19bba2-82d6-44f0-88ae-ee49aa472c3c", "unitSymbol": "und", "description": null, "reservedQty": "0", "categoryName": "General", "measureDetail": null, "unitOfMeasureId": "uom-un"}	10.89.0.115	2026-05-18 22:56:39.259
f721ec88-827f-4b34-b941-2afefdf01275	8f8c12c0-5df8-4b39-9b4d-6fde7d23f6cc	inventory.adjust	inventory	a15a6f9a-8168-4526-a213-e5a7f480f057	Product	{"sku": "38483443", "unitCost": "500", "productId": "a15a6f9a-8168-4526-a213-e5a7f480f057", "previousQty": 0, "productName": "LIJA", "reservedQty": 0}	{"sku": "38483443", "delta": 100, "newQty": 100, "reason": "agregar", "productId": "a15a6f9a-8168-4526-a213-e5a7f480f057", "productName": "LIJA"}	10.89.0.115	2026-05-18 22:57:17.889
5918d00e-4f96-4414-aa7e-187430cdf0c2	8f8c12c0-5df8-4b39-9b4d-6fde7d23f6cc	category.create	categories	80cd5179-8201-451f-98af-b51b8ac88ceb	Category	\N	{"name": "LIJAS", "isActive": true, "parentId": null, "categoryId": "80cd5179-8201-451f-98af-b51b8ac88ceb", "parentName": null, "description": null}	10.89.0.115	2026-05-18 22:58:02.532
41f695fc-a510-497c-a702-06bbc1ed7280	086c7a33-2f97-46ec-bed3-0ee95ee7a609	invoice.create	invoices	ab87b759-1083-40c2-a665-44378c3f8149	Invoice	\N	{"total": "10000", "saleId": "8918c87e-4c92-4f25-a7db-f029440541c0", "status": "ACTIVE", "subtotal": "10000", "taxTotal": "0", "invoiceId": "ab87b759-1083-40c2-a665-44378c3f8149", "fullNumber": "FE-25", "saleNumber": "V-MPBT4DT9-07I4NJ", "customerDoc": null, "customerName": "Consumidor final", "numberingApplied": 25}	\N	2026-05-18 23:00:09.948
d62e29c3-e036-428a-8599-e529ce4bb26a	086c7a33-2f97-46ec-bed3-0ee95ee7a609	invoice.cancel	invoices	153038e2-546b-44dc-a213-a52a4852f7b9	Invoice	{"cufe": "4AE021EB73D510A36C3A477C462D0444FF85CC5099F1FF4ED2B2357372E6A1808E981517FCC7E4EB3DADD83408C4A430", "total": "50000", "saleId": "eec0b8f5-f103-4e7b-8439-1d0835ef299b", "status": "ACTIVE", "subtotal": "50000", "taxTotal": "0", "invoiceId": "153038e2-546b-44dc-a213-a52a4852f7b9", "fullNumber": "FE-23", "saleNumber": "V-MPBRMUFI-KJ3CVB", "customerDoc": null, "customerName": "Consumidor final", "electronicTrackId": "LOCAL-FE-23-1779142711982"}	{"status": "CANCELLED"}	10.89.0.115	2026-05-18 23:08:44.757
37634944-f936-4835-b1e7-c47a7733b36a	086c7a33-2f97-46ec-bed3-0ee95ee7a609	inventory.adjust	inventory	23142c19-f1e7-43d0-b86e-ed6e3c19a520	Product	{"sku": "2143234", "unitCost": "2000", "productId": "23142c19-f1e7-43d0-b86e-ed6e3c19a520", "previousQty": 30, "productName": "tubo PVC", "reservedQty": 1}	{"sku": "2143234", "delta": -25, "newQty": 5, "reason": "Test notificaciones", "productId": "23142c19-f1e7-43d0-b86e-ed6e3c19a520", "productName": "tubo PVC"}	10.89.0.13	2026-05-21 02:05:01.185
\.


--
-- Data for Name: cash_movements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cash_movements (id, "sessionId", type, amount, description, "userId", "createdAt") FROM stdin;
10506096-3797-4c06-9312-83dc5e2c8842	aa241538-4fb8-4ea8-b0b6-7f1ff1308570	INCOME	1000.00	xsx	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-12 04:42:15.051
4a3fe29c-b0c7-4401-a128-c680ceb10b73	aa241538-4fb8-4ea8-b0b6-7f1ff1308570	EXPENSE	111.00	wdw	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-12 04:42:21.091
c482e66e-82b4-47e6-b400-55f7d6518a1a	6a55dc16-988a-47d9-865e-3f01ff9ddcfb	SALE	700000.00	Venta V-MPBKSYAL-7W8IHB	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 19:07:19.593
1cc248e2-1ebb-4345-84b8-1ee4682b0d5e	6a55dc16-988a-47d9-865e-3f01ff9ddcfb	SALE	695000.00	Venta V-MPBKTRG6-630MF9	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 19:07:57.382
4f68fe87-9ff1-4233-ba81-0c04c1d010df	6a55dc16-988a-47d9-865e-3f01ff9ddcfb	EXPENSE	300000.00	Ajuste venta V-MPBKSYAL-7W8IHB (devolución)	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 19:47:46.839
53a69ca3-7acf-4f16-ac3f-b85dfad8c23e	6a55dc16-988a-47d9-865e-3f01ff9ddcfb	INCOME	1700000.00	Ajuste venta V-MPBKSYAL-7W8IHB	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 19:55:54.364
27dc2644-a807-4f53-a5ac-62ced3e90671	6a55dc16-988a-47d9-865e-3f01ff9ddcfb	EXPENSE	700000.00	Ajuste venta V-MPBKSYAL-7W8IHB (devolución)	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 20:04:19.769
604d0165-7650-4688-8de0-b50d4473e4da	6a55dc16-988a-47d9-865e-3f01ff9ddcfb	INCOME	2120000.00	Ajuste venta V-MPBKTRG6-630MF9	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 20:04:46.882
09d4792d-0f9d-4cf0-9c51-65e69c3d2310	6a55dc16-988a-47d9-865e-3f01ff9ddcfb	INCOME	15000.00	Ajuste venta V-MPBKTRG6-630MF9	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 20:05:16.973
8480ac2f-d6df-4278-8629-fb04f2805fd9	6a55dc16-988a-47d9-865e-3f01ff9ddcfb	EXPENSE	2800000.00	Ajuste venta V-MPBKTRG6-630MF9 (devolución)	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 20:05:42.826
cb1cc7c1-9b75-4d32-b2f9-afc0fb1a55f9	6a55dc16-988a-47d9-865e-3f01ff9ddcfb	EXPENSE	700000.00	Ajuste venta V-MPBKSYAL-7W8IHB (devolución)	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 20:14:51.549
f273e1f1-d330-4803-be25-32ceb9f213f3	6a55dc16-988a-47d9-865e-3f01ff9ddcfb	INCOME	700000.00	Ajuste venta V-MPBKSYAL-7W8IHB	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 20:15:36.949
b043e605-7c19-4501-8660-b90f36d4ae93	6a55dc16-988a-47d9-865e-3f01ff9ddcfb	INCOME	15000.00	Ajuste venta V-MPBKSYAL-7W8IHB	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 20:19:54.061
6cf6b316-a160-4e03-a7ff-dd456211e378	6a55dc16-988a-47d9-865e-3f01ff9ddcfb	EXPENSE	700000.00	Ajuste venta V-MPBKSYAL-7W8IHB (devolución)	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 20:20:41.154
d88a76c2-2577-47df-8a71-07e6834a0a0c	6a55dc16-988a-47d9-865e-3f01ff9ddcfb	EXPENSE	700000.00	Ajuste venta V-MPBKSYAL-7W8IHB (devolución)	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 20:27:31.733
9de55ad1-8219-4f68-a852-8f12d29277f4	6a55dc16-988a-47d9-865e-3f01ff9ddcfb	EXPENSE	15000.00	Ajuste venta V-MPBKTRG6-630MF9 (devolución)	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 20:28:59.757
555b13a7-ca62-42fa-bb51-c7595469c9d7	6a55dc16-988a-47d9-865e-3f01ff9ddcfb	INCOME	700000.00	Ajuste venta V-MPBKTRG6-630MF9	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 20:30:40.42
2af1436c-e9e6-4e87-9ee2-a6b7c40b11fc	6a55dc16-988a-47d9-865e-3f01ff9ddcfb	INCOME	700000.00	Ajuste venta V-MPBKSYAL-7W8IHB	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 20:35:50.535
089e3f8b-8adf-4507-9241-be7e75cbef92	6a55dc16-988a-47d9-865e-3f01ff9ddcfb	INCOME	700000.00	Ajuste venta V-MPBKSYAL-7W8IHB	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 20:36:14.054
5ab9ca3d-25d9-46a8-82ff-0a543ab40884	6a55dc16-988a-47d9-865e-3f01ff9ddcfb	INCOME	700000.00	Ajuste venta V-MPBKSYAL-7W8IHB	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 20:36:38.614
b5ec40d3-4a92-456b-a766-4e5885a63b38	6a55dc16-988a-47d9-865e-3f01ff9ddcfb	EXPENSE	700000.00	Ajuste venta V-MPBKSYAL-7W8IHB (devolución)	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 20:38:19.455
ead38e00-5f13-478d-bb58-4fe56f81afeb	6a55dc16-988a-47d9-865e-3f01ff9ddcfb	EXPENSE	700000.00	Ajuste venta V-MPBKSYAL-7W8IHB (devolución)	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 20:40:01.36
9d1fe9a6-1916-402f-87cc-06e6920b0584	6a55dc16-988a-47d9-865e-3f01ff9ddcfb	EXPENSE	700000.00	Ajuste venta V-MPBKSYAL-7W8IHB (devolución)	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 20:40:36.606
b88224f6-7771-4177-8328-2f9862129f10	291208ee-f786-4555-a600-e3995f271b24	SALE	50000.00	Venta V-MPBRMUFI-KJ3CVB	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 22:18:31.969
ee0a7429-bd3e-41ec-ad86-ad84dc54b31d	291208ee-f786-4555-a600-e3995f271b24	SALE	50000.00	Venta V-MPBS6OWZ-CAS24W	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 22:33:57.937
105e1557-eb92-4b3a-8bf3-bf65d61122e7	291208ee-f786-4555-a600-e3995f271b24	SALE	10000.00	Venta V-MPBT4DT9-07I4NJ	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 23:00:09.849
\.


--
-- Data for Name: cash_registers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cash_registers (id, name, "isActive", "createdAt", "updatedAt") FROM stdin;
3739f411-b076-4139-9fec-9a6b02fd21a2	Caja Principal	t	2026-05-12 00:40:18.466	2026-05-12 00:40:18.466
\.


--
-- Data for Name: cash_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cash_sessions (id, "cashRegisterId", "userId", "openingAmount", "closingAmount", "expectedAmount", difference, "openedAt", "closedAt", status) FROM stdin;
aa241538-4fb8-4ea8-b0b6-7f1ff1308570	3739f411-b076-4139-9fec-9a6b02fd21a2	086c7a33-2f97-46ec-bed3-0ee95ee7a609	100000.00	200000.00	100889.00	99111.00	2026-05-12 04:42:03.175	2026-05-12 04:42:30.347	CLOSED
8a1064c2-41eb-4a62-9556-398bb7b3e239	3739f411-b076-4139-9fec-9a6b02fd21a2	086c7a33-2f97-46ec-bed3-0ee95ee7a609	20000.00	20000.00	20000.00	0.00	2026-05-12 21:28:12.666	2026-05-12 21:28:27.08	CLOSED
6a55dc16-988a-47d9-865e-3f01ff9ddcfb	3739f411-b076-4139-9fec-9a6b02fd21a2	086c7a33-2f97-46ec-bed3-0ee95ee7a609	100000.00	1500000.00	830000.00	670000.00	2026-05-18 19:06:35.141	2026-05-18 19:08:36.062	CLOSED
291208ee-f786-4555-a600-e3995f271b24	3739f411-b076-4139-9fec-9a6b02fd21a2	086c7a33-2f97-46ec-bed3-0ee95ee7a609	100000.00	\N	\N	\N	2026-05-18 22:16:56.084	\N	OPEN
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categories (id, name, description, "parentId", "imageUrl", "isActive", "createdAt", "updatedAt") FROM stdin;
a7e05356-0efa-408f-a0bd-87c0a5ee30ee	PARLANTES	Sonido	\N	\N	t	2026-05-12 02:14:28.165	2026-05-12 02:14:28.165
0d56fc57-cadb-40fe-af2c-f938a792d95a	JBL	\N	a7e05356-0efa-408f-a0bd-87c0a5ee30ee	\N	t	2026-05-12 02:14:43.219	2026-05-12 02:14:43.219
40e1cf4e-90c0-412a-af0e-284d0cb4a5ae	SONY	\N	a7e05356-0efa-408f-a0bd-87c0a5ee30ee	\N	t	2026-05-12 02:14:56.306	2026-05-12 02:14:56.306
1e19bba2-82d6-44f0-88ae-ee49aa472c3c	General	\N	\N	\N	t	2026-05-12 14:54:38.908	2026-05-12 14:54:38.908
80cd5179-8201-451f-98af-b51b8ac88ceb	LIJAS	\N	\N	\N	t	2026-05-18 22:58:02.53	2026-05-18 22:58:02.53
\.


--
-- Data for Name: company_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.company_settings (id, name, nit, address, city, phone, email, logo, "taxRegime", "invoiceFooter") FROM stdin;
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.customers (id, "documentType", "documentNumber", name, email, phone, address, city, "isActive", "createdAt", "updatedAt") FROM stdin;
dd673969-355a-4bf4-97f8-b3fd114d70b4	CC	1073478374	estiven	estiven@gmail.com	2313234345	calle 3 # 2 - 1	Popayan	t	2026-05-12 02:51:07.14	2026-05-12 02:51:07.14
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.documents (id, name, type, path, size, "mimeType", module, "entityId", "uploadedBy", "createdAt") FROM stdin;
3a49e7d8-d05f-4803-8d51-031e63d68bdf	e2e-doc-1778623896271.txt	txt	3a49e7d8-d05f-4803-8d51-031e63d68bdf.txt	24	text/plain	general	\N	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-12 22:11:36.326
5f584d83-43af-443b-b755-a37157c0f838	e2e-doc-1778623923877.txt	txt	5f584d83-43af-443b-b755-a37157c0f838.txt	24	text/plain	general	\N	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-12 22:12:03.914
\.


--
-- Data for Name: inventory; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inventory (id, "productId", quantity, "reservedQty") FROM stdin;
5e2cc62c-01da-4c11-b7dd-aa21055757f1	a5d45022-eafa-4fd9-a4bc-91459d501081	5.0000	0.0000
8e721abe-d99b-485d-bd04-b36f3a4842de	cd3f9e15-b894-430c-8bc2-afaccc3f6f8f	100.0000	0.0000
463fdb8f-5d10-4d28-a78f-c5faa9825d8b	2eab3442-7728-4655-b910-9c052e9fea2d	40.0000	3.0000
8b5abf67-7247-4091-baf8-f65249387b3f	a645f50f-3fdc-40ff-8427-7b403934b700	40.0000	0.0000
a3989c7b-86ee-4c48-a730-3d8f1c12d6c5	d3209abe-585d-4e85-ab26-8ed421df3fb9	0.0000	0.0000
4014fb2d-9b1a-4ec2-90c7-2e26ae33e52e	a15a6f9a-8168-4526-a213-e5a7f480f057	95.0000	0.0000
f4235cb8-2161-4772-a9d3-8c3f5e6d339c	23142c19-f1e7-43d0-b86e-ed6e3c19a520	5.0000	1.0000
\.


--
-- Data for Name: inventory_adjustments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inventory_adjustments (id, "productId", type, "previousQty", "newQty", reason, "userId", "createdAt") FROM stdin;
7bada5fd-49ad-4a35-bd89-141d1668cd53	a5d45022-eafa-4fd9-a4bc-91459d501081	ADJUST	0.0000	10.0000	1as	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-12 02:19:52.34
ac912a91-d91d-434a-93b2-c1da6d19de34	a5d45022-eafa-4fd9-a4bc-91459d501081	ADJUST	10.0000	20.0000	assdsa	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-12 02:20:12.99
ef2f4c3b-0129-4ccb-88fd-79e8e3c29747	2eab3442-7728-4655-b910-9c052e9fea2d	ADJUST	0.0000	40.0000	qwdasd	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-12 02:27:31.67
33b7ddeb-d430-4261-bba1-b78cde73a856	a5d45022-eafa-4fd9-a4bc-91459d501081	ADJUST	12.0000	5.0000	sss	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 18:41:55.635
56435316-825a-44cf-b6d9-6f00bb137fb8	23142c19-f1e7-43d0-b86e-ed6e3c19a520	ADJUST	0.0000	30.0000	ingreso	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 22:13:20.223
90a86114-cd54-4516-891b-d3cc60a7dd73	2eab3442-7728-4655-b910-9c052e9fea2d	ADJUST	33.0000	2.0000	sss	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 22:14:45.707
a3a677ac-5663-4908-9f2b-468c74a05d9e	2eab3442-7728-4655-b910-9c052e9fea2d	ADJUST	2.0000	40.0000	ssss	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 22:14:56.686
3f10b244-0bf3-496e-9f39-440c902cc82a	d3209abe-585d-4e85-ab26-8ed421df3fb9	ADJUST	0.0000	20.0000	sss	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 22:18:09.056
09b57030-ac92-4ce7-93d2-75ab56cebedb	a645f50f-3fdc-40ff-8427-7b403934b700	ADJUST	0.0000	40.0000	ingreso	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 22:32:54.96
b68055ff-fb59-48b6-a16a-28f32b45354f	a15a6f9a-8168-4526-a213-e5a7f480f057	ADJUST	0.0000	100.0000	agregar	8f8c12c0-5df8-4b39-9b4d-6fde7d23f6cc	2026-05-18 22:57:17.887
27e2e203-277e-4860-8708-d2bb0cf68b5f	23142c19-f1e7-43d0-b86e-ed6e3c19a520	ADJUST	30.0000	5.0000	Test notificaciones	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-21 02:05:01.183
\.


--
-- Data for Name: invoice_numbering; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.invoice_numbering (id, prefix, "resolutionNumber", "startNumber", "endNumber", "currentNumber", "startDate", "endDate", "isActive", "createdAt", "updatedAt") FROM stdin;
96ca7c08-97c3-479f-969a-06f96a49666c	TKT	Pendiente de configuración (actualice en Facturación)	1	4999999	25	2026-05-12 04:49:58.335	2030-12-31 23:59:59	t	2026-05-12 04:49:58.337	2026-05-18 23:00:09.855
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.invoices (id, "saleId", number, prefix, "resolutionNumber", date, subtotal, "taxTotal", total, status, "customerName", "customerDoc", "pdfUrl", "xmlUrl", "createdAt", "updatedAt", "electronicTrackId", cufe, "qrPayload") FROM stdin;
33e09bbe-1396-463e-952e-f2c2b5819cd0	e5aa9399-e88e-4c39-bdb4-7f2df52c1a0b	2	TKT	Pendiente de configuración (actualice en Facturación)	2026-05-12 04:50:02.518	700000.00	0.00	700000.00	ACTIVE	estiven	CC 1073478374	\N	\N	2026-05-12 04:50:02.519	2026-05-12 04:50:02.519	\N	\N	\N
78b19571-2c5b-4725-8c35-4bfd39dbbb33	1ac74cf2-2d25-4034-be8f-fcc810a854c0	1	TKT	Pendiente de configuración (actualice en Facturación)	2026-05-12 04:49:58.337	700000.00	0.00	700000.00	CANCELLED	estiven	CC 1073478374	\N	\N	2026-05-12 04:49:58.339	2026-05-12 04:50:18.037	\N	\N	\N
1f5c2bf7-94f3-4e59-92da-edae482d60e4	61904e41-b9db-4fa6-a154-e58515c9401e	3	TKT	Pendiente de configuración (actualice en Facturación)	2026-05-12 20:56:55.044	20000.00	0.00	20000.00	ACTIVE	estiven	CC 1073478374	\N	\N	2026-05-12 20:56:55.05	2026-05-12 20:56:55.05	\N	\N	\N
f876a232-7a43-47a1-8934-f4df8feb058a	eaea5a26-6b42-4ff2-92a0-b36bac03c2fa	19	TKT	Pendiente de configuración (actualice en Facturación)	2026-05-18 18:58:42.645	15000.00	0.00	15000.00	ACTIVE	estiven	CC 1073478374	/api/invoices/f876a232-7a43-47a1-8934-f4df8feb058a/files/pdf	/api/invoices/f876a232-7a43-47a1-8934-f4df8feb058a/files/xml	2026-05-18 18:58:42.646	2026-05-18 18:58:42.745	LOCAL-FE-19-1779130722653	A803046CF41CCBA14E1F682BC5608EFC3D471E6FFDC9F995FFCD4679D2F1C8A62731A1B5557F399FBB106C96E1B08B81	https://catalogo-vpfe-hab.dian.gov.co/document/searchqr?documentkey=A803046CF41CCBA14E1F682BC5608EFC3D471E6FFDC9F995FFCD4679D2F1C8A62731A1B5557F399FBB106C96E1B08B81
30532284-4fce-468c-93f9-a1e90ea1e5a8	07ed7140-cffa-4b9e-8875-90b42cfa9108	4	TKT	Pendiente de configuración (actualice en Facturación)	2026-05-12 20:59:58.353	3000.00	0.00	3000.00	ACTIVE	estiven	CC 1073478374	/api/invoices/30532284-4fce-468c-93f9-a1e90ea1e5a8/files/pdf	/api/invoices/30532284-4fce-468c-93f9-a1e90ea1e5a8/files/xml	2026-05-12 20:59:58.354	2026-05-12 20:59:58.422	\N	\N	\N
0edf3862-13cb-44ca-a825-566118dc822c	2eb25023-4e96-441f-8378-b6a02dcbdc71	9	TKT	Pendiente de configuración (actualice en Facturación)	2026-05-12 21:25:49.595	3000.00	0.00	3000.00	ACTIVE	Consumidor final	\N	/api/invoices/0edf3862-13cb-44ca-a825-566118dc822c/files/pdf	/api/invoices/0edf3862-13cb-44ca-a825-566118dc822c/files/xml	2026-05-12 21:25:49.597	2026-05-12 21:25:49.643	\N	\N	\N
69ffa513-3850-4678-bf00-05864799b8da	2906c7b3-f0ad-4544-91f8-ff6013d532ca	15	TKT	Pendiente de configuración (actualice en Facturación)	2026-05-18 18:32:46.267	0.00	0.00	0.00	ACTIVE	estiven	CC 1073478374	/api/invoices/69ffa513-3850-4678-bf00-05864799b8da/files/pdf	/api/invoices/69ffa513-3850-4678-bf00-05864799b8da/files/xml	2026-05-18 18:32:46.268	2026-05-18 18:32:46.305	LOCAL-FE-15-1779129166273	D5D6F29738728B8D2536F0A4D623A5EE5DD79F803B85F974E976A2936F4AC7C8B730F3A894507DCE6B78DB6DF4B85E74	https://catalogo-vpfe-hab.dian.gov.co/document/searchqr?documentkey=D5D6F29738728B8D2536F0A4D623A5EE5DD79F803B85F974E976A2936F4AC7C8B730F3A894507DCE6B78DB6DF4B85E74
b8a8dbef-3bfe-4ad6-8afd-28346847e31b	bf9a53a2-cab5-4c83-bfbc-79c5a42f0cec	10	TKT	Pendiente de configuración (actualice en Facturación)	2026-05-13 14:27:51.254	699800.00	0.00	699800.00	ACTIVE	estiven	CC 1073478374	/api/invoices/b8a8dbef-3bfe-4ad6-8afd-28346847e31b/files/pdf	/api/invoices/b8a8dbef-3bfe-4ad6-8afd-28346847e31b/files/xml	2026-05-13 14:27:51.256	2026-05-18 18:27:51.906	LOCAL-FE-10-1779128871816	CDDA462BEE283B0E3D102064D0F3F388C4D520E3D9EB0D3E807C01D7FE237D60F7A3F136A1AFE9417B960C902BB78F8F	https://catalogo-vpfe-hab.dian.gov.co/document/searchqr?documentkey=CDDA462BEE283B0E3D102064D0F3F388C4D520E3D9EB0D3E807C01D7FE237D60F7A3F136A1AFE9417B960C902BB78F8F
58fd7118-8377-4ce4-95fb-629262a4fb37	39831189-2ceb-42ba-8791-610b46462d7b	11	TKT	Pendiente de configuración (actualice en Facturación)	2026-05-18 18:32:27.432	3000.00	0.00	3000.00	ACTIVE	estiven	CC 1073478374	/api/invoices/58fd7118-8377-4ce4-95fb-629262a4fb37/files/pdf	/api/invoices/58fd7118-8377-4ce4-95fb-629262a4fb37/files/xml	2026-05-18 18:32:27.433	2026-05-18 18:32:27.518	LOCAL-FE-11-1779129147439	1B11D96FD1A10D7FC2CEB1078AD87A32043C8F03ED089BB29ABEB52A7AAF87EA05BC344053D7335CAFCD6711E168ADED	https://catalogo-vpfe-hab.dian.gov.co/document/searchqr?documentkey=1B11D96FD1A10D7FC2CEB1078AD87A32043C8F03ED089BB29ABEB52A7AAF87EA05BC344053D7335CAFCD6711E168ADED
ba1db500-d9f5-4e19-baf0-dc8107e6a773	35e37928-2688-4143-bbea-b2bce0f956fe	12	TKT	Pendiente de configuración (actualice en Facturación)	2026-05-18 18:32:29.979	6000.00	0.00	6000.00	ACTIVE	estiven	CC 1073478374	/api/invoices/ba1db500-d9f5-4e19-baf0-dc8107e6a773/files/pdf	/api/invoices/ba1db500-d9f5-4e19-baf0-dc8107e6a773/files/xml	2026-05-18 18:32:29.98	2026-05-18 18:32:30.047	LOCAL-FE-12-1779129149987	2AA6F4E0FCE749C828949E75161D61B85806119E8FD3DEC1862A22B780085993A8378E6DE506396F7EFC3A8DC3C9D6D5	https://catalogo-vpfe-hab.dian.gov.co/document/searchqr?documentkey=2AA6F4E0FCE749C828949E75161D61B85806119E8FD3DEC1862A22B780085993A8378E6DE506396F7EFC3A8DC3C9D6D5
9aa7e562-7156-4112-a4c4-6b2a850be384	6b0851f1-d8ee-4633-b2cf-c265d8fa62d6	13	TKT	Pendiente de configuración (actualice en Facturación)	2026-05-18 18:32:35.252	2800.00	0.00	2800.00	ACTIVE	estiven	CC 1073478374	/api/invoices/9aa7e562-7156-4112-a4c4-6b2a850be384/files/pdf	/api/invoices/9aa7e562-7156-4112-a4c4-6b2a850be384/files/xml	2026-05-18 18:32:35.252	2026-05-18 18:32:35.291	LOCAL-FE-13-1779129155256	E8A78009BBE5E1592179588CB4C52891D86CD4952277A749F15578DE21C24C0B9CECFF32A381610768D40416797BEAFD	https://catalogo-vpfe-hab.dian.gov.co/document/searchqr?documentkey=E8A78009BBE5E1592179588CB4C52891D86CD4952277A749F15578DE21C24C0B9CECFF32A381610768D40416797BEAFD
54869e9c-a333-44ec-8a94-b268642d9dfc	311b4c92-d4ab-4507-8def-3d33866875b2	14	TKT	Pendiente de configuración (actualice en Facturación)	2026-05-18 18:32:41.358	0.00	0.00	0.00	ACTIVE	estiven	CC 1073478374	/api/invoices/54869e9c-a333-44ec-8a94-b268642d9dfc/files/pdf	/api/invoices/54869e9c-a333-44ec-8a94-b268642d9dfc/files/xml	2026-05-18 18:32:41.359	2026-05-18 18:32:41.392	LOCAL-FE-14-1779129161362	FCB80E5BADE95A8F923C44A13EE2B1584FCD45325B2A448D358897DD5874958503CD65D8BBB21463EE23A052147A13A2	https://catalogo-vpfe-hab.dian.gov.co/document/searchqr?documentkey=FCB80E5BADE95A8F923C44A13EE2B1584FCD45325B2A448D358897DD5874958503CD65D8BBB21463EE23A052147A13A2
74ef5bad-c9ca-41ad-8a49-458eb97408e9	ea7257d5-e948-4fcb-8cce-1a0ac20faba5	16	TKT	Pendiente de configuración (actualice en Facturación)	2026-05-18 18:32:48.895	700000.00	0.00	700000.00	ACTIVE	Consumidor final	\N	/api/invoices/74ef5bad-c9ca-41ad-8a49-458eb97408e9/files/pdf	/api/invoices/74ef5bad-c9ca-41ad-8a49-458eb97408e9/files/xml	2026-05-18 18:32:48.895	2026-05-18 18:32:48.95	LOCAL-FE-16-1779129168901	631B646CF7E6E272BDFA1F20D9A83DD37A5EEB4DB330B2DDA9A9DECB02EFED0D6651A7CE76DE6D66BF7BB617F7E3DBBF	https://catalogo-vpfe-hab.dian.gov.co/document/searchqr?documentkey=631B646CF7E6E272BDFA1F20D9A83DD37A5EEB4DB330B2DDA9A9DECB02EFED0D6651A7CE76DE6D66BF7BB617F7E3DBBF
bcd07315-d447-4f3b-a10a-ebc20bf7f1ea	6794c9e6-172c-496f-aeb3-a4a2cb066d6e	17	TKT	Pendiente de configuración (actualice en Facturación)	2026-05-18 18:32:50.782	3000.00	0.00	3000.00	ACTIVE	estiven	CC 1073478374	/api/invoices/bcd07315-d447-4f3b-a10a-ebc20bf7f1ea/files/pdf	/api/invoices/bcd07315-d447-4f3b-a10a-ebc20bf7f1ea/files/xml	2026-05-18 18:32:50.783	2026-05-18 18:32:50.814	LOCAL-FE-17-1779129170787	7B5DBCC44C49D4D6377686439FAB29108F70CF652F179EB6AD3C0878C18DA5C6051459A2F2EF47096DD66A3F3C7671E9	https://catalogo-vpfe-hab.dian.gov.co/document/searchqr?documentkey=7B5DBCC44C49D4D6377686439FAB29108F70CF652F179EB6AD3C0878C18DA5C6051459A2F2EF47096DD66A3F3C7671E9
54dd407c-9d82-4c9a-9410-7a66ab06c5cc	d8a595a7-5caa-4d6e-8874-f2200035477d	18	TKT	Pendiente de configuración (actualice en Facturación)	2026-05-18 18:32:52.716	50000.00	0.00	50000.00	ACTIVE	estiven	CC 1073478374	/api/invoices/54dd407c-9d82-4c9a-9410-7a66ab06c5cc/files/pdf	/api/invoices/54dd407c-9d82-4c9a-9410-7a66ab06c5cc/files/xml	2026-05-18 18:32:52.717	2026-05-18 18:32:52.751	LOCAL-FE-18-1779129172721	E96B259EDC1199D942E085C689FD852DF7AA5797AF688F717F6C4448065CFAC3C52F361D62B4192A6BF27FBF8007260A	https://catalogo-vpfe-hab.dian.gov.co/document/searchqr?documentkey=E96B259EDC1199D942E085C689FD852DF7AA5797AF688F717F6C4448065CFAC3C52F361D62B4192A6BF27FBF8007260A
62c7b071-b85f-4296-ac15-126f15d28a65	18eee202-f1b6-4522-8c92-ce8557d1b5b7	20	TKT	Pendiente de configuración (actualice en Facturación)	2026-05-18 19:02:14.007	15000.00	0.00	15000.00	ACTIVE	estiven	CC 1073478374	/api/invoices/62c7b071-b85f-4296-ac15-126f15d28a65/files/pdf	/api/invoices/62c7b071-b85f-4296-ac15-126f15d28a65/files/xml	2026-05-18 19:02:14.007	2026-05-18 19:02:14.115	LOCAL-FE-20-1779130934015	925A53A66B92F66B898B3676B17B866B22AB058D7E4C1B7E437B04A7A66874CF0F19E8AFBE542A0513070C85FA6F4A8C	https://catalogo-vpfe-hab.dian.gov.co/document/searchqr?documentkey=925A53A66B92F66B898B3676B17B866B22AB058D7E4C1B7E437B04A7A66874CF0F19E8AFBE542A0513070C85FA6F4A8C
ab87b759-1083-40c2-a665-44378c3f8149	8918c87e-4c92-4f25-a7db-f029440541c0	25	TKT	Pendiente de configuración (actualice en Facturación)	2026-05-18 23:00:09.854	10000.00	0.00	10000.00	ACTIVE	Consumidor final	\N	/api/invoices/ab87b759-1083-40c2-a665-44378c3f8149/files/pdf	/api/invoices/ab87b759-1083-40c2-a665-44378c3f8149/files/xml	2026-05-18 23:00:09.854	2026-05-18 23:00:09.942	LOCAL-FE-25-1779145209858	0CF5CAF0A71E64A6E993D507D2234FD2487A5EF600030077AFC3A9FA483E9123FD0B9C79515098BBBF1D504AAF706A8A	https://catalogo-vpfe-hab.dian.gov.co/document/searchqr?documentkey=0CF5CAF0A71E64A6E993D507D2234FD2487A5EF600030077AFC3A9FA483E9123FD0B9C79515098BBBF1D504AAF706A8A
153038e2-546b-44dc-a213-a52a4852f7b9	eec0b8f5-f103-4e7b-8439-1d0835ef299b	23	TKT	Pendiente de configuración (actualice en Facturación)	2026-05-18 22:18:31.975	50000.00	0.00	50000.00	CANCELLED	Consumidor final	\N	/api/invoices/153038e2-546b-44dc-a213-a52a4852f7b9/files/pdf	/api/invoices/153038e2-546b-44dc-a213-a52a4852f7b9/files/xml	2026-05-18 22:18:31.976	2026-05-18 23:08:44.754	LOCAL-FE-23-1779142711982	4AE021EB73D510A36C3A477C462D0444FF85CC5099F1FF4ED2B2357372E6A1808E981517FCC7E4EB3DADD83408C4A430	https://catalogo-vpfe-hab.dian.gov.co/document/searchqr?documentkey=4AE021EB73D510A36C3A477C462D0444FF85CC5099F1FF4ED2B2357372E6A1808E981517FCC7E4EB3DADD83408C4A430
0d371693-5979-437d-a55d-c16b09dd1935	f2e13e6b-7f64-4730-bcd4-ac55f5076c2f	21	TKT	Pendiente de configuración (actualice en Facturación)	2026-05-18 20:40:36.61	15000.00	0.00	15000.00	CANCELLED	Consumidor final	\N	/api/invoices/0d371693-5979-437d-a55d-c16b09dd1935/files/pdf	/api/invoices/0d371693-5979-437d-a55d-c16b09dd1935/files/xml	2026-05-18 19:07:19.599	2026-05-18 20:40:40.751	LOCAL-FE-21-1779136836614	0AADA30060A5246F06A9F367DEBB36CEF2B728436EF393EBC7E8FDC03B9A3B998833DEBC0CD522B38926EDF970859FB1	https://catalogo-vpfe-hab.dian.gov.co/document/searchqr?documentkey=0AADA30060A5246F06A9F367DEBB36CEF2B728436EF393EBC7E8FDC03B9A3B998833DEBC0CD522B38926EDF970859FB1
9c0976e5-0959-477e-b00a-21f23631d97a	0a631f29-6a76-49d4-a117-7fdb5934194a	22	TKT	Pendiente de configuración (actualice en Facturación)	2026-05-18 20:28:59.762	15000.00	0.00	15000.00	ACTIVE_ADJUSTED	Consumidor final	\N	/api/invoices/9c0976e5-0959-477e-b00a-21f23631d97a/files/pdf	/api/invoices/9c0976e5-0959-477e-b00a-21f23631d97a/files/xml	2026-05-18 19:07:57.386	2026-05-18 20:28:59.833	LOCAL-FE-22-1779136139766	90F3826F547C661683D5D6B4E306D40C00CFEA301CC394E2B4457F72F8A076B6022DB68291F575378980550B45BFBA34	https://catalogo-vpfe-hab.dian.gov.co/document/searchqr?documentkey=90F3826F547C661683D5D6B4E306D40C00CFEA301CC394E2B4457F72F8A076B6022DB68291F575378980550B45BFBA34
d1873e0e-bbe2-4be2-86ee-a1148b1fea8f	e0bd691d-d874-427f-8df9-ed638ebacaa9	24	TKT	Pendiente de configuración (actualice en Facturación)	2026-05-18 22:33:57.941	50000.00	0.00	50000.00	ACTIVE	estiven	CC 1073478374	/api/invoices/d1873e0e-bbe2-4be2-86ee-a1148b1fea8f/files/pdf	/api/invoices/d1873e0e-bbe2-4be2-86ee-a1148b1fea8f/files/xml	2026-05-18 22:33:57.942	2026-05-18 22:33:58.029	LOCAL-FE-24-1779143637947	C80656682A37FCA9D7074D58EAF1CAFD0C51534E0CF9504F0F8E67D6D93F92057DE75136A54B72B54F14A58DE0C595C8	https://catalogo-vpfe-hab.dian.gov.co/document/searchqr?documentkey=C80656682A37FCA9D7074D58EAF1CAFD0C51534E0CF9504F0F8E67D6D93F92057DE75136A54B72B54F14A58DE0C595C8
\.


--
-- Data for Name: kardex_entries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.kardex_entries (id, "productId", type, quantity, "previousStock", "newStock", "unitCost", "totalCost", "referenceType", "referenceId", notes, "userId", "createdAt", "operationalQuantity", "operationalUnitId", "conversionFactor") FROM stdin;
0dfac05b-cbaa-4e0a-b06c-5f5942c5748b	a5d45022-eafa-4fd9-a4bc-91459d501081	ADJUST	10.0000	0.0000	10.0000	2000.00	20000.00	\N	\N	1as	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-12 02:19:52.335	\N	\N	\N
9773f911-af7b-4473-94d6-1319b8dd541a	a5d45022-eafa-4fd9-a4bc-91459d501081	ADJUST	10.0000	10.0000	20.0000	2000.00	20000.00	\N	\N	assdsa	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-12 02:20:12.987	\N	\N	\N
9c502631-8150-4642-856a-5b889ad3f613	2eab3442-7728-4655-b910-9c052e9fea2d	ADJUST	40.0000	0.0000	40.0000	600000.00	24000000.00	\N	\N	qwdasd	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-12 02:27:31.669	\N	\N	\N
deefcfb5-c50d-4782-a906-b6cb0a8cb745	a5d45022-eafa-4fd9-a4bc-91459d501081	IN	1.0000	20.0000	21.0000	2000.00	2000.00	Purchase	4d1033e7-f89f-40c2-b17c-1d004b9498c9	Recepción OC-MP219EAB-7N3AA0	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-12 02:50:34.354	\N	\N	\N
212d2304-220b-45f3-a3c4-fe282adfff2f	a5d45022-eafa-4fd9-a4bc-91459d501081	OUT	-1.0000	21.0000	20.0000	2000.00	2000.00	Sale	b12ccb07-3e1a-4a89-ab03-aedb3f73a43f	Venta V-MP21I6FZ-WOAYN8	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-12 02:57:08.656	\N	\N	\N
11199fed-0bc3-41c8-bb28-15cd5963b477	a5d45022-eafa-4fd9-a4bc-91459d501081	IN	1.0000	20.0000	21.0000	2000.00	2000.00	Sale	b12ccb07-3e1a-4a89-ab03-aedb3f73a43f	Reembolso venta V-MP21I6FZ-WOAYN8	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-12 02:57:19.358	\N	\N	\N
fe88e7a5-fa6f-4ff7-94bd-c32f698fe931	2eab3442-7728-4655-b910-9c052e9fea2d	OUT	-1.0000	40.0000	39.0000	5000.00	5000.00	Sale	37324099-22c8-4c04-a50d-0e46fb5bc626	Venta V-MP21K7DR-FHILOG	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-12 02:58:43.178	\N	\N	\N
023feb42-592c-4bed-b191-1645e13560bf	2eab3442-7728-4655-b910-9c052e9fea2d	IN	1.0000	39.0000	40.0000	5000.00	5000.00	Sale	37324099-22c8-4c04-a50d-0e46fb5bc626	Anulación venta V-MP21K7DR-FHILOG	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-12 02:58:49.094	\N	\N	\N
2decf5bf-13ce-448e-b463-29920f2cd653	2eab3442-7728-4655-b910-9c052e9fea2d	OUT	-1.0000	40.0000	39.0000	50000.00	50000.00	Sale	d8a595a7-5caa-4d6e-8874-f2200035477d	Venta V-MP21KNCR-RJ3LDF	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-12 02:59:03.875	\N	\N	\N
e8e57be5-5c14-446d-95e5-e06203a20e84	a5d45022-eafa-4fd9-a4bc-91459d501081	OUT	-1.0000	21.0000	20.0000	3000.00	3000.00	Sale	6794c9e6-172c-496f-aeb3-a4a2cb066d6e	Venta POS V-MP221K67-CKEG8J	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-12 03:12:12.907	\N	\N	\N
0ab74c03-6c8d-481a-8440-4432a8eccc41	2eab3442-7728-4655-b910-9c052e9fea2d	OUT	-1.0000	39.0000	38.0000	700000.00	700000.00	Sale	bf9a53a2-cab5-4c83-bfbc-79c5a42f0cec	Venta POS V-MP2228OK-ZRSRED	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-12 03:12:44.669	\N	\N	\N
1b8ebb5b-f69b-4758-82a7-a3fdc32e8a93	2eab3442-7728-4655-b910-9c052e9fea2d	OUT	-1.0000	38.0000	37.0000	700000.00	700000.00	Sale	e5aa9399-e88e-4c39-bdb4-7f2df52c1a0b	Venta POS V-MP24QRLJ-ELKT2B	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-12 04:27:48.163	\N	\N	\N
65256a1b-2895-41c7-a04c-c87b41cfcbdd	a5d45022-eafa-4fd9-a4bc-91459d501081	OUT	-1.0000	20.0000	19.0000	3000.00	3000.00	Sale	07ed7140-cffa-4b9e-8875-90b42cfa9108	Venta POS V-MP252VK6-T043ZM	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-12 04:37:13.169	\N	\N	\N
f0179379-98ae-462e-b628-ce2431a30053	2eab3442-7728-4655-b910-9c052e9fea2d	OUT	-1.0000	37.0000	36.0000	700000.00	700000.00	Sale	1ac74cf2-2d25-4034-be8f-fcc810a854c0	Venta POS V-MP258VG3-SGYVYZ	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-12 04:41:52.959	\N	\N	\N
12d984db-d5b5-4d30-a78e-37d410459b38	2eab3442-7728-4655-b910-9c052e9fea2d	OUT	-1.0000	36.0000	35.0000	20000.00	20000.00	Sale	61904e41-b9db-4fa6-a154-e58515c9401e	Venta V-MP25KD7P-3WMZSK	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-12 04:50:49.205	\N	\N	\N
ec4b8a57-a4a7-4ec6-91ff-2c00a9bbbcca	a5d45022-eafa-4fd9-a4bc-91459d501081	OUT	-1.0000	19.0000	18.0000	3000.00	3000.00	Sale	2eb25023-4e96-441f-8378-b6a02dcbdc71	Venta POS V-MP34ED77-24N3QS	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-12 21:05:55.81	\N	\N	\N
89894283-c182-469b-bf6d-04b5e2316a0d	2eab3442-7728-4655-b910-9c052e9fea2d	OUT	-1.0000	35.0000	34.0000	700000.00	700000.00	Sale	ea7257d5-e948-4fcb-8cce-1a0ac20faba5	Venta POS V-MP48VWVB-HZKTXY	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-13 15:59:19.09	\N	\N	\N
6c242955-2ba7-44b2-917b-5de1101d1571	a5d45022-eafa-4fd9-a4bc-91459d501081	OUT	-1.0000	18.0000	17.0000	0.00	0.00	Sale	2906c7b3-f0ad-4544-91f8-ff6013d532ca	Venta V-MP49E117-BGF10E	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-13 16:13:24.298	\N	\N	\N
e60f669c-dd9a-4d75-8808-599ddd9841b2	a5d45022-eafa-4fd9-a4bc-91459d501081	OUT	-1.0000	17.0000	16.0000	0.00	0.00	Sale	311b4c92-d4ab-4507-8def-3d33866875b2	Venta V-MP49VAMX-M2ZD0V	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-13 16:26:49.894	\N	\N	\N
b41b7b1d-8345-4bfe-a4f8-87a645dca6e0	a5d45022-eafa-4fd9-a4bc-91459d501081	OUT	-1.0000	16.0000	15.0000	3000.00	3000.00	Sale	6b0851f1-d8ee-4633-b2cf-c265d8fa62d6	Venta POS V-MPBIXIPL-HKI3LT	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 18:14:53.44	\N	\N	\N
811cd0ab-ca12-421e-b366-22139034e178	a5d45022-eafa-4fd9-a4bc-91459d501081	OUT	-2.0000	15.0000	13.0000	3000.00	6000.00	Sale	35e37928-2688-4143-bbea-b2bce0f956fe	Venta V-MPBJ7Y7G-C1GH8N	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 18:23:00.084	\N	\N	\N
916dbc87-99ed-4bcb-956f-38a217a0930d	a5d45022-eafa-4fd9-a4bc-91459d501081	OUT	-1.0000	13.0000	12.0000	3000.00	3000.00	Sale	39831189-2ceb-42ba-8791-610b46462d7b	Venta POS V-MPBJF9C6-NGL6WW	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 18:28:41.101	\N	\N	\N
b7da238c-8129-4baf-a63f-a7fa7281a47e	a5d45022-eafa-4fd9-a4bc-91459d501081	ADJUST	-7.0000	12.0000	5.0000	2000.00	14000.00	\N	\N	sss	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 18:41:55.633	\N	\N	\N
a94425d9-5ebd-488f-adc0-f91033290c99	cd3f9e15-b894-430c-8bc2-afaccc3f6f8f	OUT	-1.0000	100.0000	99.0000	15000.00	15000.00	Sale	eaea5a26-6b42-4ff2-92a0-b36bac03c2fa	Venta POS V-MPBKHVEP-J4V2EM	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 18:58:42.638	\N	\N	\N
705823c8-3094-4c57-89b3-1afaec4c2009	cd3f9e15-b894-430c-8bc2-afaccc3f6f8f	OUT	-1.0000	99.0000	98.0000	15000.00	15000.00	Sale	18eee202-f1b6-4522-8c92-ce8557d1b5b7	Venta POS V-MPBKMEHZ-F0FG5R	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 19:02:13.998	\N	\N	\N
8c771cb8-1ab3-4d2b-9ddf-c1e3a38015df	2eab3442-7728-4655-b910-9c052e9fea2d	OUT	-1.0000	34.0000	33.0000	700000.00	700000.00	Sale	f2e13e6b-7f64-4730-bcd4-ac55f5076c2f	Venta POS V-MPBKSYAL-7W8IHB	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 19:07:19.588	\N	\N	\N
01914426-ef53-454f-a080-90f2510d4e99	cd3f9e15-b894-430c-8bc2-afaccc3f6f8f	OUT	-1.0000	98.0000	97.0000	15000.00	15000.00	Sale	0a631f29-6a76-49d4-a117-7fdb5934194a	Venta POS V-MPBKTRG6-630MF9	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 19:07:57.375	\N	\N	\N
188f9c36-f1b8-4797-98df-454d59948430	2eab3442-7728-4655-b910-9c052e9fea2d	OUT	-1.0000	33.0000	32.0000	700000.00	700000.00	Sale	0a631f29-6a76-49d4-a117-7fdb5934194a	Venta POS V-MPBKTRG6-630MF9	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 19:07:57.377	\N	\N	\N
f77e7b98-988b-41ef-b95c-27ed88e015fa	2eab3442-7728-4655-b910-9c052e9fea2d	OUT	-1.0000	32.0000	31.0000	700000.00	700000.00	Sale	f2e13e6b-7f64-4730-bcd4-ac55f5076c2f	Ajuste venta V-MPBKSYAL-7W8IHB	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 19:47:46.833	\N	\N	\N
fb2fd675-8c59-4252-a5c2-6182c65be866	2eab3442-7728-4655-b910-9c052e9fea2d	OUT	-1.0000	31.0000	30.0000	700000.00	700000.00	Sale	f2e13e6b-7f64-4730-bcd4-ac55f5076c2f	Ajuste venta V-MPBKSYAL-7W8IHB	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 19:55:54.359	\N	\N	\N
360c539a-4236-4dc7-ad13-affd2f988764	2eab3442-7728-4655-b910-9c052e9fea2d	IN	1.0000	30.0000	31.0000	700000.00	700000.00	Sale	f2e13e6b-7f64-4730-bcd4-ac55f5076c2f	Ajuste venta V-MPBKSYAL-7W8IHB	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 20:04:19.754	\N	\N	\N
90ba13cf-42b0-4b30-a2f9-544d782a5631	2eab3442-7728-4655-b910-9c052e9fea2d	OUT	-3.0000	31.0000	28.0000	700000.00	2100000.00	Sale	0a631f29-6a76-49d4-a117-7fdb5934194a	Ajuste venta V-MPBKTRG6-630MF9	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 20:04:46.876	\N	\N	\N
b33228ba-07a9-4409-a7d9-5d4fbd121127	cd3f9e15-b894-430c-8bc2-afaccc3f6f8f	OUT	-1.0000	100.0000	99.0000	15000.00	15000.00	Sale	0a631f29-6a76-49d4-a117-7fdb5934194a	Ajuste venta V-MPBKTRG6-630MF9	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 20:05:16.963	\N	\N	\N
3bd4cefa-7f10-4c30-aa7d-6180c17ea320	2eab3442-7728-4655-b910-9c052e9fea2d	IN	4.0000	28.0000	32.0000	700000.00	2800000.00	Sale	0a631f29-6a76-49d4-a117-7fdb5934194a	Ajuste venta V-MPBKTRG6-630MF9	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 20:05:42.821	\N	\N	\N
91fd1e40-e3f9-45ab-ac9b-a006a871fb4e	2eab3442-7728-4655-b910-9c052e9fea2d	IN	1.0000	32.0000	33.0000	700000.00	700000.00	Sale	f2e13e6b-7f64-4730-bcd4-ac55f5076c2f	Ajuste venta V-MPBKSYAL-7W8IHB	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 20:14:51.543	\N	\N	\N
12f1f03f-0aa1-484b-8470-cdb96222c5b8	2eab3442-7728-4655-b910-9c052e9fea2d	OUT	-1.0000	33.0000	32.0000	700000.00	700000.00	Sale	f2e13e6b-7f64-4730-bcd4-ac55f5076c2f	Ajuste venta V-MPBKSYAL-7W8IHB	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 20:15:36.941	\N	\N	\N
229b06b3-9f51-4ed2-afa0-7cadd07ee6b7	cd3f9e15-b894-430c-8bc2-afaccc3f6f8f	OUT	-1.0000	99.0000	98.0000	15000.00	15000.00	Sale	f2e13e6b-7f64-4730-bcd4-ac55f5076c2f	Ajuste venta V-MPBKSYAL-7W8IHB	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 20:19:54.056	\N	\N	\N
5ca66761-b964-4ee0-b8fc-6100a4b67ae9	2eab3442-7728-4655-b910-9c052e9fea2d	IN	1.0000	32.0000	33.0000	700000.00	700000.00	Sale	f2e13e6b-7f64-4730-bcd4-ac55f5076c2f	Ajuste venta V-MPBKSYAL-7W8IHB	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 20:20:41.146	\N	\N	\N
b312d5ef-1c68-43e8-b0e8-ce7246765287	2eab3442-7728-4655-b910-9c052e9fea2d	IN	1.0000	33.0000	34.0000	700000.00	700000.00	Sale	f2e13e6b-7f64-4730-bcd4-ac55f5076c2f	Ajuste venta V-MPBKSYAL-7W8IHB	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 20:27:31.726	\N	\N	\N
5a4be71e-a4d2-4c61-bce4-a660cdea49c0	cd3f9e15-b894-430c-8bc2-afaccc3f6f8f	IN	1.0000	98.0000	99.0000	15000.00	15000.00	Sale	0a631f29-6a76-49d4-a117-7fdb5934194a	Ajuste venta V-MPBKTRG6-630MF9	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 20:28:59.749	\N	\N	\N
66f25e0a-991b-4d86-a421-68d1ac505c90	2eab3442-7728-4655-b910-9c052e9fea2d	OUT	-1.0000	34.0000	33.0000	700000.00	700000.00	Sale	0a631f29-6a76-49d4-a117-7fdb5934194a	Ajuste venta V-MPBKTRG6-630MF9	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 20:30:40.409	\N	\N	\N
ec85fb2f-68d0-4929-b162-5fc09480e2f8	2eab3442-7728-4655-b910-9c052e9fea2d	OUT	-1.0000	33.0000	32.0000	700000.00	700000.00	Sale	f2e13e6b-7f64-4730-bcd4-ac55f5076c2f	Ajuste venta V-MPBKSYAL-7W8IHB	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 20:35:50.528	\N	\N	\N
8ca0f6ba-ee9d-4ed5-8a17-9ac5dc0f5d5a	2eab3442-7728-4655-b910-9c052e9fea2d	OUT	-1.0000	32.0000	31.0000	700000.00	700000.00	Sale	f2e13e6b-7f64-4730-bcd4-ac55f5076c2f	Ajuste venta V-MPBKSYAL-7W8IHB	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 20:36:14.048	\N	\N	\N
82ab20a1-6c57-4b88-8752-d0f4965037f8	2eab3442-7728-4655-b910-9c052e9fea2d	OUT	-1.0000	31.0000	30.0000	700000.00	700000.00	Sale	f2e13e6b-7f64-4730-bcd4-ac55f5076c2f	Ajuste venta V-MPBKSYAL-7W8IHB	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 20:36:38.609	\N	\N	\N
8e511ef1-700a-4e9a-8c38-be02c6d3c677	2eab3442-7728-4655-b910-9c052e9fea2d	IN	1.0000	30.0000	31.0000	700000.00	700000.00	Sale	f2e13e6b-7f64-4730-bcd4-ac55f5076c2f	Ajuste venta V-MPBKSYAL-7W8IHB	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 20:38:19.448	\N	\N	\N
c016fcfa-90b5-4be5-90ad-cf7d53386009	2eab3442-7728-4655-b910-9c052e9fea2d	IN	1.0000	31.0000	32.0000	700000.00	700000.00	Sale	f2e13e6b-7f64-4730-bcd4-ac55f5076c2f	Ajuste venta V-MPBKSYAL-7W8IHB	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 20:40:01.352	\N	\N	\N
a7496c1d-825d-4f8f-b099-43b42a1421be	2eab3442-7728-4655-b910-9c052e9fea2d	IN	1.0000	32.0000	33.0000	700000.00	700000.00	Sale	f2e13e6b-7f64-4730-bcd4-ac55f5076c2f	Ajuste venta V-MPBKSYAL-7W8IHB	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 20:40:36.598	\N	\N	\N
fe30d912-22ef-486c-83cb-67d52cfd8b5f	23142c19-f1e7-43d0-b86e-ed6e3c19a520	ADJUST	30.0000	0.0000	30.0000	2000.00	60000.00	\N	\N	ingreso	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 22:13:20.221	\N	\N	\N
061e1091-f383-45bf-8667-4a3175d4104f	2eab3442-7728-4655-b910-9c052e9fea2d	ADJUST	-31.0000	33.0000	2.0000	600000.00	18600000.00	\N	\N	sss	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 22:14:45.706	\N	\N	\N
3dbe7873-b466-47d9-8f06-22c8c36ea3ba	2eab3442-7728-4655-b910-9c052e9fea2d	ADJUST	38.0000	2.0000	40.0000	600000.00	22800000.00	\N	\N	ssss	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 22:14:56.685	\N	\N	\N
7a097e8c-a3a1-4d5a-ab8a-9ec3e647efa0	d3209abe-585d-4e85-ab26-8ed421df3fb9	ADJUST	20.0000	0.0000	20.0000	2000.00	40000.00	\N	\N	sss	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 22:18:09.055	\N	\N	\N
1d03943f-ee55-4662-9e41-5d96d1bed023	d3209abe-585d-4e85-ab26-8ed421df3fb9	OUT	-10.0000	20.0000	10.0000	5000.00	50000.00	Sale	eec0b8f5-f103-4e7b-8439-1d0835ef299b	Venta POS V-MPBRMUFI-KJ3CVB	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 22:18:31.965	\N	\N	\N
e0aec51b-992e-4bd2-9a51-7c71275b4e75	a645f50f-3fdc-40ff-8427-7b403934b700	ADJUST	40.0000	0.0000	40.0000	30000.00	1200000.00	\N	\N	ingreso	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 22:32:54.958	\N	\N	\N
3ce9a909-68d2-492b-a29b-df9c4fa8a6bc	d3209abe-585d-4e85-ab26-8ed421df3fb9	OUT	-10.0000	10.0000	0.0000	5000.00	50000.00	Sale	e0bd691d-d874-427f-8df9-ed638ebacaa9	Venta POS V-MPBS6OWZ-CAS24W	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 22:33:57.932	\N	\N	\N
61195391-d7fa-45c4-aa6c-cc93e7a9d864	a15a6f9a-8168-4526-a213-e5a7f480f057	ADJUST	100.0000	0.0000	100.0000	500.00	50000.00	\N	\N	agregar	8f8c12c0-5df8-4b39-9b4d-6fde7d23f6cc	2026-05-18 22:57:17.886	\N	\N	\N
36a72dde-0822-433b-b216-3882d23239fd	a15a6f9a-8168-4526-a213-e5a7f480f057	OUT	-5.0000	100.0000	95.0000	1000.00	5000.00	Sale	8918c87e-4c92-4f25-a7db-f029440541c0	Venta POS V-MPBT4DT9-07I4NJ	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 23:00:09.845	\N	\N	\N
6fd4e605-0ff5-40ee-9d42-2b807e58a274	23142c19-f1e7-43d0-b86e-ed6e3c19a520	ADJUST	-25.0000	30.0000	5.0000	2000.00	50000.00	\N	\N	Test notificaciones	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-21 02:05:01.181	\N	\N	\N
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, "userId", title, message, type, "isRead", module, "entityId", "createdAt") FROM stdin;
87cffeab-343c-4ea3-821c-5e45a34f80e8	e7f50ad4-1b4f-4755-9b48-43efbe1a5f8f	Stock bajo: 2143234	tubo PVC\nStock actual: 5 · mínimo: 12. Revisa inventario o realiza una compra.	warning	f	inventory	23142c19-f1e7-43d0-b86e-ed6e3c19a520	2026-05-21 02:05:01.195
55603a1d-b90e-4c1d-872d-48888bd89ccd	8f8c12c0-5df8-4b39-9b4d-6fde7d23f6cc	Stock bajo: 2143234	tubo PVC\nStock actual: 5 · mínimo: 12. Revisa inventario o realiza una compra.	warning	f	inventory	23142c19-f1e7-43d0-b86e-ed6e3c19a520	2026-05-21 02:05:01.195
27cad3af-ccfe-4179-82ac-ecefe3a922da	7d522b83-f005-46be-a3e8-df1f3a51ea50	Stock bajo: 2143234	tubo PVC\nStock actual: 5 · mínimo: 12. Revisa inventario o realiza una compra.	warning	f	inventory	23142c19-f1e7-43d0-b86e-ed6e3c19a520	2026-05-21 02:05:01.195
fba3a438-3ca0-4ec9-8f32-7bdb7dc49952	086c7a33-2f97-46ec-bed3-0ee95ee7a609	Stock bajo: 243543563455	clavos\nStock actual: 0 · mínimo: 2. Revisa inventario o realiza una compra.	warning	f	inventory	d3209abe-585d-4e85-ab26-8ed421df3fb9	2026-05-21 02:21:10.706
355c4ada-abb5-412e-bf8d-e4141c5698f7	086c7a33-2f97-46ec-bed3-0ee95ee7a609	Stock bajo: 2143234	tubo PVC\nStock actual: 5 · mínimo: 12. Revisa inventario o realiza una compra.	warning	f	inventory	23142c19-f1e7-43d0-b86e-ed6e3c19a520	2026-05-21 02:21:10.709
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payments (id, "saleId", method, amount, reference, change, "createdAt") FROM stdin;
d13335d5-d2a1-4d9a-ad02-b53b6bdca33c	b12ccb07-3e1a-4a89-ab03-aedb3f73a43f	CASH	1800.00	\N	0.00	2026-05-12 02:57:08.644
94ac2556-8abd-47bf-8d85-68c3162605c9	37324099-22c8-4c04-a50d-0e46fb5bc626	CASH	5000.00	\N	0.00	2026-05-12 02:58:43.172
16a066db-5f30-41df-89f4-a872860c1525	d8a595a7-5caa-4d6e-8874-f2200035477d	CASH	50000.00	\N	0.00	2026-05-12 02:59:03.871
4f747979-fe28-45a5-a62d-280523d6e093	6794c9e6-172c-496f-aeb3-a4a2cb066d6e	CASH	3000.00	25324	0.00	2026-05-12 03:12:12.9
8b29318c-e80a-4604-a341-dab0c7fceed4	bf9a53a2-cab5-4c83-bfbc-79c5a42f0cec	CASH	699800.00	\N	0.00	2026-05-12 03:12:44.665
fb599594-3a13-4bb9-970f-831f8cca3d3b	e5aa9399-e88e-4c39-bdb4-7f2df52c1a0b	CASH	700000.00	\N	0.00	2026-05-12 04:27:48.158
a94563f7-0d46-43c7-8d6d-7c6b9fbedbc9	07ed7140-cffa-4b9e-8875-90b42cfa9108	CASH	3000.00	\N	0.00	2026-05-12 04:37:13.165
ad692bea-e2ac-4394-849e-60c615e4142b	1ac74cf2-2d25-4034-be8f-fcc810a854c0	CASH	700000.00	\N	0.00	2026-05-12 04:41:52.955
07ed2cbb-4a32-4f62-9707-f3d8e78af8cb	61904e41-b9db-4fa6-a154-e58515c9401e	CASH	20000.00	\N	0.00	2026-05-12 04:50:49.194
6330d887-9329-4c97-a7a0-8121bc93d525	2eb25023-4e96-441f-8378-b6a02dcbdc71	CARD	3000.00	\N	0.00	2026-05-12 21:05:55.806
47140819-e0c5-4a74-b67f-b1faba96622e	ea7257d5-e948-4fcb-8cce-1a0ac20faba5	CASH	700000.00	\N	0.00	2026-05-13 15:59:19.085
407e45ae-641f-4271-a956-2688c6fc8cba	2906c7b3-f0ad-4544-91f8-ff6013d532ca	CASH	0.00	\N	0.00	2026-05-13 16:13:24.29
9224693c-b3f3-4ac6-8cd2-5f40100084e6	311b4c92-d4ab-4507-8def-3d33866875b2	CASH	0.00	\N	0.00	2026-05-13 16:26:49.885
f2d7c951-67a7-47e7-8602-011f12481194	6b0851f1-d8ee-4633-b2cf-c265d8fa62d6	CASH	50000.00	POS CART-MPBIWS26-9BMZPT | Efectivo | estiven | total 2800 | recibido 50000 | cambio 47200 | 18/05/26, 1:14 p. m.	47200.00	2026-05-18 18:14:53.437
7f75d6c9-0665-4c17-afa6-61860f26766b	35e37928-2688-4143-bbea-b2bce0f956fe	CASH	50000.00	Venta manual | Efectivo | 1073478374 — estiven | total 6000 | 1 líneas | recibido 50000 | cambio 44000 | 18/05/26, 1:22	44000.00	2026-05-18 18:23:00.079
eec4809a-7329-4d93-af4d-d8fe8af4a403	39831189-2ceb-42ba-8791-610b46462d7b	CASH	5000.00	POS CART-MPBJF30D-8Q15FU | Efectivo | estiven | total 3000 | recibido 5000 | cambio 2000 | 18/05/26, 1:28 p. m.	2000.00	2026-05-18 18:28:41.097
cf024c39-406e-4cfc-b257-61996a94ade3	eaea5a26-6b42-4ff2-92a0-b36bac03c2fa	CASH	50000.00	POS CART-MPBKHK4I-T2VLV5 | Efectivo | estiven | total 15000 | recibido 50000 | cambio 35000 | 18/05/26, 1:58 p. m.	35000.00	2026-05-18 18:58:42.633
1c07ef19-28b4-43e8-9566-5e40265e0445	18eee202-f1b6-4522-8c92-ce8557d1b5b7	CASH	50000.00	POS CART-MPBKM6LR-J8MN9Y | Efectivo | estiven | total 15000 | recibido 50000 | cambio 35000 | 18/05/26, 2:02 p. m.	35000.00	2026-05-18 19:02:13.996
91a712b3-90cd-4298-b125-d2ca5f2d9523	0a631f29-6a76-49d4-a117-7fdb5934194a	CASH	305000.00	POS CART-MPBKT6IG-GGKTGI | Efectivo | Contado | total 695000 | recibido 1000000 | cambio 305000 | 18/05/26, 2:07 p. m.	305000.00	2026-05-18 19:07:57.373
59faa19c-f8e6-422b-b8b2-4724e2f91001	0a631f29-6a76-49d4-a117-7fdb5934194a	CASH	15000.00	Ajuste: xxxxxx	0.00	2026-05-18 20:04:46.878
37730a53-517c-48da-9216-c44cec5c52be	f2e13e6b-7f64-4730-bcd4-ac55f5076c2f	CASH	0.00	Ajuste: lllll	0.00	2026-05-18 20:35:50.531
118f8c2d-5e5f-41c9-b413-a3a09402eb43	f2e13e6b-7f64-4730-bcd4-ac55f5076c2f	CASH	0.00	Ajuste: jjjjjj	0.00	2026-05-18 20:36:14.05
e1726560-9bfb-440f-8c45-6970625c1170	0a631f29-6a76-49d4-a117-7fdb5934194a	CASH	0.00	Ajuste: sdsad	0.00	2026-05-18 20:05:16.966
a60224a1-b30b-4e66-9a4e-8d1d768fedc6	0a631f29-6a76-49d4-a117-7fdb5934194a	CASH	700000.00	Ajuste: aaa	0.00	2026-05-18 20:30:40.413
5197cbb6-00c2-44e3-8e7e-6fd5f4a2edba	f2e13e6b-7f64-4730-bcd4-ac55f5076c2f	CASH	0.00	Ajuste: asdasdas	0.00	2026-05-18 20:19:54.058
16541277-b9e3-4c79-9d03-046e5fb6500e	f2e13e6b-7f64-4730-bcd4-ac55f5076c2f	CASH	100000.00	POS CART-MPBKS63F-38U4GW | Efectivo | Contado | total 700000 | recibido 800000 | cambio 100000 | 18/05/26, 2:07 p. m.	100000.00	2026-05-18 19:07:19.586
4030006d-7b50-430c-99c1-b823fe2656b6	f2e13e6b-7f64-4730-bcd4-ac55f5076c2f	CASH	0.00	Ajuste: sasdasdas	0.00	2026-05-18 19:55:54.361
14e07fc8-654f-4f69-afe0-07998bfc1425	f2e13e6b-7f64-4730-bcd4-ac55f5076c2f	CASH	0.00	Ajuste: saa	0.00	2026-05-18 20:15:36.944
436388b8-f9e7-4147-ad71-8ca5fcbfcbc6	f2e13e6b-7f64-4730-bcd4-ac55f5076c2f	CASH	15000.00	Ajuste: ssss	0.00	2026-05-18 20:36:38.611
9079e081-4fba-4bb3-b27f-1fa15db57ceb	eec0b8f5-f103-4e7b-8439-1d0835ef299b	CASH	70000.00	POS CART-MPBRMHAD-HV665L | Efectivo | Contado | total 50000 | recibido 70000 | cambio 20000 | 18/05/26, 5:18 p. m.	20000.00	2026-05-18 22:18:31.96
8dc2537c-4ff1-4f5f-8be0-f2b9232bd752	e0bd691d-d874-427f-8df9-ed638ebacaa9	CASH	60000.00	POS CART-MPBS5Z7R-F64GLB | Efectivo | estiven | total 50000 | recibido 60000 | cambio 10000 | 18/05/26, 5:33 p. m.	10000.00	2026-05-18 22:33:57.93
7538dee8-7833-4c92-b3df-95e8278240ea	8918c87e-4c92-4f25-a7db-f029440541c0	CASH	50000.00	POS CART-MPBT2SVB-ZCM9O3 | Efectivo | Contado | total 10000 | recibido 50000 | cambio 40000 | 18/05/26, 6:00 p. m.	40000.00	2026-05-18 23:00:09.843
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.permissions (id, code, name, description, module, "createdAt") FROM stdin;
4ff8e07a-705a-4a4d-9572-5dce089b3074	categories.view	Ver Categorías	Listar y ver categorías	categories	2026-05-12 00:40:18.314
694a4d28-d6eb-48a0-aa2e-f8e5273a9db5	categories.create	Crear Categorías	Crear nuevas categorías	categories	2026-05-12 00:40:18.315
2ec27b75-3a0e-4bbe-846f-f17a3c47c150	categories.update	Editar Categorías	Editar categorías existentes	categories	2026-05-12 00:40:18.315
b12c228e-7a7b-4310-a0ee-43f4bf2f67b0	categories.delete	Eliminar Categorías	Eliminar categorías del sistema	categories	2026-05-12 00:40:18.316
115da17a-b93e-4e55-9368-24313e15a77e	inventory.view	Ver Inventario	Consultar stock e inventario	inventory	2026-05-12 00:40:18.316
12f04e34-6334-4b40-9463-cf534b74a0fb	inventory.adjust	Ajustar Inventario	Realizar ajustes de inventario	inventory	2026-05-12 00:40:18.317
5159c9d3-5281-4fa1-9730-68f66b49d223	kardex.view	Ver Kardex	Consultar movimientos de kardex	kardex	2026-05-12 00:40:18.317
e2e01cff-0019-4de3-aa6a-ee5070343c9f	suppliers.view	Ver Proveedores	Listar y ver proveedores	suppliers	2026-05-12 00:40:18.318
4690839f-d3c6-46d9-810f-ab7dfe238f11	suppliers.create	Crear Proveedores	Crear nuevos proveedores	suppliers	2026-05-12 00:40:18.318
ad6cccc8-cabd-4d02-90ef-39b87c746b44	suppliers.update	Editar Proveedores	Editar proveedores existentes	suppliers	2026-05-12 00:40:18.318
fbcf6172-1a10-4f1d-9e08-b5d3578e5b53	suppliers.delete	Eliminar Proveedores	Eliminar proveedores del sistema	suppliers	2026-05-12 00:40:18.319
5aeb477b-bd17-4231-b221-c26c985bd843	purchases.view	Ver Compras	Listar y ver compras	purchases	2026-05-12 00:40:18.319
1af4b204-e165-4d39-9e09-b8fe7dcf0a91	purchases.create	Crear Compras	Registrar nuevas compras	purchases	2026-05-12 00:40:18.32
cbec48c0-bab6-4f43-87e4-fd15576bb49a	purchases.update	Editar Compras	Editar compras existentes	purchases	2026-05-12 00:40:18.32
df790985-f235-4f90-a837-bcb4853e5975	purchases.delete	Eliminar Compras	Eliminar compras del sistema	purchases	2026-05-12 00:40:18.32
f7e0376e-8436-4f82-a4e1-344d4e56898d	sales.view	Ver Ventas	Listar y ver ventas	sales	2026-05-12 00:40:18.321
f07acc51-5515-4c6c-9b3a-44cdc7daa0ba	sales.create	Crear Ventas	Registrar nuevas ventas	sales	2026-05-12 00:40:18.321
87b25a9e-228a-4e23-b006-1e48cbd6d0bd	sales.cancel	Cancelar Ventas	Cancelar ventas registradas	sales	2026-05-12 00:40:18.321
8cfe0c69-3523-413f-b479-fe84e5872a2a	sales.refund	Reembolsar Ventas	Procesar reembolsos de ventas	sales	2026-05-12 00:40:18.322
d4699172-ea64-4e26-b478-b93f05aac375	pos.access	Acceso POS	Acceso al punto de venta	pos	2026-05-12 00:40:18.322
a56a04b0-c213-4a1e-92f5-137ae3a124ab	pos.apply_discount	Aplicar Descuento POS	Aplicar descuentos en el POS	pos	2026-05-12 00:40:18.323
f1614cf6-b86a-4f2c-aadb-d02e8bf8399d	pos.suspend_sale	Suspender Venta POS	Suspender ventas en el POS	pos	2026-05-12 00:40:18.323
ef1fdf8b-ca96-41ac-9e24-a9c714e71ccf	pos.resume_sale	Reanudar Venta POS	Reanudar ventas suspendidas en el POS	pos	2026-05-12 00:40:18.324
3becb355-601e-4ea4-9e39-012a3b3d24e5	customers.view	Ver Clientes	Listar y ver clientes	customers	2026-05-12 00:40:18.325
05448bf1-fa1c-401e-a904-7b8e1680fe1c	customers.create	Crear Clientes	Crear nuevos clientes	customers	2026-05-12 00:40:18.325
a32e1610-4c89-43d8-9817-9801b1861b09	customers.update	Editar Clientes	Editar clientes existentes	customers	2026-05-12 00:40:18.326
ba61510b-029d-4986-b31d-d9a5fd4b3263	customers.delete	Eliminar Clientes	Eliminar clientes del sistema	customers	2026-05-12 00:40:18.327
17e71cf2-0ed6-4dff-afbb-9511b24ec356	cash_register.open	Abrir Caja	Abrir sesión de caja	cash_register	2026-05-12 00:40:18.327
8652cb6e-6508-4213-a034-3ce2095de8ef	cash_register.close	Cerrar Caja	Cerrar sesión de caja	cash_register	2026-05-12 00:40:18.328
c0b3eb77-b9e0-4e1a-8405-4ce9eb356911	cash_register.movement	Movimientos de Caja	Registrar movimientos de caja	cash_register	2026-05-12 00:40:18.328
1b79cfd3-3c93-4fae-8fa9-3397f01edf72	cash_register.view_all	Ver Todas las Cajas	Ver historial de todas las cajas	cash_register	2026-05-12 00:40:18.329
645192d0-d632-48b8-9e3c-0b339f6ae8ef	invoices.view	Ver Facturas	Listar y ver facturas	invoices	2026-05-12 00:40:18.329
1ac37905-51ac-48ab-b2bf-1737df318441	invoices.create	Crear Facturas	Generar nuevas facturas	invoices	2026-05-12 00:40:18.33
8c223df9-e20f-41d1-b9c1-fd591fa81c93	invoices.generate	Emitir factura electrónica	Emitir FE desde venta (plan matriz)	invoices	2026-05-13 14:47:13.557
52dd4fe9-281c-415b-9159-405f08634768	invoices.cancel	Anular Facturas	Anular facturas emitidas	invoices	2026-05-12 00:40:18.33
310b3a53-dce5-440a-b18c-f6600003029b	invoices.reprint	Reimprimir Facturas	Reimprimir facturas existentes	invoices	2026-05-12 00:40:18.331
df9cffcd-8360-4044-a5ba-4650b892d60e	reports.view	Ver Reportes	Acceso a reportes del sistema	reports	2026-05-12 00:40:18.333
3d854c2d-5325-4903-b750-567d82b67d30	reports.export	Exportar Reportes	Exportar reportes en PDF/Excel	reports	2026-05-12 00:40:18.333
60f00cbb-98c1-4e8e-b9b5-7d073b9258ea	users.view	Ver Usuarios	Listar y ver usuarios	users	2026-05-12 00:40:18.334
026347af-f7f9-40a9-97d2-1e906da63251	users.create	Crear Usuarios	Crear nuevos usuarios	users	2026-05-12 00:40:18.335
4063f011-b3ea-45b8-ac56-5b4087913d5d	users.update	Editar Usuarios	Editar usuarios existentes	users	2026-05-12 00:40:18.336
a18ce64e-8ace-4005-beb1-fb570000ee2c	users.delete	Eliminar Usuarios	Eliminar usuarios del sistema	users	2026-05-12 00:40:18.336
753fa68b-80a8-4950-a72d-387a00d1b55d	roles.view	Ver Roles	Ver roles del sistema	roles	2026-05-12 00:40:18.337
90309814-684c-4919-b12c-461836af564b	roles.manage	Gestionar Roles	Gestionar permisos de roles	roles	2026-05-12 00:40:18.338
3c91cc2d-1877-4d1e-b13d-60782338a5c8	settings.view	Ver Configuración	Ver configuración del sistema	settings	2026-05-12 00:40:18.339
9e83f347-40fd-4b9f-a34e-6dd7c0b5a58c	settings.update	Editar Configuración	Modificar configuración del sistema	settings	2026-05-12 00:40:18.34
b39e6399-af65-486d-9e01-f93f486d1ff5	backups.create	Crear Backup	Crear respaldos del sistema	backups	2026-05-12 00:40:18.341
b214bafd-5398-4ff6-8009-a1261d40064c	backups.restore	Restaurar Backup	Restaurar respaldos del sistema	backups	2026-05-12 00:40:18.342
45baa681-c29d-4b6e-a5ed-a7ad55bec949	documents.view	Ver Documentos	Ver documentos del sistema	documents	2026-05-12 00:40:18.342
46cae870-0431-45aa-af0c-cf3869a13d57	products.view	Ver Productos	Listar y ver detalle de productos	products	2026-05-12 00:40:18.312
d8030766-e836-40a1-aca4-b4966a504697	products.create	Crear Productos	Crear nuevos productos	products	2026-05-12 00:40:18.313
fe2d5e04-e860-4fdd-92ae-9c8e229de108	products.update	Editar Productos	Editar productos existentes	products	2026-05-12 00:40:18.313
6da07ffa-1ced-4c9e-bc45-c50c3fc99b41	products.delete	Eliminar Productos	Eliminar productos del sistema	products	2026-05-12 00:40:18.314
d49cb27a-699c-4c87-b418-41be9e69023c	cash_register.manage	Ajustar Caja (admin)	Corregir sesiones y movimientos de caja	cash_register	2026-05-18 19:15:30.827
6182463e-b26e-4a3b-b72d-6d593dc73c57	invoices.config	Configurar Facturación	Configurar numeración y resoluciones	invoices	2026-05-12 00:40:18.332
80651f83-339d-480a-bb24-580e94753479	audit.view	Ver Auditoría	Consultar registros de auditoría	audit	2026-05-12 00:40:18.338
93efcd32-2121-48c3-98c9-4de07bb228e7	audit.export	Exportar Auditoría	Exportar informe de auditoría para revisión legal (CSV/PDF)	audit	2026-05-18 21:21:38.1
60c1d337-17eb-47cb-8e43-c0dad44018af	documents.upload	Subir Documentos	Subir documentos al sistema	documents	2026-05-12 00:40:18.342
7424aff0-3846-4e9b-bb93-4f0f32d2c361	documents.delete	Eliminar Documentos	Eliminar documentos del sistema	documents	2026-05-12 00:40:18.344
813e00bd-021e-44d1-a5e3-0f7f1012c62d	notifications.view	Ver Notificaciones	Ver y gestionar la bandeja de notificaciones propias	notifications	2026-05-12 14:54:38.56
542e15e9-4c7d-4bc0-b5b1-28a4ee5be919	monitoring.view	Ver Monitoreo	Acceso al panel de monitoreo Netdata	monitoring	2026-05-12 00:40:18.344
7d26dd0d-8e5f-4276-b445-68833ecc19b4	dashboard.view	Ver Dashboard	Acceso al dashboard principal	dashboard	2026-05-12 00:40:18.309
de222d9c-5fa5-416d-8356-4da61f15bfa8	dashboard.view_analytics	Ver Analíticas	Acceso a analíticas y métricas avanzadas	dashboard	2026-05-12 00:40:18.311
ac3394ee-e597-440d-b705-e02076cb387a	sales.adjust	Ajustar Ventas	Corregir líneas de ventas (caja cerrada)	sales	2026-05-18 19:35:19.587
\.


--
-- Data for Name: product_alternate_units; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.product_alternate_units (id, "productId", "unitOfMeasureId", "factorToBase", label, "sortOrder", "createdAt") FROM stdin;
d2a0288c-d305-4cc3-8361-e6534f0b4b20	a15a6f9a-8168-4526-a213-e5a7f480f057	uom-cm	0.500000	\N	1	2026-05-21 00:18:19.349
506ef94c-3cdd-455b-bd23-4c71e0df28d1	a645f50f-3fdc-40ff-8427-7b403934b700	uom-un	0.100000	\N	1	2026-05-21 00:18:19.349
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.products (id, sku, barcode, name, description, "categoryId", "costPrice", "salePrice", "taxRate", "minStock", "maxStock", "imageUrl", "isActive", "createdAt", "updatedAt", "unitOfMeasureId", "measureDetail", "contentPerUnit", "contentUnitId") FROM stdin;
a5d45022-eafa-4fd9-a4bc-91459d501081	223	43534534	Go 4	PARLANTE	0d56fc57-cadb-40fe-af2c-f938a792d95a	2000.00	3000.00	0.00	0.0000	10.0000	\N	t	2026-05-12 02:11:04.289	2026-05-12 02:17:12.743	uom-un	\N	\N	\N
2eab3442-7728-4655-b910-9c052e9fea2d	2332345	984568457	Xtream 5	\N	0d56fc57-cadb-40fe-af2c-f938a792d95a	600000.00	700000.00	0.00	0.0000	40.0000	\N	t	2026-05-12 02:27:11.482	2026-05-12 02:27:11.482	uom-un	\N	\N	\N
23142c19-f1e7-43d0-b86e-ed6e3c19a520	2143234	3453452	tubo PVC	\N	0d56fc57-cadb-40fe-af2c-f938a792d95a	2000.00	3000.00	0.00	12.0000	30.0000	\N	t	2026-05-18 22:08:28.613	2026-05-18 22:12:41.742	uom-cj	2	\N	\N
d3209abe-585d-4e85-ab26-8ed421df3fb9	243543563455	2345235423	clavos	\N	1e19bba2-82d6-44f0-88ae-ee49aa472c3c	2000.00	5000.00	0.00	2.0000	30.0000	\N	t	2026-05-18 22:16:20.349	2026-05-18 22:16:20.349	uom-cm	5	\N	\N
cd3f9e15-b894-430c-8bc2-afaccc3f6f8f	DEMO-001	\N	Producto de demostración	\N	1e19bba2-82d6-44f0-88ae-ee49aa472c3c	10000.00	15000.00	0.00	0.0000	1000.0000	\N	t	2026-05-12 14:54:38.91	2026-05-18 22:17:22.345	uom-un	\N	\N	\N
a645f50f-3fdc-40ff-8427-7b403934b700	1232143234	345463456	tubo PVC	\N	0d56fc57-cadb-40fe-af2c-f938a792d95a	30000.00	50000.00	0.00	2.0000	10.0000	\N	t	2026-05-18 22:32:37.432	2026-05-18 22:32:37.432	uom-cm	10	10.0000	uom-un
a15a6f9a-8168-4526-a213-e5a7f480f057	38483443	234992342	LIJA	\N	1e19bba2-82d6-44f0-88ae-ee49aa472c3c	500.00	1000.00	0.00	2.0000	999.0000	\N	t	2026-05-18 22:56:39.256	2026-05-18 22:56:39.256	uom-un	\N	2.0000	uom-cm
\.


--
-- Data for Name: purchase_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.purchase_items (id, "purchaseId", "productId", quantity, "unitCost", "taxRate", subtotal, "baseQuantity", "purchaseUnitId") FROM stdin;
9b56ee5b-0a5d-41f6-bec5-07173e6eca12	4d1033e7-f89f-40c2-b17c-1d004b9498c9	a5d45022-eafa-4fd9-a4bc-91459d501081	1.0000	2000.00	0.00	2000.00	1.0000	\N
\.


--
-- Data for Name: purchases; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.purchases (id, "supplierId", number, date, subtotal, "taxTotal", total, status, notes, "userId", "createdAt", "updatedAt") FROM stdin;
4d1033e7-f89f-40c2-b17c-1d004b9498c9	b0be3f4a-60e2-4e5f-9641-b19f39e608b9	OC-MP219EAB-7N3AA0	2026-05-12 12:00:00	2000.00	0.00	2000.00	RECEIVED	sdas	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-12 02:50:18.902	2026-05-12 02:50:34.356
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.role_permissions (id, "roleId", "permissionId", "assignedAt") FROM stdin;
23048bd2-1afb-44b1-ad4b-22c6cc2a0499	f4d40c98-f955-4565-b135-d96cdb5c5c4c	7d26dd0d-8e5f-4276-b445-68833ecc19b4	2026-05-12 00:40:18.345
9b193451-7ec0-4cf2-8053-ef5dc622b787	4af902e0-a9a1-4edb-a2bf-cd2295ab3ecc	7d26dd0d-8e5f-4276-b445-68833ecc19b4	2026-05-12 00:40:18.349
1562a65e-9639-4d8d-b6c0-89a04c400d26	7b2f97e5-a88f-446a-8d20-69ad72235192	7d26dd0d-8e5f-4276-b445-68833ecc19b4	2026-05-12 00:40:18.351
6f993aca-f5c4-47d3-8e87-9e85c5f3a47e	f4d40c98-f955-4565-b135-d96cdb5c5c4c	de222d9c-5fa5-416d-8356-4da61f15bfa8	2026-05-12 00:40:18.353
ccbfb2ec-ca74-46e5-8b06-ad5f2d0c2a7f	4af902e0-a9a1-4edb-a2bf-cd2295ab3ecc	de222d9c-5fa5-416d-8356-4da61f15bfa8	2026-05-12 00:40:18.355
cf9dd55a-47f7-4c28-b551-807c4e8b69c1	f4d40c98-f955-4565-b135-d96cdb5c5c4c	46cae870-0431-45aa-af0c-cf3869a13d57	2026-05-12 00:40:18.356
90ac4259-0320-40c7-a9f8-6c84853a9261	4af902e0-a9a1-4edb-a2bf-cd2295ab3ecc	46cae870-0431-45aa-af0c-cf3869a13d57	2026-05-12 00:40:18.357
5035e631-48eb-4215-94cf-0020618007d2	7b2f97e5-a88f-446a-8d20-69ad72235192	46cae870-0431-45aa-af0c-cf3869a13d57	2026-05-12 00:40:18.358
f3a9199a-e6b8-47d0-aa7e-ab62ccefcc5c	f4d40c98-f955-4565-b135-d96cdb5c5c4c	d8030766-e836-40a1-aca4-b4966a504697	2026-05-12 00:40:18.359
f561aeae-82ec-4385-a673-c0f52ca6b750	4af902e0-a9a1-4edb-a2bf-cd2295ab3ecc	d8030766-e836-40a1-aca4-b4966a504697	2026-05-12 00:40:18.361
929ed557-3659-4464-9c74-01fcefbd7253	f4d40c98-f955-4565-b135-d96cdb5c5c4c	fe2d5e04-e860-4fdd-92ae-9c8e229de108	2026-05-12 00:40:18.362
99a5e2d1-7fde-40eb-a853-d811cf014b03	4af902e0-a9a1-4edb-a2bf-cd2295ab3ecc	fe2d5e04-e860-4fdd-92ae-9c8e229de108	2026-05-12 00:40:18.363
c0229256-8e61-438b-8815-f89266de2663	f4d40c98-f955-4565-b135-d96cdb5c5c4c	6da07ffa-1ced-4c9e-bc45-c50c3fc99b41	2026-05-12 00:40:18.364
df08591d-eb01-45aa-9ce4-3f38c0afac21	f4d40c98-f955-4565-b135-d96cdb5c5c4c	4ff8e07a-705a-4a4d-9572-5dce089b3074	2026-05-12 00:40:18.365
d624ca44-98d0-4aaa-8dfc-7732ffb15c82	4af902e0-a9a1-4edb-a2bf-cd2295ab3ecc	4ff8e07a-705a-4a4d-9572-5dce089b3074	2026-05-12 00:40:18.366
d76f64a5-5368-4266-a849-085a8313868c	7b2f97e5-a88f-446a-8d20-69ad72235192	4ff8e07a-705a-4a4d-9572-5dce089b3074	2026-05-12 00:40:18.367
b1bf673c-eccd-4fa8-af7a-c2a1a2dc57b8	f4d40c98-f955-4565-b135-d96cdb5c5c4c	694a4d28-d6eb-48a0-aa2e-f8e5273a9db5	2026-05-12 00:40:18.369
cd9e90b8-94cd-4948-85e4-72576b31fe6b	4af902e0-a9a1-4edb-a2bf-cd2295ab3ecc	694a4d28-d6eb-48a0-aa2e-f8e5273a9db5	2026-05-12 00:40:18.37
d02b9831-555a-4db4-b437-bfed5299cd9b	f4d40c98-f955-4565-b135-d96cdb5c5c4c	2ec27b75-3a0e-4bbe-846f-f17a3c47c150	2026-05-12 00:40:18.37
021719ee-7907-4aaf-96cb-f5c4f18517a2	4af902e0-a9a1-4edb-a2bf-cd2295ab3ecc	2ec27b75-3a0e-4bbe-846f-f17a3c47c150	2026-05-12 00:40:18.371
6e524baa-e20b-475c-854c-14ac66679540	f4d40c98-f955-4565-b135-d96cdb5c5c4c	b12c228e-7a7b-4310-a0ee-43f4bf2f67b0	2026-05-12 00:40:18.372
f91244b6-1257-487b-9a7a-4ff623ae9e2b	f4d40c98-f955-4565-b135-d96cdb5c5c4c	115da17a-b93e-4e55-9368-24313e15a77e	2026-05-12 00:40:18.373
1baf25e3-4c0a-4fec-a0a2-a6e6b35011b1	4af902e0-a9a1-4edb-a2bf-cd2295ab3ecc	115da17a-b93e-4e55-9368-24313e15a77e	2026-05-12 00:40:18.374
506cd3df-6389-468c-aaff-5116ba961892	7b2f97e5-a88f-446a-8d20-69ad72235192	115da17a-b93e-4e55-9368-24313e15a77e	2026-05-12 00:40:18.374
594199ba-fb6c-48bf-bfc3-ea323e50e95b	f4d40c98-f955-4565-b135-d96cdb5c5c4c	12f04e34-6334-4b40-9463-cf534b74a0fb	2026-05-12 00:40:18.375
62815da2-a754-42a5-be4c-08955a1fb408	4af902e0-a9a1-4edb-a2bf-cd2295ab3ecc	12f04e34-6334-4b40-9463-cf534b74a0fb	2026-05-12 00:40:18.376
a5900e29-0107-4e85-8af4-a481129a564d	f4d40c98-f955-4565-b135-d96cdb5c5c4c	5159c9d3-5281-4fa1-9730-68f66b49d223	2026-05-12 00:40:18.377
6718c8c9-adff-49bb-be70-054b420b9e32	4af902e0-a9a1-4edb-a2bf-cd2295ab3ecc	5159c9d3-5281-4fa1-9730-68f66b49d223	2026-05-12 00:40:18.377
cb6cde8d-2611-4800-bbdc-5827c8047bb9	f4d40c98-f955-4565-b135-d96cdb5c5c4c	e2e01cff-0019-4de3-aa6a-ee5070343c9f	2026-05-12 00:40:18.378
a3cf60b2-2114-455a-bdb8-9dc3d865bbc3	4af902e0-a9a1-4edb-a2bf-cd2295ab3ecc	e2e01cff-0019-4de3-aa6a-ee5070343c9f	2026-05-12 00:40:18.379
b367f6ba-78db-4370-995c-13b489f516cb	f4d40c98-f955-4565-b135-d96cdb5c5c4c	4690839f-d3c6-46d9-810f-ab7dfe238f11	2026-05-12 00:40:18.38
5a79fc08-24d5-4b76-be02-5340fd67e5d6	4af902e0-a9a1-4edb-a2bf-cd2295ab3ecc	4690839f-d3c6-46d9-810f-ab7dfe238f11	2026-05-12 00:40:18.381
48e638b6-ca39-4e55-aafc-1361fd2aec3e	f4d40c98-f955-4565-b135-d96cdb5c5c4c	ad6cccc8-cabd-4d02-90ef-39b87c746b44	2026-05-12 00:40:18.382
b21e2442-9005-4108-b604-eabf3c9290f4	4af902e0-a9a1-4edb-a2bf-cd2295ab3ecc	ad6cccc8-cabd-4d02-90ef-39b87c746b44	2026-05-12 00:40:18.383
04a96743-bd6a-4462-b0b0-e9946dd62c2a	f4d40c98-f955-4565-b135-d96cdb5c5c4c	fbcf6172-1a10-4f1d-9e08-b5d3578e5b53	2026-05-12 00:40:18.384
b019713d-518f-47ac-b411-3b6c3943d0af	f4d40c98-f955-4565-b135-d96cdb5c5c4c	5aeb477b-bd17-4231-b221-c26c985bd843	2026-05-12 00:40:18.384
9983a0ef-f9c3-4837-a7b8-d3aa0612b83a	4af902e0-a9a1-4edb-a2bf-cd2295ab3ecc	5aeb477b-bd17-4231-b221-c26c985bd843	2026-05-12 00:40:18.385
27ff2a36-b2a9-4573-8fb4-3b36d2dbb5f9	f4d40c98-f955-4565-b135-d96cdb5c5c4c	1af4b204-e165-4d39-9e09-b8fe7dcf0a91	2026-05-12 00:40:18.386
65952e4f-50b3-4790-9df7-df058682f589	4af902e0-a9a1-4edb-a2bf-cd2295ab3ecc	1af4b204-e165-4d39-9e09-b8fe7dcf0a91	2026-05-12 00:40:18.387
a51c6c4b-094d-473f-ba4d-435c51f90c57	f4d40c98-f955-4565-b135-d96cdb5c5c4c	cbec48c0-bab6-4f43-87e4-fd15576bb49a	2026-05-12 00:40:18.388
2e2a279e-fcd5-4250-9fca-c9f0868536db	4af902e0-a9a1-4edb-a2bf-cd2295ab3ecc	cbec48c0-bab6-4f43-87e4-fd15576bb49a	2026-05-12 00:40:18.388
1b40b704-fa81-481c-a520-8f227de0ae7b	f4d40c98-f955-4565-b135-d96cdb5c5c4c	df790985-f235-4f90-a837-bcb4853e5975	2026-05-12 00:40:18.391
63716a7b-4eec-4942-9527-07f13e571ddf	f4d40c98-f955-4565-b135-d96cdb5c5c4c	f7e0376e-8436-4f82-a4e1-344d4e56898d	2026-05-12 00:40:18.392
463dc709-7753-4c84-bd69-b094d4e43b7f	4af902e0-a9a1-4edb-a2bf-cd2295ab3ecc	f7e0376e-8436-4f82-a4e1-344d4e56898d	2026-05-12 00:40:18.394
74a4f0e5-0736-4799-a4f2-b57092de3b58	7b2f97e5-a88f-446a-8d20-69ad72235192	f7e0376e-8436-4f82-a4e1-344d4e56898d	2026-05-12 00:40:18.396
eed14fa4-981f-47d1-bba5-d1ad3754e41d	f4d40c98-f955-4565-b135-d96cdb5c5c4c	f07acc51-5515-4c6c-9b3a-44cdc7daa0ba	2026-05-12 00:40:18.397
6b1b639b-9b8a-48d3-ab23-640a68162674	4af902e0-a9a1-4edb-a2bf-cd2295ab3ecc	f07acc51-5515-4c6c-9b3a-44cdc7daa0ba	2026-05-12 00:40:18.398
fc816b07-0327-4196-b6bb-6f499c2d9069	7b2f97e5-a88f-446a-8d20-69ad72235192	f07acc51-5515-4c6c-9b3a-44cdc7daa0ba	2026-05-12 00:40:18.399
bbabb5c2-4d7d-48e8-971b-ce3b9b58817a	f4d40c98-f955-4565-b135-d96cdb5c5c4c	87b25a9e-228a-4e23-b006-1e48cbd6d0bd	2026-05-12 00:40:18.399
7baab14a-b463-496a-9550-b0a678ce463e	4af902e0-a9a1-4edb-a2bf-cd2295ab3ecc	87b25a9e-228a-4e23-b006-1e48cbd6d0bd	2026-05-12 00:40:18.4
2e0982f2-af01-40a7-aa98-ada5454b4093	f4d40c98-f955-4565-b135-d96cdb5c5c4c	8cfe0c69-3523-413f-b479-fe84e5872a2a	2026-05-12 00:40:18.401
bc9b818d-4d47-45aa-9906-1da81bd290bc	f4d40c98-f955-4565-b135-d96cdb5c5c4c	d4699172-ea64-4e26-b478-b93f05aac375	2026-05-12 00:40:18.402
c70dc9e5-965f-4b92-b5b0-0d38388ec4a3	4af902e0-a9a1-4edb-a2bf-cd2295ab3ecc	d4699172-ea64-4e26-b478-b93f05aac375	2026-05-12 00:40:18.403
46166211-e00e-479c-813b-4ae1dad2bf75	7b2f97e5-a88f-446a-8d20-69ad72235192	d4699172-ea64-4e26-b478-b93f05aac375	2026-05-12 00:40:18.404
238ab01f-a8d7-4901-a497-702a0821a5fd	f4d40c98-f955-4565-b135-d96cdb5c5c4c	a56a04b0-c213-4a1e-92f5-137ae3a124ab	2026-05-12 00:40:18.405
77ac47c5-37db-4ffa-bf52-e69ea3c394e0	4af902e0-a9a1-4edb-a2bf-cd2295ab3ecc	a56a04b0-c213-4a1e-92f5-137ae3a124ab	2026-05-12 00:40:18.405
57a0bbc9-2df6-4d83-99a7-3771f77883f6	f4d40c98-f955-4565-b135-d96cdb5c5c4c	f1614cf6-b86a-4f2c-aadb-d02e8bf8399d	2026-05-12 00:40:18.407
1b9241fe-fa83-4b99-a96e-5a02388221dd	4af902e0-a9a1-4edb-a2bf-cd2295ab3ecc	f1614cf6-b86a-4f2c-aadb-d02e8bf8399d	2026-05-12 00:40:18.408
095a02b6-3920-4009-beb1-5fdf801462b4	7b2f97e5-a88f-446a-8d20-69ad72235192	f1614cf6-b86a-4f2c-aadb-d02e8bf8399d	2026-05-12 00:40:18.409
055e5315-e9d1-4d97-aacd-96d04e707047	f4d40c98-f955-4565-b135-d96cdb5c5c4c	ef1fdf8b-ca96-41ac-9e24-a9c714e71ccf	2026-05-12 00:40:18.41
e7d5e3e9-69e2-45c0-9db5-bc81c563479d	4af902e0-a9a1-4edb-a2bf-cd2295ab3ecc	ef1fdf8b-ca96-41ac-9e24-a9c714e71ccf	2026-05-12 00:40:18.411
34bfc9b7-c67b-471c-b2f1-521b989c3820	7b2f97e5-a88f-446a-8d20-69ad72235192	ef1fdf8b-ca96-41ac-9e24-a9c714e71ccf	2026-05-12 00:40:18.412
17c458b7-1c8e-4b2d-87ea-bd8225137945	f4d40c98-f955-4565-b135-d96cdb5c5c4c	3becb355-601e-4ea4-9e39-012a3b3d24e5	2026-05-12 00:40:18.413
f164e70e-e658-4899-a0ba-df672a8c37df	4af902e0-a9a1-4edb-a2bf-cd2295ab3ecc	3becb355-601e-4ea4-9e39-012a3b3d24e5	2026-05-12 00:40:18.414
b05f5aa9-8dec-40c5-9b0c-d28cef4b2ba6	7b2f97e5-a88f-446a-8d20-69ad72235192	3becb355-601e-4ea4-9e39-012a3b3d24e5	2026-05-12 00:40:18.415
aa3148f9-a4da-45ff-a396-d90af54cbaa5	f4d40c98-f955-4565-b135-d96cdb5c5c4c	05448bf1-fa1c-401e-a904-7b8e1680fe1c	2026-05-12 00:40:18.416
42ea778e-24c2-4bfc-ae43-c5c3face56d5	4af902e0-a9a1-4edb-a2bf-cd2295ab3ecc	05448bf1-fa1c-401e-a904-7b8e1680fe1c	2026-05-12 00:40:18.417
531c7ad9-4e24-41f2-bd45-7cbda7edbde6	7b2f97e5-a88f-446a-8d20-69ad72235192	05448bf1-fa1c-401e-a904-7b8e1680fe1c	2026-05-12 00:40:18.418
37af8350-4cd8-4d2c-8109-cd1799269382	f4d40c98-f955-4565-b135-d96cdb5c5c4c	a32e1610-4c89-43d8-9817-9801b1861b09	2026-05-12 00:40:18.419
1e34b7e4-3cb0-4b99-92b0-090ee66b66c1	4af902e0-a9a1-4edb-a2bf-cd2295ab3ecc	a32e1610-4c89-43d8-9817-9801b1861b09	2026-05-12 00:40:18.419
506800a5-bad1-47f2-96cd-41ee6c78ad0f	f4d40c98-f955-4565-b135-d96cdb5c5c4c	ba61510b-029d-4986-b31d-d9a5fd4b3263	2026-05-12 00:40:18.42
df2cad95-6cc5-4e1d-93f8-645ff2424606	f4d40c98-f955-4565-b135-d96cdb5c5c4c	17e71cf2-0ed6-4dff-afbb-9511b24ec356	2026-05-12 00:40:18.421
3f3f8410-b612-4a37-bb88-ada62baec72d	4af902e0-a9a1-4edb-a2bf-cd2295ab3ecc	17e71cf2-0ed6-4dff-afbb-9511b24ec356	2026-05-12 00:40:18.422
e62f6eb3-5e9a-4b3b-ab1d-b4b0905c6e01	7b2f97e5-a88f-446a-8d20-69ad72235192	17e71cf2-0ed6-4dff-afbb-9511b24ec356	2026-05-12 00:40:18.423
8179a0f7-4d6e-4a97-903b-e8f8283b180e	f4d40c98-f955-4565-b135-d96cdb5c5c4c	8652cb6e-6508-4213-a034-3ce2095de8ef	2026-05-12 00:40:18.424
bca53b05-baed-44ea-af1b-8e37137f8eda	4af902e0-a9a1-4edb-a2bf-cd2295ab3ecc	8652cb6e-6508-4213-a034-3ce2095de8ef	2026-05-12 00:40:18.424
cf9c3b21-e382-45f7-a099-95bf7606eacb	7b2f97e5-a88f-446a-8d20-69ad72235192	8652cb6e-6508-4213-a034-3ce2095de8ef	2026-05-12 00:40:18.425
aba19704-86ab-49bc-9f30-f511c0a42f29	f4d40c98-f955-4565-b135-d96cdb5c5c4c	c0b3eb77-b9e0-4e1a-8405-4ce9eb356911	2026-05-12 00:40:18.426
a6cc2b38-c7cd-4a0b-808d-4eaa0eeb6801	4af902e0-a9a1-4edb-a2bf-cd2295ab3ecc	c0b3eb77-b9e0-4e1a-8405-4ce9eb356911	2026-05-12 00:40:18.427
5a0c0e6c-0298-470f-b466-d692a309c75b	7b2f97e5-a88f-446a-8d20-69ad72235192	c0b3eb77-b9e0-4e1a-8405-4ce9eb356911	2026-05-12 00:40:18.428
bb8ae49f-06b9-4995-9657-8ade660e62b5	f4d40c98-f955-4565-b135-d96cdb5c5c4c	1b79cfd3-3c93-4fae-8fa9-3397f01edf72	2026-05-12 00:40:18.429
72fa6f36-f737-4edb-8240-7b99f56bc16f	4af902e0-a9a1-4edb-a2bf-cd2295ab3ecc	1b79cfd3-3c93-4fae-8fa9-3397f01edf72	2026-05-12 00:40:18.429
77c08845-3a83-4199-a99a-eb5c439532a5	f4d40c98-f955-4565-b135-d96cdb5c5c4c	645192d0-d632-48b8-9e3c-0b339f6ae8ef	2026-05-12 00:40:18.43
5e3af65c-e0aa-4c94-b617-dfe09dc5118c	4af902e0-a9a1-4edb-a2bf-cd2295ab3ecc	645192d0-d632-48b8-9e3c-0b339f6ae8ef	2026-05-12 00:40:18.431
a30fc397-81a5-4d22-baaf-128e39c7fa94	7b2f97e5-a88f-446a-8d20-69ad72235192	645192d0-d632-48b8-9e3c-0b339f6ae8ef	2026-05-12 00:40:18.432
4e90e578-8386-4945-83d5-5e8b30841ea0	f4d40c98-f955-4565-b135-d96cdb5c5c4c	1ac37905-51ac-48ab-b2bf-1737df318441	2026-05-12 00:40:18.433
3d6b2ac8-62aa-4d4d-8f12-7e2fef49bdf3	4af902e0-a9a1-4edb-a2bf-cd2295ab3ecc	1ac37905-51ac-48ab-b2bf-1737df318441	2026-05-12 00:40:18.434
a8047046-9233-4470-97e3-6a10904c3c62	7b2f97e5-a88f-446a-8d20-69ad72235192	1ac37905-51ac-48ab-b2bf-1737df318441	2026-05-12 00:40:18.434
ae763721-be22-49d3-bf5d-71fd17dedabe	f4d40c98-f955-4565-b135-d96cdb5c5c4c	52dd4fe9-281c-415b-9159-405f08634768	2026-05-12 00:40:18.435
58794165-d8b5-4bf7-8383-306fcca6be21	4af902e0-a9a1-4edb-a2bf-cd2295ab3ecc	52dd4fe9-281c-415b-9159-405f08634768	2026-05-12 00:40:18.437
8e8eb36b-6147-43f5-a8d3-7fb61945cbed	f4d40c98-f955-4565-b135-d96cdb5c5c4c	310b3a53-dce5-440a-b18c-f6600003029b	2026-05-12 00:40:18.437
e63eb2c3-3f03-4637-8efd-ab71c7d9f740	4af902e0-a9a1-4edb-a2bf-cd2295ab3ecc	310b3a53-dce5-440a-b18c-f6600003029b	2026-05-12 00:40:18.438
4932f965-f054-46c4-90eb-d03ba4574ce7	7b2f97e5-a88f-446a-8d20-69ad72235192	310b3a53-dce5-440a-b18c-f6600003029b	2026-05-12 00:40:18.439
612f9f5c-8007-43dc-85a1-81fe8a4c7b38	f4d40c98-f955-4565-b135-d96cdb5c5c4c	6182463e-b26e-4a3b-b72d-6d593dc73c57	2026-05-12 00:40:18.44
71901a91-90ae-40c8-8ca5-159ec58df43d	f4d40c98-f955-4565-b135-d96cdb5c5c4c	df9cffcd-8360-4044-a5ba-4650b892d60e	2026-05-12 00:40:18.44
18720642-551b-487a-a952-163381a2b7b1	4af902e0-a9a1-4edb-a2bf-cd2295ab3ecc	df9cffcd-8360-4044-a5ba-4650b892d60e	2026-05-12 00:40:18.441
fe82b7d4-37a4-408f-a66c-2f483c4a5c7f	f4d40c98-f955-4565-b135-d96cdb5c5c4c	3d854c2d-5325-4903-b750-567d82b67d30	2026-05-12 00:40:18.442
6baf1a32-0718-4fa8-9947-50a500894d7c	4af902e0-a9a1-4edb-a2bf-cd2295ab3ecc	3d854c2d-5325-4903-b750-567d82b67d30	2026-05-12 00:40:18.443
c88a07e1-9ab0-4001-bfd4-9993d1bdd239	f4d40c98-f955-4565-b135-d96cdb5c5c4c	60f00cbb-98c1-4e8e-b9b5-7d073b9258ea	2026-05-12 00:40:18.444
0982897b-d80d-4239-b199-3a855ba5b448	4af902e0-a9a1-4edb-a2bf-cd2295ab3ecc	60f00cbb-98c1-4e8e-b9b5-7d073b9258ea	2026-05-12 00:40:18.445
51b5d263-7278-4ef9-8444-976bebb841cb	f4d40c98-f955-4565-b135-d96cdb5c5c4c	026347af-f7f9-40a9-97d2-1e906da63251	2026-05-12 00:40:18.446
b87bbdcf-c639-489f-a872-88fdc4e4e42b	f4d40c98-f955-4565-b135-d96cdb5c5c4c	4063f011-b3ea-45b8-ac56-5b4087913d5d	2026-05-12 00:40:18.447
25c3ddf1-605a-44e2-8837-7676233fa428	f4d40c98-f955-4565-b135-d96cdb5c5c4c	a18ce64e-8ace-4005-beb1-fb570000ee2c	2026-05-12 00:40:18.448
87122cd6-ac49-475d-9423-203dc570feb5	f4d40c98-f955-4565-b135-d96cdb5c5c4c	753fa68b-80a8-4950-a72d-387a00d1b55d	2026-05-12 00:40:18.448
4620136b-b6e9-4a76-b181-fd4ea70064f2	f4d40c98-f955-4565-b135-d96cdb5c5c4c	90309814-684c-4919-b12c-461836af564b	2026-05-12 00:40:18.449
87571b50-d67d-45aa-8c9b-2eb709f98307	f4d40c98-f955-4565-b135-d96cdb5c5c4c	80651f83-339d-480a-bb24-580e94753479	2026-05-12 00:40:18.45
751bc44a-bf8b-40c9-a959-5f39de6f2a86	4af902e0-a9a1-4edb-a2bf-cd2295ab3ecc	80651f83-339d-480a-bb24-580e94753479	2026-05-12 00:40:18.451
b41da3bd-44c2-406f-bd51-44459bb03f02	f4d40c98-f955-4565-b135-d96cdb5c5c4c	3c91cc2d-1877-4d1e-b13d-60782338a5c8	2026-05-12 00:40:18.452
08c59223-d166-4bdd-b53a-753c74d45351	4af902e0-a9a1-4edb-a2bf-cd2295ab3ecc	3c91cc2d-1877-4d1e-b13d-60782338a5c8	2026-05-12 00:40:18.452
015dc289-8ee7-4a58-bc12-5e90efea9fc3	f4d40c98-f955-4565-b135-d96cdb5c5c4c	9e83f347-40fd-4b9f-a34e-6dd7c0b5a58c	2026-05-12 00:40:18.453
8ad5c6fc-9012-441a-af44-5ff07985cb25	f4d40c98-f955-4565-b135-d96cdb5c5c4c	b39e6399-af65-486d-9e01-f93f486d1ff5	2026-05-12 00:40:18.454
9683496c-cc6d-4249-b38f-bd9f2e31dfba	f4d40c98-f955-4565-b135-d96cdb5c5c4c	b214bafd-5398-4ff6-8009-a1261d40064c	2026-05-12 00:40:18.455
6d58cf9c-32c8-412b-a780-942a52bb9c4d	f4d40c98-f955-4565-b135-d96cdb5c5c4c	45baa681-c29d-4b6e-a5ed-a7ad55bec949	2026-05-12 00:40:18.456
83f49982-8a14-4293-953b-c13946827384	4af902e0-a9a1-4edb-a2bf-cd2295ab3ecc	45baa681-c29d-4b6e-a5ed-a7ad55bec949	2026-05-12 00:40:18.457
3dbf00f2-1784-4b9d-9f54-42da88ecce36	7b2f97e5-a88f-446a-8d20-69ad72235192	45baa681-c29d-4b6e-a5ed-a7ad55bec949	2026-05-12 00:40:18.457
d1223a34-8b79-48ae-8e22-5ca5b3e9536e	f4d40c98-f955-4565-b135-d96cdb5c5c4c	60c1d337-17eb-47cb-8e43-c0dad44018af	2026-05-12 00:40:18.458
d9bbf57d-2b8f-4947-9ad1-139428862a7e	4af902e0-a9a1-4edb-a2bf-cd2295ab3ecc	60c1d337-17eb-47cb-8e43-c0dad44018af	2026-05-12 00:40:18.459
d0a6683c-5795-408d-9091-eb1477568b16	f4d40c98-f955-4565-b135-d96cdb5c5c4c	7424aff0-3846-4e9b-bb93-4f0f32d2c361	2026-05-12 00:40:18.46
9cdecb81-54c3-4d89-800b-127a1dd92d8c	f4d40c98-f955-4565-b135-d96cdb5c5c4c	542e15e9-4c7d-4bc0-b5b1-28a4ee5be919	2026-05-12 00:40:18.461
1b35d338-2b99-4710-a461-a2388c5ef084	f4d40c98-f955-4565-b135-d96cdb5c5c4c	813e00bd-021e-44d1-a5e3-0f7f1012c62d	2026-05-12 14:54:38.829
ae350be4-1124-4406-8702-53de5ce8fe2d	4af902e0-a9a1-4edb-a2bf-cd2295ab3ecc	813e00bd-021e-44d1-a5e3-0f7f1012c62d	2026-05-12 14:54:38.841
1a174dc4-3f3b-4c40-ab26-602e6ca9aa1c	7b2f97e5-a88f-446a-8d20-69ad72235192	813e00bd-021e-44d1-a5e3-0f7f1012c62d	2026-05-12 14:54:38.844
5d28d620-b45e-4c3e-97e0-f9f9c0714d09	f4d40c98-f955-4565-b135-d96cdb5c5c4c	8c223df9-e20f-41d1-b9c1-fd591fa81c93	2026-05-13 14:47:13.731
3800d37d-8e1a-4139-9579-9d6e55712e02	4af902e0-a9a1-4edb-a2bf-cd2295ab3ecc	8c223df9-e20f-41d1-b9c1-fd591fa81c93	2026-05-13 14:47:13.744
bb3b8c11-c814-44bb-94d6-d7a91aac9df6	7b2f97e5-a88f-446a-8d20-69ad72235192	8c223df9-e20f-41d1-b9c1-fd591fa81c93	2026-05-13 14:47:13.745
b8ca276d-13a3-463b-9369-19fd406d14d4	f4d40c98-f955-4565-b135-d96cdb5c5c4c	d49cb27a-699c-4c87-b418-41be9e69023c	2026-05-18 19:15:30.914
fce2de5b-013e-44a2-a2d5-9f02aae262b5	f4d40c98-f955-4565-b135-d96cdb5c5c4c	ac3394ee-e597-440d-b705-e02076cb387a	2026-05-18 19:35:19.698
aff25f26-be66-4170-960c-a6c0b416182f	4af902e0-a9a1-4edb-a2bf-cd2295ab3ecc	ac3394ee-e597-440d-b705-e02076cb387a	2026-05-18 19:35:19.701
703af965-5fd4-4d60-8319-b0f89d61db72	f4d40c98-f955-4565-b135-d96cdb5c5c4c	93efcd32-2121-48c3-98c9-4de07bb228e7	2026-05-18 21:21:38.193
4b566be6-d977-478a-8860-e14c2b3f1366	4af902e0-a9a1-4edb-a2bf-cd2295ab3ecc	93efcd32-2121-48c3-98c9-4de07bb228e7	2026-05-18 21:21:38.195
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles (id, name, description, "isActive", "createdAt", "updatedAt") FROM stdin;
f4d40c98-f955-4565-b135-d96cdb5c5c4c	SUPER_ADMINISTRADOR	Super Administrador — Acceso total al sistema, configuración y gestión de usuarios	t	2026-05-12 00:40:18.297	2026-05-18 22:17:22.151
4af902e0-a9a1-4edb-a2bf-cd2295ab3ecc	ADMINISTRADOR	Administrador — Gestión operativa del negocio, inventario, compras y reportes	t	2026-05-12 00:40:18.307	2026-05-18 22:17:22.159
7b2f97e5-a88f-446a-8d20-69ad72235192	CAJERO	Cajero — Operaciones de venta, POS y caja registradora	t	2026-05-12 00:40:18.308	2026-05-18 22:17:22.16
\.


--
-- Data for Name: sale_adjustment_lines; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sale_adjustment_lines (id, "adjustmentId", action, "productId", "saleItemId", quantity, "unitPrice", "lineSubtotal") FROM stdin;
3fca7aa9-05ba-4508-a37b-f9c8a4fd8445	e5898d95-c40f-4b44-ad5b-78d21eb92777	ADD	2eab3442-7728-4655-b910-9c052e9fea2d	\N	1.0000	200000.00	\N
23ec0822-3ef9-44a9-ae33-64fbaa3456be	d344510b-e52b-4cf0-bd9a-1d68244d6891	ADD	2eab3442-7728-4655-b910-9c052e9fea2d	\N	1.0000	700000.00	\N
75c39c27-8b0e-49e3-a151-1bc7542923e9	c3c86981-181d-49b7-946c-8fc5ebbd32af	REMOVE	2eab3442-7728-4655-b910-9c052e9fea2d	94b5c002-9082-4c19-8380-eab11613986b	1.0000	\N	\N
a1dc3945-0221-4465-bddf-fe071dd0e63a	a38c6392-2c63-4159-a2d0-a0db5736d47f	ADD	2eab3442-7728-4655-b910-9c052e9fea2d	\N	3.0000	700000.00	\N
6f75c2ba-13eb-4319-9545-8936b6d77f5c	e03fb1b0-0311-4210-8de0-4c08418c5926	ADD	cd3f9e15-b894-430c-8bc2-afaccc3f6f8f	\N	1.0000	15000.00	\N
ece85799-86fd-484c-b4c7-714c0ef89bac	8adb68bf-9ecb-4c18-800a-67eb237c55f5	REMOVE	2eab3442-7728-4655-b910-9c052e9fea2d	2f331e2f-b0d9-4d17-bb45-8043b7128087	4.0000	\N	\N
beb625e6-940d-404c-a9c5-7745e2738254	a073c13e-6dc5-4ecc-9107-61d693ff5ee7	REMOVE	2eab3442-7728-4655-b910-9c052e9fea2d	721bd41c-b6e9-4c2e-aa82-df128ba0d357	1.0000	\N	\N
3f017516-fa11-4b28-aa58-ba8c38a2da30	7adc26ce-4e6b-42cf-a244-9f99ce0369a7	ADD	2eab3442-7728-4655-b910-9c052e9fea2d	\N	1.0000	700000.00	\N
c86ee477-88ac-41e5-b058-0cc580ce9b93	f91857a7-828e-4dd0-88e6-74dd02d2dadf	ADD	cd3f9e15-b894-430c-8bc2-afaccc3f6f8f	\N	1.0000	15000.00	\N
1f8771bf-a53b-450c-8483-352434d10376	1557561a-eafb-4b9f-b01b-cc0f9fd65fcf	REMOVE	2eab3442-7728-4655-b910-9c052e9fea2d	556a86d0-aca8-4c82-9503-a79b8393c993	1.0000	\N	\N
1d77e341-f290-45f8-8083-b6f3fccdb0fd	ee464824-13c4-452b-9a55-1775b755b7c4	REMOVE	2eab3442-7728-4655-b910-9c052e9fea2d	0d133f01-0790-4a93-816d-e55f22f97b42	1.0000	\N	\N
a62e6902-beda-4c1c-a9ae-89796ba3ce31	eed30ea0-7720-4084-9427-c5acabc08ce9	REMOVE	cd3f9e15-b894-430c-8bc2-afaccc3f6f8f	34bd4002-9603-4add-a48a-3641ba7ceb3f	1.0000	\N	\N
4b35b09d-72da-4f8d-aea6-efe72c45fe64	aa992b15-5197-4d28-86b9-ad03a3024179	ADD	2eab3442-7728-4655-b910-9c052e9fea2d	\N	1.0000	700000.00	\N
815a73bb-1a1a-4b0d-b23b-e626be0afb1e	648eb6b2-d99b-4f57-9b1a-e0ff081fc110	ADD	2eab3442-7728-4655-b910-9c052e9fea2d	\N	1.0000	700000.00	\N
95d0f7a1-4e85-41bd-8e73-9d2091335dc9	5daa3219-b912-44bb-b880-1e3f00ff093e	ADD	2eab3442-7728-4655-b910-9c052e9fea2d	\N	1.0000	700000.00	\N
03be732d-f23b-4a1f-970d-be50bf7053a2	1e5e9f22-6656-4c1d-b2d8-0216b93ffb61	ADD	2eab3442-7728-4655-b910-9c052e9fea2d	\N	1.0000	700000.00	\N
2b50e5a0-2368-45d5-adc4-e34d429a0bd9	fc303374-553e-4877-ac0a-4dbe864485ca	REMOVE	2eab3442-7728-4655-b910-9c052e9fea2d	15901e4a-6c8f-4a1a-adcc-2afe6e95c9ba	1.0000	\N	\N
503a3050-a4df-40c7-8a6f-b5daa7fb55af	bcf21482-51a0-43be-9a4c-bf48df76c84a	REMOVE	2eab3442-7728-4655-b910-9c052e9fea2d	3df40b98-2176-4be7-9eda-a0dc134a81ee	1.0000	\N	\N
1da9ce6d-0ad0-4270-ae9d-06d118430fee	922964d1-bcab-4fcd-929d-f01409fae34d	REMOVE	2eab3442-7728-4655-b910-9c052e9fea2d	564b9a55-5349-48a5-834e-524fbf60a97a	1.0000	\N	\N
\.


--
-- Data for Name: sale_adjustments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sale_adjustments (id, "saleId", "cashSessionId", reason, "totalBefore", "totalAfter", "cashDelta", "createdById", "createdAt") FROM stdin;
e5898d95-c40f-4b44-ad5b-78d21eb92777	f2e13e6b-7f64-4730-bcd4-ac55f5076c2f	6a55dc16-988a-47d9-865e-3f01ff9ddcfb	sasdasdas	700000.00	400000.00	-300000.00	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 19:47:46.836
d344510b-e52b-4cf0-bd9a-1d68244d6891	f2e13e6b-7f64-4730-bcd4-ac55f5076c2f	6a55dc16-988a-47d9-865e-3f01ff9ddcfb	sasdasdas	400000.00	2100000.00	1700000.00	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 19:55:54.361
c3c86981-181d-49b7-946c-8fc5ebbd32af	f2e13e6b-7f64-4730-bcd4-ac55f5076c2f	6a55dc16-988a-47d9-865e-3f01ff9ddcfb	sadasdasd	2100000.00	1400000.00	-700000.00	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 20:04:19.763
a38c6392-2c63-4159-a2d0-a0db5736d47f	0a631f29-6a76-49d4-a117-7fdb5934194a	6a55dc16-988a-47d9-865e-3f01ff9ddcfb	xxxxxx	695000.00	2815000.00	2120000.00	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 20:04:46.879
e03fb1b0-0311-4210-8de0-4c08418c5926	0a631f29-6a76-49d4-a117-7fdb5934194a	6a55dc16-988a-47d9-865e-3f01ff9ddcfb	sdsad	2815000.00	2830000.00	15000.00	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 20:05:16.968
8adb68bf-9ecb-4c18-800a-67eb237c55f5	0a631f29-6a76-49d4-a117-7fdb5934194a	6a55dc16-988a-47d9-865e-3f01ff9ddcfb	sdfdsgsdfg	2830000.00	30000.00	-2800000.00	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 20:05:42.824
a073c13e-6dc5-4ecc-9107-61d693ff5ee7	f2e13e6b-7f64-4730-bcd4-ac55f5076c2f	6a55dc16-988a-47d9-865e-3f01ff9ddcfb	error	1400000.00	700000.00	-700000.00	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 20:14:51.547
7adc26ce-4e6b-42cf-a244-9f99ce0369a7	f2e13e6b-7f64-4730-bcd4-ac55f5076c2f	6a55dc16-988a-47d9-865e-3f01ff9ddcfb	saa	700000.00	1400000.00	700000.00	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 20:15:36.945
f91857a7-828e-4dd0-88e6-74dd02d2dadf	f2e13e6b-7f64-4730-bcd4-ac55f5076c2f	6a55dc16-988a-47d9-865e-3f01ff9ddcfb	asdasdas	1400000.00	1415000.00	15000.00	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 20:19:54.059
1557561a-eafb-4b9f-b01b-cc0f9fd65fcf	f2e13e6b-7f64-4730-bcd4-ac55f5076c2f	6a55dc16-988a-47d9-865e-3f01ff9ddcfb	asdas	1415000.00	715000.00	-700000.00	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 20:20:41.151
ee464824-13c4-452b-9a55-1775b755b7c4	f2e13e6b-7f64-4730-bcd4-ac55f5076c2f	6a55dc16-988a-47d9-865e-3f01ff9ddcfb	error	715000.00	15000.00	-700000.00	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 20:27:31.73
eed30ea0-7720-4084-9427-c5acabc08ce9	0a631f29-6a76-49d4-a117-7fdb5934194a	6a55dc16-988a-47d9-865e-3f01ff9ddcfb	aaaa	30000.00	15000.00	-15000.00	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 20:28:59.754
aa992b15-5197-4d28-86b9-ad03a3024179	0a631f29-6a76-49d4-a117-7fdb5934194a	6a55dc16-988a-47d9-865e-3f01ff9ddcfb	aaa	15000.00	715000.00	700000.00	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 20:30:40.415
648eb6b2-d99b-4f57-9b1a-e0ff081fc110	f2e13e6b-7f64-4730-bcd4-ac55f5076c2f	6a55dc16-988a-47d9-865e-3f01ff9ddcfb	lllll	15000.00	715000.00	700000.00	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 20:35:50.532
5daa3219-b912-44bb-b880-1e3f00ff093e	f2e13e6b-7f64-4730-bcd4-ac55f5076c2f	6a55dc16-988a-47d9-865e-3f01ff9ddcfb	jjjjjj	715000.00	1415000.00	700000.00	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 20:36:14.051
1e5e9f22-6656-4c1d-b2d8-0216b93ffb61	f2e13e6b-7f64-4730-bcd4-ac55f5076c2f	6a55dc16-988a-47d9-865e-3f01ff9ddcfb	ssss	1415000.00	2115000.00	700000.00	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 20:36:38.612
fc303374-553e-4877-ac0a-4dbe864485ca	f2e13e6b-7f64-4730-bcd4-ac55f5076c2f	6a55dc16-988a-47d9-865e-3f01ff9ddcfb	ssss	2115000.00	1415000.00	-700000.00	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 20:38:19.453
bcf21482-51a0-43be-9a4c-bf48df76c84a	f2e13e6b-7f64-4730-bcd4-ac55f5076c2f	6a55dc16-988a-47d9-865e-3f01ff9ddcfb	ssss	1415000.00	715000.00	-700000.00	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 20:40:01.358
922964d1-bcab-4fcd-929d-f01409fae34d	f2e13e6b-7f64-4730-bcd4-ac55f5076c2f	6a55dc16-988a-47d9-865e-3f01ff9ddcfb	ssss	715000.00	15000.00	-700000.00	086c7a33-2f97-46ec-bed3-0ee95ee7a609	2026-05-18 20:40:36.603
\.


--
-- Data for Name: sale_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sale_items (id, "saleId", "productId", quantity, "unitPrice", discount, "taxRate", subtotal, "saleUnitId", "baseQuantity") FROM stdin;
75d3d566-3301-4aaf-8336-f0a5f8d457b4	b12ccb07-3e1a-4a89-ab03-aedb3f73a43f	a5d45022-eafa-4fd9-a4bc-91459d501081	1.0000	2000.00	200.00	0.00	1800.00	uom-un	1.0000
c69d1c51-4485-4472-9516-b1cc00f550af	37324099-22c8-4c04-a50d-0e46fb5bc626	2eab3442-7728-4655-b910-9c052e9fea2d	1.0000	5000.00	0.00	0.00	5000.00	uom-un	1.0000
4fa0d52d-bee0-4b7b-852b-b6c6d20aea3b	d8a595a7-5caa-4d6e-8874-f2200035477d	2eab3442-7728-4655-b910-9c052e9fea2d	1.0000	50000.00	0.00	0.00	50000.00	uom-un	1.0000
68e64df5-f8fa-4785-970f-cc0cb1b10616	6794c9e6-172c-496f-aeb3-a4a2cb066d6e	a5d45022-eafa-4fd9-a4bc-91459d501081	1.0000	3000.00	0.00	0.00	3000.00	uom-un	1.0000
8cbbc72f-991b-4e3e-b4cc-a38688d45b50	bf9a53a2-cab5-4c83-bfbc-79c5a42f0cec	2eab3442-7728-4655-b910-9c052e9fea2d	1.0000	700000.00	200.00	0.00	699800.00	uom-un	1.0000
6369aa74-8590-468b-8b66-ca78a049de3d	e5aa9399-e88e-4c39-bdb4-7f2df52c1a0b	2eab3442-7728-4655-b910-9c052e9fea2d	1.0000	700000.00	0.00	0.00	700000.00	uom-un	1.0000
941f326f-5ab7-49eb-a3ef-28bbdc2c2091	07ed7140-cffa-4b9e-8875-90b42cfa9108	a5d45022-eafa-4fd9-a4bc-91459d501081	1.0000	3000.00	0.00	0.00	3000.00	uom-un	1.0000
9e1040ed-760f-4b41-93d7-3d5d62d000ee	1ac74cf2-2d25-4034-be8f-fcc810a854c0	2eab3442-7728-4655-b910-9c052e9fea2d	1.0000	700000.00	0.00	0.00	700000.00	uom-un	1.0000
9d6432ea-8db0-4b73-8b12-34fc1e7a58e0	61904e41-b9db-4fa6-a154-e58515c9401e	2eab3442-7728-4655-b910-9c052e9fea2d	1.0000	20000.00	0.00	0.00	20000.00	uom-un	1.0000
0d96dea1-61cd-497e-aaad-802a1e1c4519	2eb25023-4e96-441f-8378-b6a02dcbdc71	a5d45022-eafa-4fd9-a4bc-91459d501081	1.0000	3000.00	0.00	0.00	3000.00	uom-un	1.0000
c1948dcf-9322-4929-8fa5-84da0a6befed	ea7257d5-e948-4fcb-8cce-1a0ac20faba5	2eab3442-7728-4655-b910-9c052e9fea2d	1.0000	700000.00	0.00	0.00	700000.00	uom-un	1.0000
56df4d27-69e1-469c-8a69-a5161d71c544	2906c7b3-f0ad-4544-91f8-ff6013d532ca	a5d45022-eafa-4fd9-a4bc-91459d501081	1.0000	0.00	0.00	0.00	0.00	uom-un	1.0000
1c3cbfec-0744-4c9b-a718-f065e62ead33	311b4c92-d4ab-4507-8def-3d33866875b2	a5d45022-eafa-4fd9-a4bc-91459d501081	1.0000	0.00	0.00	0.00	0.00	uom-un	1.0000
5fa39df4-1589-47d3-952b-a683467ad3e7	0a631f29-6a76-49d4-a117-7fdb5934194a	cd3f9e15-b894-430c-8bc2-afaccc3f6f8f	1.0000	15000.00	0.00	0.00	15000.00	uom-un	1.0000
dbec33b8-5014-4e39-99e0-6593cf22dd8a	0a631f29-6a76-49d4-a117-7fdb5934194a	2eab3442-7728-4655-b910-9c052e9fea2d	1.0000	700000.00	0.00	0.00	700000.00	uom-un	1.0000
372a1c46-7b06-4923-b61c-c18de395b742	0de7049d-c442-474d-8dd6-4cb7342a1b7a	a5d45022-eafa-4fd9-a4bc-91459d501081	1.0000	3000.00	11.00	0.00	2989.00	uom-un	1.0000
e4193def-ccdc-4fa9-b768-d784e5793630	f2e13e6b-7f64-4730-bcd4-ac55f5076c2f	cd3f9e15-b894-430c-8bc2-afaccc3f6f8f	1.0000	15000.00	0.00	0.00	15000.00	uom-un	1.0000
a0be8e27-9782-4a49-8708-05e74b4f8cda	d9e98b9b-c8cd-4557-a4e9-43e3ca9debf0	a5d45022-eafa-4fd9-a4bc-91459d501081	1.0000	3000.00	1.00	0.00	2999.00	uom-un	1.0000
eaec7a36-ecf2-4184-bf0b-106aaee5b456	d9e98b9b-c8cd-4557-a4e9-43e3ca9debf0	2eab3442-7728-4655-b910-9c052e9fea2d	2.0000	700000.00	0.00	0.00	1400000.00	uom-un	2.0000
925733c4-6334-410a-9d48-7c6a63b7f9d1	c010e0b0-abae-4ba5-86ed-aa5da85d77bd	a5d45022-eafa-4fd9-a4bc-91459d501081	13.0000	3000.00	1.00	0.00	38987.00	uom-un	13.0000
60a7cfc3-0bf9-459c-9615-7e48a1039a34	fc817027-ca1a-4373-bc26-4d598ea5ced3	a5d45022-eafa-4fd9-a4bc-91459d501081	1.0000	3000.00	1000.00	0.00	2000.00	uom-un	1.0000
fb3742ef-574e-46cf-a8c1-04efb5edebd2	58bff4df-dd96-4cf7-8735-332baae2144d	a5d45022-eafa-4fd9-a4bc-91459d501081	1.0000	3000.00	1000.00	0.00	2000.00	uom-un	1.0000
c2546858-5264-4b7a-99c1-385ed5091346	58ca6222-a614-46b2-ab90-03fcdae687f1	a5d45022-eafa-4fd9-a4bc-91459d501081	1.0000	3000.00	800.00	0.00	2200.00	uom-un	1.0000
a3a03a3d-1ecb-4b9a-b146-099c429ccbb3	6b0851f1-d8ee-4633-b2cf-c265d8fa62d6	a5d45022-eafa-4fd9-a4bc-91459d501081	1.0000	3000.00	200.00	0.00	2800.00	uom-un	1.0000
95a6a25e-a835-44b0-9888-238f0904d536	5868d698-e2d5-4e0c-993a-734f0952e67c	a5d45022-eafa-4fd9-a4bc-91459d501081	1.0000	3000.00	0.00	0.00	3000.00	uom-un	1.0000
e3b952bd-b76a-4e56-962e-344cf21b83f3	35e37928-2688-4143-bbea-b2bce0f956fe	a5d45022-eafa-4fd9-a4bc-91459d501081	2.0000	3000.00	0.00	0.00	6000.00	uom-un	2.0000
fe9e6592-578d-44c5-ba3d-94dc59ac5c84	39831189-2ceb-42ba-8791-610b46462d7b	a5d45022-eafa-4fd9-a4bc-91459d501081	1.0000	3000.00	0.00	0.00	3000.00	uom-un	1.0000
d232a89e-009d-491a-ad1b-cef4c7c71dd6	eaea5a26-6b42-4ff2-92a0-b36bac03c2fa	cd3f9e15-b894-430c-8bc2-afaccc3f6f8f	1.0000	15000.00	0.00	0.00	15000.00	uom-un	1.0000
d74e8c79-73d1-41d7-955d-842c62276fa3	18eee202-f1b6-4522-8c92-ce8557d1b5b7	cd3f9e15-b894-430c-8bc2-afaccc3f6f8f	1.0000	15000.00	0.00	0.00	15000.00	uom-un	1.0000
c55ecdf7-2a3b-4e2a-a262-8400fb68ff01	8ce3616b-afbf-42cf-a0e7-0b51cca172cc	2eab3442-7728-4655-b910-9c052e9fea2d	1.0000	700000.00	0.00	0.00	700000.00	uom-un	1.0000
deaff7d0-8973-434c-adea-7ff7bfece9a9	8ce3616b-afbf-42cf-a0e7-0b51cca172cc	23142c19-f1e7-43d0-b86e-ed6e3c19a520	1.0000	3000.00	0.00	0.00	3000.00	uom-cj	1.0000
803bd586-23bc-4082-8d68-d8718f0f6349	eec0b8f5-f103-4e7b-8439-1d0835ef299b	d3209abe-585d-4e85-ab26-8ed421df3fb9	10.0000	5000.00	0.00	0.00	50000.00	uom-cm	10.0000
6892fd38-2da0-46ba-a9e2-caa3d06ba55c	e0bd691d-d874-427f-8df9-ed638ebacaa9	d3209abe-585d-4e85-ab26-8ed421df3fb9	10.0000	5000.00	0.00	0.00	50000.00	uom-cm	10.0000
ed531677-7c0c-4653-b05b-dab95674eeb2	8918c87e-4c92-4f25-a7db-f029440541c0	a15a6f9a-8168-4526-a213-e5a7f480f057	10.0000	1000.00	0.00	0.00	10000.00	uom-cm	5.0000
\.


--
-- Data for Name: sales; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sales (id, number, "customerId", "userId", "cashSessionId", subtotal, "discountTotal", "taxTotal", total, status, "paidAt", "createdAt", "updatedAt") FROM stdin;
b12ccb07-3e1a-4a89-ab03-aedb3f73a43f	V-MP21I6FZ-WOAYN8	dd673969-355a-4bf4-97f8-b3fd114d70b4	086c7a33-2f97-46ec-bed3-0ee95ee7a609	\N	1800.00	200.00	0.00	1800.00	REFUNDED	2026-05-12 02:57:08.641	2026-05-12 02:57:08.644	2026-05-12 02:57:19.36
37324099-22c8-4c04-a50d-0e46fb5bc626	V-MP21K7DR-FHILOG	dd673969-355a-4bf4-97f8-b3fd114d70b4	086c7a33-2f97-46ec-bed3-0ee95ee7a609	\N	5000.00	0.00	0.00	5000.00	CANCELLED	2026-05-12 02:58:43.169	2026-05-12 02:58:43.172	2026-05-12 02:58:49.095
d8a595a7-5caa-4d6e-8874-f2200035477d	V-MP21KNCR-RJ3LDF	dd673969-355a-4bf4-97f8-b3fd114d70b4	086c7a33-2f97-46ec-bed3-0ee95ee7a609	\N	50000.00	0.00	0.00	50000.00	COMPLETED	2026-05-12 02:59:03.868	2026-05-12 02:59:03.871	2026-05-12 02:59:03.871
2906c7b3-f0ad-4544-91f8-ff6013d532ca	V-MP49E117-BGF10E	dd673969-355a-4bf4-97f8-b3fd114d70b4	086c7a33-2f97-46ec-bed3-0ee95ee7a609	\N	0.00	0.00	0.00	0.00	COMPLETED	2026-05-13 16:13:24.284	2026-05-13 16:13:24.29	2026-05-13 16:13:24.29
311b4c92-d4ab-4507-8def-3d33866875b2	V-MP49VAMX-M2ZD0V	dd673969-355a-4bf4-97f8-b3fd114d70b4	086c7a33-2f97-46ec-bed3-0ee95ee7a609	\N	0.00	0.00	0.00	0.00	COMPLETED	2026-05-13 16:26:49.883	2026-05-13 16:26:49.885	2026-05-13 16:26:49.885
6794c9e6-172c-496f-aeb3-a4a2cb066d6e	V-MP221K67-CKEG8J	dd673969-355a-4bf4-97f8-b3fd114d70b4	086c7a33-2f97-46ec-bed3-0ee95ee7a609	\N	3000.00	0.00	0.00	3000.00	COMPLETED	2026-05-12 03:12:12.896	2026-05-12 03:11:51.995	2026-05-12 03:12:12.898
bf9a53a2-cab5-4c83-bfbc-79c5a42f0cec	V-MP2228OK-ZRSRED	dd673969-355a-4bf4-97f8-b3fd114d70b4	086c7a33-2f97-46ec-bed3-0ee95ee7a609	\N	699800.00	200.00	0.00	699800.00	COMPLETED	2026-05-12 03:12:44.661	2026-05-12 03:12:25.639	2026-05-12 03:12:44.664
e5aa9399-e88e-4c39-bdb4-7f2df52c1a0b	V-MP24QRLJ-ELKT2B	dd673969-355a-4bf4-97f8-b3fd114d70b4	086c7a33-2f97-46ec-bed3-0ee95ee7a609	\N	700000.00	0.00	0.00	700000.00	COMPLETED	2026-05-12 04:27:48.152	2026-05-12 04:27:37.849	2026-05-12 04:27:48.157
07ed7140-cffa-4b9e-8875-90b42cfa9108	V-MP252VK6-T043ZM	dd673969-355a-4bf4-97f8-b3fd114d70b4	086c7a33-2f97-46ec-bed3-0ee95ee7a609	\N	3000.00	0.00	0.00	3000.00	COMPLETED	2026-05-12 04:37:13.16	2026-05-12 04:37:06.548	2026-05-12 04:37:13.163
1ac74cf2-2d25-4034-be8f-fcc810a854c0	V-MP258VG3-SGYVYZ	dd673969-355a-4bf4-97f8-b3fd114d70b4	086c7a33-2f97-46ec-bed3-0ee95ee7a609	\N	700000.00	0.00	0.00	700000.00	COMPLETED	2026-05-12 04:41:52.948	2026-05-12 04:41:47.545	2026-05-12 04:41:52.954
61904e41-b9db-4fa6-a154-e58515c9401e	V-MP25KD7P-3WMZSK	dd673969-355a-4bf4-97f8-b3fd114d70b4	086c7a33-2f97-46ec-bed3-0ee95ee7a609	\N	20000.00	0.00	0.00	20000.00	COMPLETED	2026-05-12 04:50:49.191	2026-05-12 04:50:49.194	2026-05-12 04:50:49.194
2eb25023-4e96-441f-8378-b6a02dcbdc71	V-MP34ED77-24N3QS	\N	086c7a33-2f97-46ec-bed3-0ee95ee7a609	\N	3000.00	0.00	0.00	3000.00	COMPLETED	2026-05-12 21:05:55.796	2026-05-12 21:05:48.177	2026-05-12 21:05:55.805
ea7257d5-e948-4fcb-8cce-1a0ac20faba5	V-MP48VWVB-HZKTXY	\N	086c7a33-2f97-46ec-bed3-0ee95ee7a609	\N	700000.00	0.00	0.00	700000.00	COMPLETED	2026-05-13 15:59:19.08	2026-05-13 15:59:15.164	2026-05-13 15:59:19.083
5868d698-e2d5-4e0c-993a-734f0952e67c	CART-MPBJ34Y8-4HHK9Z	\N	086c7a33-2f97-46ec-bed3-0ee95ee7a609	\N	3000.00	0.00	0.00	3000.00	PENDING	\N	2026-05-18 18:19:15.538	2026-05-18 18:19:16.261
fc817027-ca1a-4373-bc26-4d598ea5ced3	CART-MPBIHCJD-92D9UD	dd673969-355a-4bf4-97f8-b3fd114d70b4	086c7a33-2f97-46ec-bed3-0ee95ee7a609	\N	2000.00	1000.00	0.00	2000.00	PENDING	\N	2026-05-18 18:02:18.94	2026-05-18 18:02:35.617
35e37928-2688-4143-bbea-b2bce0f956fe	V-MPBJ7Y7G-C1GH8N	dd673969-355a-4bf4-97f8-b3fd114d70b4	086c7a33-2f97-46ec-bed3-0ee95ee7a609	\N	6000.00	0.00	0.00	6000.00	COMPLETED	2026-05-18 18:23:00.077	2026-05-18 18:23:00.079	2026-05-18 18:23:00.079
0de7049d-c442-474d-8dd6-4cb7342a1b7a	CART-MPBI81JI-PIAZE5	dd673969-355a-4bf4-97f8-b3fd114d70b4	086c7a33-2f97-46ec-bed3-0ee95ee7a609	\N	2989.00	11.00	0.00	2989.00	PENDING	\N	2026-05-18 17:55:04.784	2026-05-18 17:55:27.861
eae0cc33-a5da-4b76-a850-fa059b21231a	CART-MPBKI0LJ-5TWQBF	dd673969-355a-4bf4-97f8-b3fd114d70b4	086c7a33-2f97-46ec-bed3-0ee95ee7a609	\N	0.00	0.00	0.00	0.00	PENDING	\N	2026-05-18 18:58:49.353	2026-05-18 18:58:52.448
58bff4df-dd96-4cf7-8735-332baae2144d	CART-MPBIPO8S-IHEACU	dd673969-355a-4bf4-97f8-b3fd114d70b4	086c7a33-2f97-46ec-bed3-0ee95ee7a609	\N	2000.00	1000.00	0.00	2000.00	PENDING	\N	2026-05-18 18:08:47.358	2026-05-18 18:09:23.373
fbb8094e-0df3-4e79-92ac-6ea716a37d13	CART-MPBIWC0K-P9Q7RG	\N	086c7a33-2f97-46ec-bed3-0ee95ee7a609	\N	0.00	0.00	0.00	0.00	PENDING	\N	2026-05-18 18:13:58.102	2026-05-18 18:13:58.102
39831189-2ceb-42ba-8791-610b46462d7b	V-MPBJF9C6-NGL6WW	dd673969-355a-4bf4-97f8-b3fd114d70b4	086c7a33-2f97-46ec-bed3-0ee95ee7a609	\N	3000.00	0.00	0.00	3000.00	COMPLETED	2026-05-18 18:28:41.094	2026-05-18 18:28:32.895	2026-05-18 18:28:41.096
d9e98b9b-c8cd-4557-a4e9-43e3ca9debf0	CART-MPBI8N2Z-EJGL6Q	dd673969-355a-4bf4-97f8-b3fd114d70b4	086c7a33-2f97-46ec-bed3-0ee95ee7a609	\N	1402999.00	1.00	0.00	1402999.00	PENDING	\N	2026-05-18 17:55:32.7	2026-05-18 17:57:35.73
58ca6222-a614-46b2-ab90-03fcdae687f1	CART-MPBIWE51-GCS5OY	dd673969-355a-4bf4-97f8-b3fd114d70b4	086c7a33-2f97-46ec-bed3-0ee95ee7a609	\N	2200.00	800.00	0.00	2200.00	PENDING	\N	2026-05-18 18:14:00.855	2026-05-18 18:54:52.513
c010e0b0-abae-4ba5-86ed-aa5da85d77bd	CART-MPBIBD7S-4M2J50	\N	086c7a33-2f97-46ec-bed3-0ee95ee7a609	\N	38987.00	13.00	0.00	38987.00	PENDING	\N	2026-05-18 17:57:39.884	2026-05-18 17:57:44.368
18eee202-f1b6-4522-8c92-ce8557d1b5b7	V-MPBKMEHZ-F0FG5R	dd673969-355a-4bf4-97f8-b3fd114d70b4	086c7a33-2f97-46ec-bed3-0ee95ee7a609	\N	15000.00	0.00	0.00	15000.00	COMPLETED	2026-05-18 19:02:13.992	2026-05-18 19:02:03.761	2026-05-18 19:02:13.995
6b0851f1-d8ee-4633-b2cf-c265d8fa62d6	V-MPBIXIPL-HKI3LT	dd673969-355a-4bf4-97f8-b3fd114d70b4	086c7a33-2f97-46ec-bed3-0ee95ee7a609	\N	2800.00	200.00	0.00	2800.00	COMPLETED	2026-05-18 18:14:53.434	2026-05-18 18:14:18.895	2026-05-18 18:14:53.436
eaea5a26-6b42-4ff2-92a0-b36bac03c2fa	V-MPBKHVEP-J4V2EM	dd673969-355a-4bf4-97f8-b3fd114d70b4	086c7a33-2f97-46ec-bed3-0ee95ee7a609	\N	15000.00	0.00	0.00	15000.00	COMPLETED	2026-05-18 18:58:42.626	2026-05-18 18:58:28.004	2026-05-18 18:58:42.632
e0bd691d-d874-427f-8df9-ed638ebacaa9	V-MPBS6OWZ-CAS24W	dd673969-355a-4bf4-97f8-b3fd114d70b4	086c7a33-2f97-46ec-bed3-0ee95ee7a609	291208ee-f786-4555-a600-e3995f271b24	50000.00	0.00	0.00	50000.00	COMPLETED	2026-05-18 22:33:57.924	2026-05-18 22:33:24.618	2026-05-18 22:33:57.935
6e72406d-b696-4353-b094-c6f383a2d31f	CART-MPBS6Y6Z-L9ZVTA	\N	086c7a33-2f97-46ec-bed3-0ee95ee7a609	\N	0.00	0.00	0.00	0.00	PENDING	\N	2026-05-18 22:34:09.949	2026-05-18 22:34:09.949
0a631f29-6a76-49d4-a117-7fdb5934194a	V-MPBKTRG6-630MF9	\N	086c7a33-2f97-46ec-bed3-0ee95ee7a609	6a55dc16-988a-47d9-865e-3f01ff9ddcfb	715000.00	0.00	0.00	715000.00	COMPLETED	2026-05-18 19:07:57.368	2026-05-18 19:07:30.234	2026-05-18 20:30:40.406
8ce3616b-afbf-42cf-a0e7-0b51cca172cc	CART-MPBRLJTB-H5YYO5	dd673969-355a-4bf4-97f8-b3fd114d70b4	086c7a33-2f97-46ec-bed3-0ee95ee7a609	\N	703000.00	0.00	0.00	703000.00	PENDING	\N	2026-05-18 22:17:31.537	2026-05-18 22:17:53.787
eec0b8f5-f103-4e7b-8439-1d0835ef299b	V-MPBRMUFI-KJ3CVB	\N	086c7a33-2f97-46ec-bed3-0ee95ee7a609	291208ee-f786-4555-a600-e3995f271b24	50000.00	0.00	0.00	50000.00	COMPLETED	2026-05-18 22:18:31.951	2026-05-18 22:18:14.919	2026-05-18 22:18:31.968
f2e13e6b-7f64-4730-bcd4-ac55f5076c2f	V-MPBKSYAL-7W8IHB	\N	086c7a33-2f97-46ec-bed3-0ee95ee7a609	6a55dc16-988a-47d9-865e-3f01ff9ddcfb	15000.00	0.00	0.00	15000.00	COMPLETED	2026-05-18 19:07:19.582	2026-05-18 19:06:43.037	2026-05-18 20:40:36.594
8918c87e-4c92-4f25-a7db-f029440541c0	V-MPBT4DT9-07I4NJ	\N	086c7a33-2f97-46ec-bed3-0ee95ee7a609	291208ee-f786-4555-a600-e3995f271b24	10000.00	0.00	0.00	10000.00	COMPLETED	2026-05-18 23:00:09.838	2026-05-18 22:58:56.04	2026-05-18 23:00:09.848
\.


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.suppliers (id, nit, name, "contactName", email, phone, address, city, "isActive", "createdAt", "updatedAt") FROM stdin;
b0be3f4a-60e2-4e5f-9641-b19f39e608b9	213123	243534534	Rafael	rafael@gmail.com	32104324535	cra 1 # 2 - 23	Popayan	t	2026-05-12 02:26:13.055	2026-05-12 02:26:13.055
\.


--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.system_settings (id, key, value, type, category) FROM stdin;
\.


--
-- Data for Name: units_of_measure; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.units_of_measure (id, code, name, symbol, category, "allowsDecimals", "decimalPlaces", "sortOrder", "isActive", "createdAt", "updatedAt") FROM stdin;
uom-un	UN	Unidad / pieza	und	COUNT	f	0	10	t	2026-05-18 22:02:40.003	2026-05-18 22:17:22.329
uom-par	PAR	Par	par	COUNT	f	0	11	t	2026-05-18 22:02:40.003	2026-05-18 22:17:22.331
uom-cj	CJ	Caja	cja	COUNT	f	0	12	t	2026-05-18 22:02:40.003	2026-05-18 22:17:22.332
uom-kg	KG	Kilogramo	kg	WEIGHT	t	3	20	t	2026-05-18 22:02:40.003	2026-05-18 22:17:22.333
uom-g	G	Gramo	g	WEIGHT	t	2	21	t	2026-05-18 22:02:40.003	2026-05-18 22:17:22.334
uom-lb	LB	Libra	lb	WEIGHT	t	3	22	t	2026-05-18 22:02:40.003	2026-05-18 22:17:22.336
uom-l	L	Litro	L	VOLUME	t	3	30	t	2026-05-18 22:02:40.003	2026-05-18 22:17:22.337
uom-ml	ML	Mililitro	mL	VOLUME	t	2	31	t	2026-05-18 22:02:40.003	2026-05-18 22:17:22.338
uom-m	M	Metro	m	LENGTH	t	3	40	t	2026-05-18 22:02:40.003	2026-05-18 22:17:22.339
uom-cm	CM	Centímetro	cm	LENGTH	t	2	41	t	2026-05-18 22:02:40.003	2026-05-18 22:17:22.34
uom-mm	MM	Milímetro	mm	LENGTH	t	1	42	t	2026-05-18 22:02:40.003	2026-05-18 22:17:22.341
uom-m2	M2	Metro cuadrado	m²	AREA	t	3	50	t	2026-05-18 22:02:40.003	2026-05-18 22:17:22.342
\.


--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_sessions (id, "userId", "accessToken", "refreshToken", "ipAddress", "userAgent", "expiresAt", "isActive", "createdAt") FROM stdin;
c2b6839e-ee8c-480e-af35-9a7ebb021d5f	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_a0cdf035-eab5-4259-a28b-2bb4a4f064e9	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-13 17:05:10	t	2026-05-13 17:00:11.358
832a8cbf-4e13-47e5-af76-ffc29f22eb37	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_389f9e77-3888-4a5b-bb2f-5559037d252d	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-13 17:05:10	t	2026-05-13 17:00:11.428
09ce31eb-d717-4238-acb9-11744901f7bb	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_1b161d51-9008-4806-83f1-218b06169490	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-13 17:05:19	t	2026-05-13 17:00:19.955
b91c09e7-0772-4531-b7ec-9fced71e7c28	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_0b6c6149-6a2e-421a-9946-08eaa7971239	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-13 17:05:19	t	2026-05-13 17:00:20.3
a6a99fe2-9a46-4190-9a39-20df5e9b6607	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_a5c0adbd-634e-4379-8e31-5a3519479ca4	\N	10.89.0.105	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 16:02:31	t	2026-05-18 15:57:32.073
26a7bbb9-79a2-4ce1-96a7-9961a382ee53	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_5530882c-bb1c-446d-abee-b3e27679e699	\N	10.89.0.105	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 16:02:31	t	2026-05-18 15:57:32.127
6b5e6f50-3048-4444-a17d-3c7fc0cffba1	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_722efb23-2dbb-4a15-bc2d-e938543903c6	\N	10.89.0.105	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 16:09:57	t	2026-05-18 16:04:57.314
225fea5d-eb52-42d9-b2e0-eea4f1df1ba8	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_c15b6bf4-30f1-430b-a738-86d83b9ff23d	\N	10.89.0.105	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 16:09:57	t	2026-05-18 16:04:57.345
60cfb5a6-7b30-46c1-a0a7-6fe7d2a15e72	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_4ead3b3c-c845-4e8c-be2a-46538765a76e	\N	10.89.0.105	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 16:14:27	t	2026-05-18 16:09:27.625
097fe5b1-3579-41ce-b8e8-707592ac6621	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_3b755931-dd30-4bb8-b472-a0cb5335026d	\N	10.89.0.105	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 16:14:27	t	2026-05-18 16:09:27.683
86535ea0-46ed-4bc4-a975-908d37571a68	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_16663ada-c4e1-4684-a4e9-f1f81843ee44	\N	10.89.0.105	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 16:15:26	t	2026-05-18 16:10:26.91
f852eaa6-d71b-4057-ba27-a9e0b9436b5c	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_25e5cb65-9c50-495a-b696-f2399dae21c9	\N	10.89.0.105	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 16:15:26	t	2026-05-18 16:10:27.13
1f699b7d-89b0-43a8-b089-516348754221	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_4f5d20fd-54e8-4099-a7b8-584a6f2e55cd	\N	10.89.0.108	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 16:20:57	t	2026-05-18 16:15:57.229
a3e61f25-3f26-45ea-b183-559a8a6b5758	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_653695dc-2f94-4fe9-9643-a1c529884ec3	\N	10.89.0.108	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 16:20:57	t	2026-05-18 16:15:57.268
3cba73d8-2271-49ac-a769-b9f42ab789ed	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_5984c850-b09d-4881-aefe-77090963313d	\N	10.89.0.109	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 16:22:56	t	2026-05-18 16:17:56.217
02a38030-646c-4d9f-a18b-81f640310f42	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_a654d9bc-3e04-472f-a3c2-a3390977c90a	\N	10.89.0.109	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 16:22:56	t	2026-05-18 16:17:56.256
3b87183e-d1e8-4a81-a3f6-012a0834e6b4	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_599ce0b1-8400-454f-b64a-ea308e8512a6	\N	10.89.0.110	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 16:23:08	t	2026-05-18 16:18:09.028
dff976b9-860c-4f54-9901-df380f9e1faf	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_7ef3f363-6620-4e2d-afa2-77755a9a12df	\N	10.89.0.110	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 16:23:08	t	2026-05-18 16:18:09.064
d2d773cb-98b5-4bbb-b699-b05dc753b985	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_c083675f-3dbe-43e2-8b53-f66a28a162a8	\N	10.89.0.110	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 16:23:32	t	2026-05-18 16:18:32.533
5d2addbc-3b5b-4ade-82be-2b32817b1bf5	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_42359eaa-0c7e-4228-b2c3-52bd4cf959a3	\N	10.89.0.110	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 16:23:32	t	2026-05-18 16:18:32.618
5c959f8b-aa00-4ec1-84e9-69b169b6b76e	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_0d4d2546-1c79-427b-bd16-12f0d5cf75cf	\N	10.89.0.110	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 16:27:52	t	2026-05-18 16:22:52.698
7eae0342-a6d1-4ba3-afdc-cc46c5cfc6dd	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_6649823e-ceb7-49cb-9052-01c153d19c2e	\N	10.89.0.110	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 16:27:52	t	2026-05-18 16:22:52.752
ea3dc273-20dd-47d1-8391-c1b95258dcb4	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_1843cb48-3746-440b-b23f-653b02691dab	\N	10.89.0.113	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 16:28:27	t	2026-05-18 16:23:27.302
a863859f-6230-4366-9e60-a280fe645792	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_7d0725a5-08f7-4ad2-b21a-d63c59823c6e	\N	10.89.0.113	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 16:28:27	t	2026-05-18 16:23:27.338
ebcd8860-608e-4087-8fd1-7bb7b5dd98d3	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_3b0f443e-631a-4818-a1ba-31bdac4da13d	\N	10.89.0.113	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 16:28:29	t	2026-05-18 16:23:29.103
ce6f8528-2b48-4d33-80a6-b828821de827	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_9971048f-b074-437a-8211-4c0bdb365965	\N	10.89.0.113	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 16:28:29	t	2026-05-18 16:23:29.142
8360cff5-80c3-4acb-bb3d-5595e52e35d4	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_cd015e1c-e78d-462a-bb62-d371d9a81ed3	\N	10.89.0.113	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 16:45:29	t	2026-05-18 16:40:29.669
4ce3ed77-3790-460f-9e18-dcfa3122c876	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_8070b752-3c4e-44af-b1e5-4c7920350b35	\N	10.89.0.113	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 16:45:29	t	2026-05-18 16:40:29.698
d858f35e-d343-4674-9fcc-92082438203c	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_2e7655de-e29c-4db7-b61b-aeafc01826f7	\N	10.89.0.113	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 16:46:57	t	2026-05-18 16:41:57.765
83457803-0e19-4bcd-b591-18a5bd80245f	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_674ca9cb-f65f-474b-ac85-266bab97b30a	\N	10.89.0.113	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 16:46:57	t	2026-05-18 16:41:57.805
84b472c7-a173-413b-99fc-1938cf93cfcd	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_8f7ec1a8-d7ff-42ea-a4a6-1da4b3feafa4	\N	10.89.0.113	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 16:49:26	t	2026-05-18 16:44:26.563
98e180da-6fa1-469d-af69-4dcb7ba277d4	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_e473f5de-75b2-41d9-8104-2bcffe833159	\N	10.89.0.113	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 16:49:26	t	2026-05-18 16:44:26.64
c86dc49b-1b69-4bdc-850a-ce63b48620d6	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_3b132e71-e3d2-4815-9d08-de2e598aee24	\N	10.89.0.113	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 16:49:34	t	2026-05-18 16:44:34.209
1cbff226-af56-42cb-af24-97440cf63460	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_2a3ad431-b67e-4606-a9cc-17bf2bfb1435	\N	10.89.0.113	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 16:49:34	t	2026-05-18 16:44:34.241
c67a2448-9718-48b4-9ff9-d11a80fe2834	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_abf9b392-90f8-41e0-ad5e-c99913a12e8f	\N	10.89.0.113	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 16:50:06	t	2026-05-18 16:45:06.58
fd0c8f32-1608-470e-94b8-eb9083ce0a7d	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_0d1aec62-6c63-4df7-bd03-0086a86e61de	\N	10.89.0.113	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 16:50:06	t	2026-05-18 16:45:06.626
559d9b42-0f0e-4db3-bc68-68295341d8d3	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_53a33e5d-6f90-4589-8aa6-4677e249848b	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 16:51:47	t	2026-05-18 16:46:47.942
45527fc9-c80a-4d62-9077-fe605a710d34	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_ac79f514-7bc4-4a39-8ba9-1088d38a9d0f	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 16:51:47	t	2026-05-18 16:46:47.997
9e47bf6c-7649-454f-a0b0-1d4fc6017965	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_3f39d21a-cc10-46f9-942a-272febc9cd69	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 17:52:46	t	2026-05-18 17:47:46.272
694aded2-70a1-409e-aed0-ab167f189ff4	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_b4ad331f-7cf5-4944-b1cb-ba8c561ef77f	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 17:52:46	t	2026-05-18 17:47:46.299
0208bad5-d10e-4355-9176-d54d7cea13bb	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_ce4a4e46-4bf6-43fa-a2cc-be08a529f933	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 17:59:51	t	2026-05-18 17:54:51.718
d45e96a4-2ff9-4730-a923-512010d92ebf	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_f8afb54b-054c-4dbd-ab5d-151272e3eb8e	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 17:59:51	t	2026-05-18 17:54:51.759
8f7e85ba-d1df-435a-9dbb-f0435c2a0045	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_72d9e677-88c7-4222-a267-904b37fcac8b	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 18:00:29	t	2026-05-18 17:55:29.743
bd74a8d4-5456-4125-90ec-a4aa0230a6d9	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_9da06bf3-9922-46b8-9da5-9532f2096842	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 18:00:29	t	2026-05-18 17:55:29.804
400e5078-f632-4f6f-a234-a30308433b00	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_788c4e78-f23d-4f1f-bf04-1d62f9857e13	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 18:07:16	t	2026-05-18 18:02:16.768
9e45e29d-c32f-4c66-9ce4-71cfae4b58b2	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_dec0ac93-f419-44bd-8859-0fe2b98c996f	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 18:07:16	t	2026-05-18 18:02:16.833
6b047c6d-f708-42f9-8e51-f87cedc95ab2	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_74c38dd3-1019-4662-a3dc-a3f9edee91c5	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 18:18:59	t	2026-05-18 18:13:59.399
8a79e82d-2351-4055-8e8b-c77b9eecdafc	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_2cc01af5-1990-4aa3-8d46-095ebdd2859e	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 18:18:59	t	2026-05-18 18:13:59.444
1187aa8a-d1c6-4d83-a300-c2686e4d3188	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_e410eff8-46d6-4b88-bb64-3d1277639d40	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 18:27:27	t	2026-05-18 18:22:27.38
88b5148c-50c7-4b47-900b-e9de4cece9ed	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_15fa4bfa-3b9c-4037-a4ab-8dee91298213	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 18:27:27	t	2026-05-18 18:22:27.429
82c4317a-0caa-4d4c-a89b-ecc4788d1680	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_82aba5a7-6672-4734-b8a8-64a4d81ac7f4	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 18:33:20	t	2026-05-18 18:28:20.55
cb8f168d-2692-41c1-9803-1f9b5ee50ff9	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_a039d8f1-b495-4c46-becb-4c177d9dd82b	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 18:33:20	t	2026-05-18 18:28:20.629
e873b8a9-0cc3-4ce9-8076-b0824750aae2	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_ad41a125-45ba-4e60-8e01-992509a4e840	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 18:33:46	t	2026-05-18 18:28:46.74
157abad5-b9b5-4a54-a03d-490af39016be	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_27ff4913-a1e7-4345-afa1-3303f4b997a0	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 18:33:46	t	2026-05-18 18:28:46.842
f17ca254-05a6-4d63-9256-12fcf5ef4c19	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_c6263445-2e27-4df1-87c4-dfa59a890f45	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 18:40:47	t	2026-05-18 18:35:47.832
88e28264-3ce3-4fa7-959d-f7becc3f55c6	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_b8608680-ee31-4f40-8d90-c7f7aebe5862	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 18:40:47	t	2026-05-18 18:35:47.881
c19e982e-741a-4705-aa77-e0f24d0fdab4	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_0268ae71-5613-48be-a352-a43f442ec82f	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 18:44:09	t	2026-05-18 18:39:09.513
78a61df9-6bc6-43d2-a216-d31c481a516f	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_4d2b8d73-c385-435f-96b4-803907b9c0e0	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 18:44:09	t	2026-05-18 18:39:09.639
54a59ad7-79af-401e-9bb3-84fe7e584a1a	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_d29cd988-6151-44ee-8a11-1013133676f6	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 19:03:22	t	2026-05-18 18:58:22.338
34909421-87f2-4cbc-82a3-760e1aa4f4a5	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_ac92249c-ec0b-43e6-878a-a28c8094cb8a	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 19:03:22	t	2026-05-18 18:58:22.403
d6b968ac-d3ac-4b50-bbf6-66c013bde640	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_e26d5699-12c9-498d-bfdb-7274ea23b918	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 19:03:47	t	2026-05-18 18:58:47.728
07742f6b-7fa3-4717-aaaf-183660386658	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_72c535ab-515b-4231-8dbd-ff1edc16d6c6	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 19:03:47	t	2026-05-18 18:58:47.802
b80121c0-eff8-456e-a463-c216f184b30b	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_f0555006-dde6-409f-bc9f-7767d457edb4	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 19:06:58	t	2026-05-18 19:01:58.974
5f8d4870-862a-45b3-93e9-46dc348f552e	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_f5990e48-2186-421c-b4dd-b67be41ad624	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 19:06:58	t	2026-05-18 19:01:59.024
920aa879-a050-451c-975e-24864a4129c8	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_781fa611-580b-4252-8ea6-de5bb25e0fc4	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 19:21:24	t	2026-05-18 19:16:24.33
b5af0102-bfe4-4829-b18c-936fcd2c8829	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_c645d9b0-a899-40ac-be7e-03a1bd909d6b	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 19:21:24	t	2026-05-18 19:16:24.387
9be15e9b-65d2-4724-9c69-b55689d2fb6b	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_72141910-302b-46f8-a5f7-c3a965bd0452	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 19:27:50	t	2026-05-18 19:22:50.272
4bc10c32-95cb-4afe-80e1-1ab60666912e	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_f40fe051-3ab0-4fef-89db-aea393dd1444	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 19:27:50	t	2026-05-18 19:22:50.3
afd3e8c8-84a1-4ec5-a8e3-c7462eadd40a	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_b066ad0f-d1fe-47f6-a213-2030ab724cf7	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 19:42:45	t	2026-05-18 19:37:45.109
1e219e0c-7e19-4367-a29d-73cb06ec31e5	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_82a21db6-78b3-431e-93ac-fbd06f8606f7	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 19:42:45	t	2026-05-18 19:37:45.157
000a83fd-bf2a-4e05-b2d1-1a668744d548	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_7715c718-3a7f-4d5a-8ecc-7867a3397ea0	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 19:46:31	t	2026-05-18 19:41:31.684
420b10d9-3fa4-43ff-87c7-020934a9feb2	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_ed91304a-a83a-4e06-9f30-abf7961f49e8	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 19:46:31	t	2026-05-18 19:41:31.723
7cb879dc-4b65-4d0f-b1e5-7a4bccbfc5b1	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_a61c5ce2-5e59-4d63-a8ee-56e839513b91	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 19:47:48	t	2026-05-18 19:42:48.3
950f22fb-396f-4874-b464-e145ed7a7146	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_7b6ea006-3bf6-495c-abcb-d3d93264e5b2	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 19:47:48	t	2026-05-18 19:42:48.404
7b73dde7-1571-4373-958c-29ace0797e0e	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_31b176e7-d1ce-43af-97e8-003fe6ccb2de	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 19:51:45	t	2026-05-18 19:46:45.337
8304815a-c718-4643-b956-8b15bbd4015d	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_d0ae6ad1-d7b9-4642-b4d4-3cec481202a5	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 19:51:45	t	2026-05-18 19:46:45.383
a403da78-4897-4f4c-9e4c-ab17bd887b92	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_7c199ba1-d08b-43ea-a814-7c04d61aa662	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 19:59:50	t	2026-05-18 19:54:50.562
fb5bca79-e17f-4a6d-a2df-1df74f8a2aa3	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_3bad3433-55c8-4c82-b921-f33dab90682e	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 19:59:50	t	2026-05-18 19:54:50.613
7be66c62-b7b8-4448-9d11-1a25f0fb53a2	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_d38f02c7-eb24-415c-9844-635674087362	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 20:00:30	t	2026-05-18 19:55:30.135
aa95ccdc-2c4d-43a4-9c8b-35cd861a2cb0	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_1b7d3e31-f88f-4201-80b8-13187d68896a	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 20:00:30	t	2026-05-18 19:55:30.2
0498cfc5-faf1-4698-a311-7c2d9a9634ec	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_9e934438-275c-4b62-89ae-e4cbd5157102	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 20:05:07	t	2026-05-18 20:00:07.36
dfd8f356-3ab0-4974-bfcd-9c4937cc58a6	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_34d45866-98c6-40b1-83c8-3998a46298b5	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 20:05:07	t	2026-05-18 20:00:07.406
3a740a1b-9eaf-4326-bdcd-5207cfe48086	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_8b572725-cd21-43b0-8f16-304130fdaf29	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 20:06:28	t	2026-05-18 20:01:28.695
3a9a1380-cc1f-4e15-ae2d-54390c04605b	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_96136bd8-5ec9-4cf2-8099-4eb0a44d928d	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 20:06:28	t	2026-05-18 20:01:28.764
9c13c52a-60c0-4555-acc9-ad39cb04d353	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_73fdd3c0-de33-4628-b027-1380152f6ff0	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 20:09:04	t	2026-05-18 20:04:04.725
ce702610-06c1-4110-9ec8-7bb794c02d09	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_4a6564c9-ac3b-4f29-a507-cec49f5a6363	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 20:09:04	t	2026-05-18 20:04:04.776
a3898218-38f0-4fe2-a0d2-c32b3fc975c0	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_ce7438b6-73c0-4aa6-926f-07e3272ee94d	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 20:16:38	t	2026-05-18 20:11:38.866
2ecaa774-9660-4c3c-a33a-c55fc5e2b1d9	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_ce4d0d40-2c32-4a11-bb0c-f691bbee997b	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 20:16:38	t	2026-05-18 20:11:38.929
9f23ce48-0d56-4c72-b6a7-2b9132467767	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_e9a6ff49-8a2a-4227-a558-b3a6c67d348b	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 20:19:30	t	2026-05-18 20:14:30.72
815441d9-84db-4b94-8128-5a72d2f7fd04	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_7b739978-f72b-4f05-82c5-ef1842d06d0e	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 20:19:30	t	2026-05-18 20:14:30.752
41a3fe84-393a-4bb7-9624-1a50318c9604	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_1615fa49-94cf-4dba-8c42-03824bac1a60	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 20:21:51	t	2026-05-18 20:16:51.873
ca2094bb-06aa-43b5-9be0-334a4037cb01	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_1ac88986-58e6-4eb0-abd9-644672dfacf3	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 20:21:51	t	2026-05-18 20:16:51.914
cf51debb-4d89-4562-9f2b-d3fccdb484b1	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_c62ced97-b49a-4882-aeab-9f0f8433ff63	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 20:23:58	t	2026-05-18 20:18:58.422
2a8abbaa-470e-4530-be29-f6f2ca47358d	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_9d1e5d0c-5837-46ec-9918-24b439781c81	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 20:23:58	t	2026-05-18 20:18:58.488
63fcb804-9621-48d4-998c-6ccb0400daf9	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_79f7c2e6-9fd1-4baf-8971-b85b0615f0a2	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 20:32:10	t	2026-05-18 20:27:10.657
cbeaa740-c1fa-4df8-abd3-6c1c9b9b4967	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_f99e5a88-02aa-4b54-968b-53537e9b4e61	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 20:32:10	t	2026-05-18 20:27:10.732
36d569a0-54e9-4f98-8630-a789c8d5009a	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_b9f69514-9a3d-4ee2-b5ae-fb2b94c8762c	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 20:52:16	t	2026-05-18 20:47:16.973
4abd51f7-aef4-453f-8f64-4851a7c1d297	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_88ae4c13-4c92-4c7e-ae17-d49f922c4650	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 20:52:16	t	2026-05-18 20:47:17.025
9691bb4b-3dab-4369-8abb-248c7098fc20	7d522b83-f005-46be-a3e8-df1f3a51ea50	sess_3637fe63-e8f1-4d97-9318-6239cf44f972	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0	2026-05-18 20:55:34	t	2026-05-18 20:50:34.184
2b692dd4-068b-461f-a02d-41fa2fdec80c	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_c997006e-9211-40ed-ba3d-8b0eb8c1710b	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 20:59:47	t	2026-05-18 20:54:47.938
d827831b-89a0-47de-bcf6-e4356154bc41	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_cce03448-1968-41ec-a64c-f3d1e8790dd9	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 20:59:47	t	2026-05-18 20:54:47.981
e05dd207-e540-4077-9ba9-40f6dccd2b13	7d522b83-f005-46be-a3e8-df1f3a51ea50	sess_bf5c41ac-5d73-4ff3-8524-38930d13b2d4	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0	2026-05-18 20:55:34	f	2026-05-18 20:50:34.341
bba8086d-6773-452f-9e5a-95a7ced38de5	8f8c12c0-5df8-4b39-9b4d-6fde7d23f6cc	sess_3c028326-14e5-478f-b7f2-0591e421166d	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0	2026-05-18 21:03:25	t	2026-05-18 20:58:25.461
04c3c2b7-c844-449e-9282-068b3f40c02f	8f8c12c0-5df8-4b39-9b4d-6fde7d23f6cc	sess_050dd62c-c91a-4232-acd3-2c7d984a79b6	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0	2026-05-18 21:03:25	t	2026-05-18 20:58:25.504
8b06668f-77df-4659-9470-1be14124d10b	8f8c12c0-5df8-4b39-9b4d-6fde7d23f6cc	sess_b4fb7880-2e83-485b-a0b3-2ce9f92679df	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0	2026-05-18 21:04:38	t	2026-05-18 20:59:38.642
2e122240-6955-49f4-8485-e8386ed0fb18	8f8c12c0-5df8-4b39-9b4d-6fde7d23f6cc	sess_e95b3a84-f1c2-4227-94d2-5bcce6d8fa85	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0	2026-05-18 21:04:38	f	2026-05-18 20:59:38.683
27fcd0d2-6e92-48c8-b59e-68a6a3f39a44	8f8c12c0-5df8-4b39-9b4d-6fde7d23f6cc	sess_30ba3bbc-def2-4fa2-9de1-e162b578525f	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0	2026-05-18 21:08:14	t	2026-05-18 21:03:14.825
7d285cdc-5976-405f-9520-f5a3bb14ba63	8f8c12c0-5df8-4b39-9b4d-6fde7d23f6cc	sess_ce4a0d2a-be8a-43b2-b236-115088cf6310	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0	2026-05-18 21:08:14	t	2026-05-18 21:03:14.875
cb503711-88bb-4653-a85b-44d3ad50c36f	8f8c12c0-5df8-4b39-9b4d-6fde7d23f6cc	sess_6aa473b4-d584-4205-bb81-6fb3af05515e	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0	2026-05-18 21:08:14	t	2026-05-18 21:05:53.541
09809b6e-feb5-42c6-9ee5-b439bca77624	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_993831b3-bb58-43fd-872a-cae32ffd722b	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 21:07:47	t	2026-05-18 21:05:53.572
abb72b36-5356-4232-8f03-f213f4639532	8f8c12c0-5df8-4b39-9b4d-6fde7d23f6cc	sess_73f0a0b7-00c2-4c58-b0ed-5a8c220c3feb	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0	2026-05-18 21:11:47	t	2026-05-18 21:06:47.256
2d1975c9-4817-48bd-8b37-22e106df4f33	8f8c12c0-5df8-4b39-9b4d-6fde7d23f6cc	sess_68ea1c4d-c87e-4aa1-91a9-e343c6692740	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0	2026-05-18 21:11:47	f	2026-05-18 21:06:47.27
1962962e-e89f-40b2-b15c-8d747d663c5f	8f8c12c0-5df8-4b39-9b4d-6fde7d23f6cc	sess_41f4cc45-604a-459d-8140-939c816a0514	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0	2026-05-18 21:11:53	t	2026-05-18 21:06:54.002
02338b7f-8e82-4516-8da4-c09e650df075	8f8c12c0-5df8-4b39-9b4d-6fde7d23f6cc	sess_ed909d34-9e9b-4d80-91d2-ac9678332e1f	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0	2026-05-18 21:11:53	t	2026-05-18 21:06:54.024
73c8ca8f-7f15-4d93-a95a-d962a801fef0	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_3714f064-b256-4b4d-9d1e-c0f871954068	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 21:11:59	t	2026-05-18 21:06:59.337
40f9e01b-6f98-46e3-b48d-931e52c758c0	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_6623d44c-cec4-4d32-8f26-77b940da6552	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 21:11:59	t	2026-05-18 21:06:59.392
0a1b3a5a-8be2-4f52-a113-d840da99c9aa	8f8c12c0-5df8-4b39-9b4d-6fde7d23f6cc	sess_0e98ace5-01f2-4ad3-8706-b53fbf55f693	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0	2026-05-18 21:15:33	t	2026-05-18 21:10:33.67
0ebae109-7df1-48f3-b36d-5cef4fa7dbb9	8f8c12c0-5df8-4b39-9b4d-6fde7d23f6cc	sess_cbd26108-9226-4c62-8fe7-65d6c8f64714	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0	2026-05-18 21:15:33	t	2026-05-18 21:10:33.739
14dc5bcb-1700-45c1-91c2-946ba9534e0b	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_fabff4b0-5d7c-4401-a6a1-5737100e3a83	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 21:15:48	t	2026-05-18 21:10:48.881
e36e0128-cad9-4f22-950d-9b18298d422f	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_35e0b3a9-30d3-4b1b-addb-fa3e6330e72b	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 21:15:48	t	2026-05-18 21:10:48.941
4189d690-fc1d-4b8d-a0ae-372b92e77b50	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_e6b4fb82-9e64-4f83-bda7-f300a3e651da	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 21:15:55	t	2026-05-18 21:10:55.777
7dc393a2-0b76-4235-9370-03a5aeec5175	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_f9970564-a74f-4d96-852e-d3017e2580e1	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 21:15:55	t	2026-05-18 21:10:55.824
df75b9ee-da9f-47b2-9268-387680520b12	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_072a08af-bce3-4c32-842c-14f67f42883d	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 21:16:53	t	2026-05-18 21:11:53.795
26255ce2-a78a-4dcf-a351-1d5bb73c9de8	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_a104e1e1-40d5-4ada-b60c-c81ca457a9cd	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 21:16:53	t	2026-05-18 21:11:53.862
e059778a-ad0d-4469-b53d-bb2701e1d07f	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_4ef14cad-e72a-4bb6-9638-d1836b27e62a	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 21:26:50	t	2026-05-18 21:21:50.984
a772611d-7f4d-49e0-b3fb-11e955c43802	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_6d8ba943-6f97-461b-90ee-33a289e0c834	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 21:26:50	t	2026-05-18 21:21:51.007
494feefd-4ace-491c-b2a0-f0fc77e94cd9	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_4aa39dcc-b6b2-4af0-b311-91c7e030a5bf	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 21:28:02	t	2026-05-18 21:23:02.855
994a2b12-a50f-4ba8-83f0-3acdc6f536d0	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_380fd9f4-5a6b-4c86-91e7-640919413044	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 21:28:02	t	2026-05-18 21:23:02.93
b4160ff9-1945-4484-81a7-364769b019ca	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_23cfd384-7ec6-45b5-8208-f7b4b402c093	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 21:31:51	t	2026-05-18 21:26:52.119
20c2646a-a90c-49d0-a7ab-71632e70a7c3	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_690b95c7-54de-486a-bae2-a2ab8a636af7	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 21:31:51	t	2026-05-18 21:26:52.252
3bb41afe-971b-40bf-9a19-d19550118a69	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_5a74cdd3-c31a-410a-b1f1-54401d6e418f	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 21:35:12	t	2026-05-18 21:30:12.726
d00968b6-8d2c-420b-94b1-e23a6a0d6133	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_8d7b8f4e-4d28-44bb-9083-402156a1db08	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 21:35:12	t	2026-05-18 21:30:12.792
61f3ab30-594c-4ba0-9d6b-315b6735e19d	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_df2f2ae5-96e1-4e9b-bda0-11cb0fa2c054	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 21:39:43	t	2026-05-18 21:34:44.009
8914eaf7-bad3-4dfa-91ac-2e89b44026f0	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_df44d339-151e-43c0-940a-994aa7ef6fbf	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 21:39:43	t	2026-05-18 21:34:44.046
81834bec-6ef5-4e7c-add5-43dd72e13a82	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_0ce28d57-e093-4d8e-9132-56e6292e3962	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 21:41:57	t	2026-05-18 21:36:58.004
af9bb8ab-b339-4973-9a83-c15d1c08bae2	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_1882a89f-27a4-4bab-94d0-2bace91941bf	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 21:41:57	t	2026-05-18 21:36:58.107
53eb8c6a-c7bd-4e64-8568-df16707e6237	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_75d822a9-1fb7-46f6-b0f2-5b6d0e9b3f45	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 21:43:34	t	2026-05-18 21:38:34.194
4d497170-691c-42ef-a024-1b39cf595f1b	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_c8ae21a4-fe4a-4083-aaaa-8f57c7f312cb	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 21:43:34	t	2026-05-18 21:38:34.325
6aac3597-a5e0-4258-b031-34fdecb0c8d7	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_50fdb104-b681-4efc-9230-3a490546f51f	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 21:44:14	t	2026-05-18 21:39:14.778
92451cf5-9954-4cc4-a47f-83f09e40e529	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_1bb1b27e-6a88-4444-a1d5-ff1c677da2f5	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 21:44:14	t	2026-05-18 21:39:14.866
e9d9bda2-0c15-482e-84ff-a2bf09abc6e8	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_6a991bbd-435e-4eea-8b92-f69023b3b0c4	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 21:46:32	t	2026-05-18 21:41:33.128
4571817a-e858-436a-bf0c-20973eade47d	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_859fc214-f768-4b3f-93d2-8d11b33c3ffe	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 21:46:32	t	2026-05-18 21:41:33.236
30ea07a7-64fe-44e7-862a-49c09fdf214e	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_d81ee0fa-8051-42dc-b666-a06d542bdb46	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 22:06:09	t	2026-05-18 22:01:09.35
a57a494c-23f0-41b8-9ded-3fd080ee95f6	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_ccb4586a-0073-4ae4-8967-57079fff5f2f	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 22:06:09	t	2026-05-18 22:01:09.429
c6901448-e645-4322-ae8d-68dab0467809	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_df324867-0873-4679-9da1-c8a77fc87383	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 22:06:36	t	2026-05-18 22:01:36.934
548deba8-56df-4fbd-9904-03835ccd5bd6	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_8aee90dc-730c-4d76-ac07-e2c401209b6f	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 22:06:36	t	2026-05-18 22:01:37.022
76b17bab-17d0-41b5-859b-25250e5acf54	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_56c08723-8b4f-4164-9fb9-ce6296e53973	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 22:06:41	t	2026-05-18 22:01:41.789
150e6b69-023b-4861-9b4b-5dccff888a64	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_a2915cde-c185-4670-9e01-15f219ae780f	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 22:06:41	t	2026-05-18 22:01:41.857
046310ef-80fe-4ee9-8487-cd0763bffcc4	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_c6eb38ff-f6a8-4d61-8dd4-22b12b871090	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 22:07:04	t	2026-05-18 22:02:04.858
503891e8-5477-4f4d-8d73-674e5c97aec8	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_a3c891b1-0ad5-4f6d-a8c7-42c1c59d582e	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 22:07:04	t	2026-05-18 22:02:04.918
2b29e49c-7758-4657-8671-10ec3277d860	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_6e0671d7-6ef5-4273-8549-08ca3f8317b5	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 22:07:50	t	2026-05-18 22:02:50.302
9eab2a37-4854-4abd-88b5-fc067ed1c195	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_1a08f2fc-8b80-4246-a770-521b572d5a99	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 22:07:50	t	2026-05-18 22:02:50.375
9d79a6cc-60ab-4193-b5bc-158066687581	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_a089b7b3-9520-4d5c-a5cd-10896cb77227	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 22:08:08	t	2026-05-18 22:03:08.817
5ae32efe-de7d-4c2e-b06e-3f72390e9996	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_cb4eb887-fda9-45bd-9446-2d52e5fb433e	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 22:08:08	t	2026-05-18 22:03:08.894
bc136467-374a-4a94-8a2c-fa88748ba651	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_4551b005-00da-4056-b26a-c9b7a889740e	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 22:09:34	t	2026-05-18 22:04:34.636
b0749633-08e4-46ae-9607-7b359a2e0f17	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_37c8f797-af58-48b1-b1c7-289fd3c15d8a	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 22:09:34	t	2026-05-18 22:04:34.713
e9a1a93c-9347-4051-abc8-c76337b3ea38	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_3264e0e9-588f-4b04-ac7b-55206c312492	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 22:10:23	t	2026-05-18 22:05:24.047
f4d7a7ed-8363-4087-a845-3607d67998d6	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_93f25880-0f6f-405b-9a48-e80cc29f8a90	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 22:10:23	t	2026-05-18 22:05:24.086
4e3b7375-98c9-4a47-9dfa-18735362883d	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_3d484758-eda7-42f9-bb28-f2720e041e8e	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 22:13:06	t	2026-05-18 22:08:06.135
75e76465-07a2-43af-9506-e7a4d62d7778	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_b2267fa1-8652-4c02-8a46-0fc03a0b8d22	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 22:13:06	t	2026-05-18 22:08:06.21
8f21ad43-11f1-4ea3-9a07-12050d4efd1d	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_8c570e65-6365-4efe-beb6-d8ba46fb0045	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 22:22:26	t	2026-05-18 22:17:26.233
636f65cc-6e3d-4467-bf36-ca0b3a4057bb	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_2a2e334f-6eef-416e-83ce-5945321af077	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 22:22:26	t	2026-05-18 22:17:26.315
2927c552-541d-4b8d-a75d-74652ace747f	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_d4e07e61-1b7d-4141-8b67-e30de73236d7	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 22:35:02	t	2026-05-18 22:30:03.136
7c65c205-7918-4d12-8bc9-45d815dbf158	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_f04c0a63-1807-4aa6-9689-52dc52b93105	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 22:35:02	t	2026-05-18 22:30:03.214
be647be9-38ac-4aa4-869c-316cc3e84e02	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_8e933ece-e16d-4d9a-95b4-bd1d1d45f63b	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 22:35:32	t	2026-05-18 22:30:32.767
cfd9f11c-d1c9-4f10-a7cc-37573f7f7836	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_6a0400e6-a702-41f2-b2eb-408c53ffd89d	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 22:35:32	t	2026-05-18 22:30:32.837
59c5ebeb-59cd-4cd5-88c9-a684f94ee176	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_0e7b9f3a-72e2-4e88-8d52-40f34c20ecb5	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 22:35:36	t	2026-05-18 22:30:36.463
601972a0-fada-49dd-875d-a0c22911cf23	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_4bf8b66e-630d-4c94-b4b7-a2c2cddc37fb	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 22:35:36	t	2026-05-18 22:30:36.563
1d1e8f67-daaf-4815-841c-65bf37270b97	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_3a709b4d-d8bf-4e08-ab61-b06d6cf5f5a1	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 22:36:09	t	2026-05-18 22:31:09.716
bfd3a1be-4cd0-46ce-935e-cefe506f4c69	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_d486ca94-a58d-4ae7-b7a5-415701487533	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 22:36:09	t	2026-05-18 22:31:09.779
7d83336f-fa0f-4018-9bbf-9b60ed5a8566	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_ff1ed2f7-b530-4414-83c5-4b8a2585884c	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 22:38:03	t	2026-05-18 22:33:03.677
15359670-f1ef-42e6-9dde-d4f350d3502d	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_2187a6ef-5244-4b8c-a5a8-8acd0085062a	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 22:38:03	t	2026-05-18 22:33:03.741
288528e1-2490-4b27-95ad-b2997f3d8e9c	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_82d1e7f2-baa9-42bc-a13f-11729e0695a0	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 22:45:34	t	2026-05-18 22:40:35.035
959239a4-cfd5-4b73-bb37-2623a1431284	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_86c489a0-37a8-488a-b4d5-00b2750cb5a0	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 22:45:34	t	2026-05-18 22:40:35.085
4e15fe44-f150-48f7-bb09-b85811dba32f	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_89f8e594-0c5f-429c-9f1b-c7c269e1a3c1	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 22:46:08	t	2026-05-18 22:41:08.962
b5d686d4-fd7e-4909-af8d-777d16779cc9	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_1b211288-4cf0-4587-ad23-fd8c9250f605	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 22:46:08	t	2026-05-18 22:41:09.022
400bda14-35df-4817-8492-881e0fb20e8f	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_93aae94f-c218-4971-8baf-552fa665ae59	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 22:53:39	t	2026-05-18 22:48:39.982
fae25300-f4ce-4589-99d3-8cd17069fe76	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_29c1b1b9-8086-435a-aa6d-a162d34b3a97	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 22:53:39	t	2026-05-18 22:48:40.044
2325c443-8951-4c5c-b70c-5b85b5367a0b	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_8c37eed7-1ea7-496b-90e2-a98587ef2920	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 22:59:01	t	2026-05-18 22:54:01.879
aaeefe6a-8ca8-442e-80d3-00a5177fe7e8	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_699d40ee-64d6-405a-a255-a40daed2f76c	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 22:59:01	t	2026-05-18 22:54:01.937
cd9abe8a-fbc8-47d6-bb45-c848977545d7	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_17b5377e-85a8-410a-93dd-9234cef31e8a	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 22:59:17	t	2026-05-18 22:54:17.886
5824c02f-9ab5-4b05-8d32-96b38fa7f6b7	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_f647f821-91b8-4628-8a4f-a804f2ba87a3	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 22:59:17	t	2026-05-18 22:54:17.923
2b7ac71d-9d4a-488e-b10a-f393cd85660f	8f8c12c0-5df8-4b39-9b4d-6fde7d23f6cc	sess_053f85cb-6bfa-4aa5-b4d2-a17a956b72a2	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0	2026-05-18 22:59:29	t	2026-05-18 22:54:29.493
5d30579b-b8c4-400f-a4a4-bf3de97c5b7f	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_23bc8f26-5ecb-4251-bf04-6e7c9dc6360a	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 23:03:49	t	2026-05-18 22:58:49.863
71270063-7a9c-4e6c-a305-ba8460919cda	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_45cf54f9-eab9-4179-8c59-cde3315cb7c5	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 23:03:49	t	2026-05-18 22:58:49.895
a967b15a-318a-4ae2-bfd9-c878b9267999	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_e3878f08-4526-42b8-be28-00c511586f96	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 23:05:35	t	2026-05-18 23:00:35.921
ffaaebb4-26cc-44ab-8bc7-be7998a86ae2	8f8c12c0-5df8-4b39-9b4d-6fde7d23f6cc	sess_4a94a59c-cf8c-45ba-bdb5-3d1f1ed6fce8	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0	2026-05-18 22:59:29	f	2026-05-18 22:54:29.551
44bf317a-65e8-4ace-a672-458e2d789cf3	7d522b83-f005-46be-a3e8-df1f3a51ea50	sess_16cf9c3d-d03d-4ad6-8dcc-b865e9287161	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0	2026-05-18 23:11:41	t	2026-05-18 23:06:41.065
2218a581-e0b7-4dc8-833e-43e8789245b3	7d522b83-f005-46be-a3e8-df1f3a51ea50	sess_af20e67c-f633-47d2-89e7-6c0c60a0b9a6	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0	2026-05-18 23:11:41	f	2026-05-18 23:06:41.08
c1778a15-ab4d-4047-889d-3ae9956ed332	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_28b32d76-b750-47cf-b701-a38eefe0d92a	\N	10.89.0.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-18 23:05:35	f	2026-05-18 23:00:35.969
eb2650f4-e6f3-446d-8eb6-41db6a8219aa	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_ab6f9aba-0674-4079-9e9a-d2f47bed560b	\N	10.89.0.10	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 00:11:38	t	2026-05-21 00:06:38.493
70d30f7f-e9d6-48c3-a4b3-17019d5fca6c	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_da6d769e-423d-485f-8661-49a163f784f7	\N	10.89.0.10	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 00:11:38	t	2026-05-21 00:06:38.504
b4081052-5749-4475-b3ea-6f95630d6b1e	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_bd85e068-ce84-49b8-976d-017838cc0110	\N	10.89.0.10	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 00:16:09	t	2026-05-21 00:11:09.826
59f05223-13f4-49cc-a9e0-26c4665555a6	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_8fa9d98a-ec80-44b3-84c0-4cd01fa303e2	\N	10.89.0.10	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 00:16:09	t	2026-05-21 00:11:09.861
0f3e34b5-0b64-47ef-916c-1343099b8a6d	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_9259ab7c-4572-4264-ba5e-fedf576ac488	\N	10.89.0.10	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 00:18:03	t	2026-05-21 00:13:03.589
ea454e26-8b44-4926-8b34-214a6a8b2ba9	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_a404bd57-018c-4c48-8c0f-abc4a2291ce3	\N	10.89.0.10	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 00:18:03	t	2026-05-21 00:13:03.656
51d89572-4d03-4d30-848c-991d4d8e5bf8	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_c05ec53d-b1e4-4c23-bb7d-07d04b7e7f01	\N	10.89.0.10	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 00:25:51	t	2026-05-21 00:20:52.15
6f312716-a28a-4e6c-93bc-f44c5a44a4b4	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_19020a0f-88d6-4d54-a84f-86d9625b81e0	\N	10.89.0.10	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 00:25:51	t	2026-05-21 00:20:52.215
a39a1701-6054-4420-a838-edb2d066df86	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_ad144d28-09f5-48b8-970f-d2cb9ea93995	\N	10.89.0.10	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 00:42:15	t	2026-05-21 00:37:15.562
a33a24e8-c319-4de8-848b-6ace3e4b1806	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_cf1e39d1-6cea-4e4f-bce8-5a841453754e	\N	10.89.0.10	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 00:42:15	t	2026-05-21 00:37:15.588
2b2b30a5-5c1b-49a4-9765-ed201d32919b	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_38888208-bead-4840-a4c7-ec53d9f1bb53	\N	10.89.0.10	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 00:46:46	t	2026-05-21 00:41:46.775
5789cdb3-3e73-414c-9f6a-2609afa3c4c5	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_b5d9e3a3-1bdd-47c6-a467-76bd46f76684	\N	10.89.0.10	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 00:46:46	t	2026-05-21 00:41:46.865
82ebd6e8-ab24-411d-991b-f3073994c349	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_db7ffac4-6015-4eb2-9ffb-4d23bfeadcdf	\N	10.89.0.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 01:12:39	t	2026-05-21 01:07:39.766
8f12c27c-6218-407d-9fe0-86692d179902	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_9fab9799-bb61-45dc-aa23-bb271fefcdbe	\N	10.89.0.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 01:12:39	t	2026-05-21 01:07:39.82
a2cfb5e1-c546-452d-958a-7b7d6946a21a	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_1b417e35-1a7a-4b18-a05a-0d1e9e1f61f1	\N	10.89.0.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 01:14:42	t	2026-05-21 01:09:42.697
1d29248d-c7e9-4e97-855e-a395cd80a8a9	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_d640a32f-78e7-427e-9911-144d60eca910	\N	10.89.0.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 01:14:42	t	2026-05-21 01:09:42.73
f049b21d-f328-42cd-8e55-7a674bb79952	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_f66b6765-03c5-4e55-8ceb-36c06ffcd56f	\N	10.89.0.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 01:15:54	t	2026-05-21 01:10:54.192
111f86cd-5708-491b-9832-8fec59178505	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_aceb1d06-9fb2-4afd-8060-0835360e021e	\N	10.89.0.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 01:15:54	t	2026-05-21 01:10:54.226
a548107f-0a84-481e-a58e-520b445a7055	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_b0ea4fa5-dea2-45c5-bb4f-80b48afa26d2	\N	10.89.0.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 01:28:03	t	2026-05-21 01:23:03.125
7b2399f6-a5eb-4b9f-9599-305b54c57274	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_20615096-9909-421a-86f8-b0a695652363	\N	10.89.0.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 01:28:03	t	2026-05-21 01:23:03.178
2ceb1cab-60af-4534-ae30-e052d9fd7d57	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_659c925e-5715-4377-a4ec-32584e86c0cf	\N	10.89.0.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 01:28:26	t	2026-05-21 01:23:26.926
388d74f7-e026-41b0-8445-2ef39fb8ea6f	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_dcdfbe3d-fd07-48db-b05b-69f77fea4e25	\N	10.89.0.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 01:28:26	t	2026-05-21 01:23:26.986
01f3bb9f-f54a-4847-923e-199765cc8168	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_136df6b9-8b42-45a2-ac8c-cceaf0a2a2a7	\N	10.89.0.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 01:35:27	t	2026-05-21 01:30:27.854
399e14b1-78ca-4400-8189-8a30ecd6db31	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_6ce4e8f2-6859-4a24-aab5-9d39ed682a29	\N	10.89.0.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 01:35:27	t	2026-05-21 01:30:27.955
584f5b7e-164e-46ae-b222-b14fadb799b3	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_b9e38f18-c09f-4c5b-b131-66b6d56e773a	\N	10.89.0.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 01:40:35	t	2026-05-21 01:35:35.135
e16e6aa8-b8b4-4905-a233-a671f0aedeaf	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_0f6888c0-047c-4189-9035-7735d7ca6432	\N	10.89.0.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 01:40:35	t	2026-05-21 01:35:35.193
0e4aed32-2398-418b-9380-9b2b63cc549a	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_b15758b8-bea7-40e5-9398-18a9187ba2e8	\N	10.89.0.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 01:42:34	t	2026-05-21 01:37:34.599
eaf021d3-0f22-4cb3-8c48-77276b7d0791	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_f9c8a5a0-c631-473a-bce0-b799c761d528	\N	10.89.0.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 01:42:34	t	2026-05-21 01:37:34.678
8834baf9-7c0f-4c48-b46f-52dc04c312ab	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_0a99a333-3b18-49b9-b4bb-e873d0674ceb	\N	10.89.0.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 01:47:59	t	2026-05-21 01:42:59.897
bc46c299-b07e-4a9c-9838-f6aa61e25e8b	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_89bf1ee7-8882-4553-b834-f216ad4e2003	\N	10.89.0.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 01:47:59	t	2026-05-21 01:42:59.992
19ff8ba8-2b87-443b-95d0-7f1849508b1b	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_a7ebd758-f8e0-4435-be2c-a00a2915519c	\N	10.89.0.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 01:50:11	t	2026-05-21 01:45:11.519
8102accc-2016-41ae-88e3-2cdb85e80144	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_e08311db-8463-4c66-aecc-7cb825ed1f44	\N	10.89.0.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 01:50:11	t	2026-05-21 01:45:11.57
2d8b07c7-88d2-4b90-a3f0-cae6830e9923	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_c1eeb7a7-c27e-47e1-9ec1-869aeb7fd42b	\N	10.89.0.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 02:00:38	t	2026-05-21 01:55:38.243
4b30b31e-f199-461e-9640-ac706eb568f9	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_fa7b9e1f-1bce-49c4-986a-0fda6126de83	\N	10.89.0.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 02:00:38	t	2026-05-21 01:55:38.286
3c08bbd8-8d3b-4fad-a4a3-5e345943c1cc	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_94d45b82-9813-41e0-8e69-a13277887d00	\N	10.89.0.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 02:00:46	t	2026-05-21 01:55:46.83
f9bb122e-a2f7-43da-8d86-22fd897cea5c	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_73106c11-45ed-4ce0-b5e3-e8b61921b572	\N	10.89.0.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 02:00:46	t	2026-05-21 01:55:46.897
9f6cb43e-d789-48df-9c06-345f5fa3cedf	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_bbe99085-33fe-4fd7-9ed7-eec2239fbf8b	\N	10.89.0.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 02:07:23	t	2026-05-21 02:02:23.372
5d9fc551-d31b-4c32-a959-402baa0f88e1	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_5c5fba34-196e-4804-8358-e7d2075d5fba	\N	10.89.0.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 02:07:23	t	2026-05-21 02:02:23.409
72c37d13-23ae-4976-8f90-13b5097e82dc	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_8349d08c-6b21-4c1a-a51d-7e3a39ea2672	\N	10.89.0.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 02:07:30	t	2026-05-21 02:02:30.093
7581f85f-1b17-4b14-8bc4-527186ac97c3	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_51fe5a7e-7595-4c66-8ef8-e6eb4ed48277	\N	10.89.0.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 02:07:30	t	2026-05-21 02:02:30.134
4197c1ee-d36c-4efa-8077-813ca86ba797	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_c3dac6fd-0bd6-4198-977d-914d70b76614	\N	10.89.0.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 02:08:24	t	2026-05-21 02:03:24.725
4e55271a-7239-4856-bc57-3f38058fc120	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_9c970a07-0a1b-4804-be36-4302c61d3fe3	\N	10.89.0.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 02:08:24	t	2026-05-21 02:03:24.765
34fdf777-38f3-4ac3-a2c3-692931b9ae93	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_88cf111a-4a3c-4b30-a19a-409432ee4d22	\N	10.89.0.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 02:08:33	t	2026-05-21 02:03:33.355
91bec9c8-757e-4f32-a3fc-65a968340430	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_12418423-1a04-4814-ad89-37877df9d881	\N	10.89.0.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 02:08:33	t	2026-05-21 02:03:33.39
c790fd2d-e141-48ca-a0fe-88bcc2f71e50	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_d4b04c44-d108-4372-90b5-9f0bb4227c7a	\N	10.89.0.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 02:08:41	t	2026-05-21 02:03:41.773
a137406a-3eae-4736-8a85-2c16e55245b5	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_3bb60bd3-48ba-4082-8609-2a65de3211ce	\N	10.89.0.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 02:08:41	t	2026-05-21 02:03:41.812
fc91e223-774b-44e4-8c11-5f2784bbef3e	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_4af88b31-f4f3-4e81-a774-c8065ee0a345	\N	10.89.0.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 02:10:06	t	2026-05-21 02:05:06.513
b5ae0c98-1916-402b-bba9-f9fc1a7f06d9	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_d768f0e1-d0e6-4cb9-9ca1-7e71a463ddf5	\N	10.89.0.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 02:10:06	t	2026-05-21 02:05:06.571
8a3988a9-f868-4ee0-b94c-a1ac49cfda11	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_b1a8fc05-d8a2-43e9-9823-cd1ced227882	\N	10.89.0.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 02:14:01	t	2026-05-21 02:09:21.375
3cfd4110-88cd-4e36-b408-ce693e00c713	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_e2c2d28b-d727-4de3-8671-42dd383324f9	\N	10.89.0.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 02:17:18	t	2026-05-21 02:12:19.003
8cdaa94a-838c-4f75-9d92-ce59e3900d07	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_bacb695e-ff4d-43a7-ae31-8ab3049ab054	\N	10.89.0.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 02:17:18	t	2026-05-21 02:12:19.041
90c45781-b684-42cb-91ef-8f852d0c9cb0	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_e6e0c7ec-73f3-4de7-9455-0cd3563a9d2b	\N	10.89.0.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 02:19:36	t	2026-05-21 02:14:36.76
1293e934-0120-49e6-9a57-ee4456543205	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_f935e845-ec76-413f-9f02-42d5332d80c6	\N	10.89.0.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 02:19:36	t	2026-05-21 02:14:36.779
7d82623b-e2fe-48f7-8fff-c080696d432a	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_fbbcd77e-d413-4851-b60f-99d042a622ab	\N	10.89.0.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 02:21:37	t	2026-05-21 02:16:37.93
a2926c5e-341d-4c77-ba3f-9c21fd687d27	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_a5ef6962-bcd0-4a56-8a09-d965c8abb45b	\N	10.89.0.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 02:21:37	t	2026-05-21 02:16:38.003
76f31e95-f06e-4b0a-890a-385a7018dee2	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_b8a9fa27-0af8-4347-bfad-954085a4758a	\N	10.89.0.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 02:23:35	t	2026-05-21 02:18:35.738
f4ab1cb9-d8cf-488b-81c3-92c9a990b19d	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_14f17e5f-7a6d-40aa-a175-ee7b0b38b8ca	\N	10.89.0.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 02:23:35	t	2026-05-21 02:18:35.817
8b98c43b-0eca-47b1-85ca-d801ebe332c7	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_a89ae49c-2414-4ff8-a3eb-01c70b96339a	\N	10.89.0.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 02:23:39	t	2026-05-21 02:18:39.46
7e21da74-f869-4c48-9744-0768ab4114ee	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_935c9699-2be9-4c62-8777-39cdc0d6205d	\N	10.89.0.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 02:23:39	t	2026-05-21 02:18:39.524
4752fcb4-f469-41b2-9575-f3c2b2c97d85	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_5f366c22-1906-458d-b43d-467c90d764a3	\N	10.89.0.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 02:23:46	t	2026-05-21 02:18:46.506
23632d49-904e-450b-949f-94286f5bb6bd	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_0d0a3fcf-e1ec-401c-b1c4-e36f5321818a	\N	10.89.0.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 02:23:46	t	2026-05-21 02:18:46.576
6c4d2b47-025f-411f-bc37-b9adb5bb2fed	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_c5caba7b-eb26-4b9d-9465-218b227b6199	\N	10.89.0.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 02:23:58	t	2026-05-21 02:18:59.007
df156478-02bb-4bec-bcaf-9f952689df39	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_1947c712-5eab-4fae-aea0-986448d55c41	\N	10.89.0.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 02:23:58	t	2026-05-21 02:18:59.081
03a00780-b44b-43f7-a07b-84a19765a453	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_81e24ee4-bbf0-412b-a4df-78cb222c8027	\N	10.89.0.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 02:28:29	t	2026-05-21 02:23:29.943
34f260ec-f3d3-4f9c-83c2-2a6a42c10104	086c7a33-2f97-46ec-bed3-0ee95ee7a609	sess_97069dbd-96dc-4645-845c-eabec621ce9b	\N	10.89.0.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-21 02:28:29	t	2026-05-21 02:23:29.987
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, "keycloakId", email, "firstName", "lastName", phone, avatar, "roleId", "isActive", "lastLoginAt", "createdAt", "updatedAt") FROM stdin;
e7f50ad4-1b4f-4755-9b48-43efbe1a5f8f	8f8d03f8-fb78-4607-95bb-4c2d6f3d99e6	cajero@inventory.local	Cajero	Usuario	\N	\N	7b2f97e5-a88f-446a-8d20-69ad72235192	t	2026-05-12 05:18:38.312	2026-05-12 05:18:25.632	2026-05-12 05:18:38.313
7d522b83-f005-46be-a3e8-df1f3a51ea50	594bc2a3-4394-4b42-8132-3f3d8612b0b9	cajero@gmail.com	cajero	cajero	3214213423	\N	7b2f97e5-a88f-446a-8d20-69ad72235192	t	2026-05-18 23:07:07.97	2026-05-12 05:00:52.234	2026-05-18 23:07:07.97
086c7a33-2f97-46ec-bed3-0ee95ee7a609	63c327a9-72cf-4995-9f42-e223a52ac774	admin@inventory.local	Super	Administrador	\N	\N	f4d40c98-f955-4565-b135-d96cdb5c5c4c	t	2026-05-21 02:23:30.002	2026-05-12 00:40:18.463	2026-05-21 02:23:30.003
8f8c12c0-5df8-4b39-9b4d-6fde7d23f6cc	01c8c022-0984-4dd7-b2b1-a049034d8c6d	administrador@gmail.com	administrador1	1	32132345345	\N	4af902e0-a9a1-4edb-a2bf-cd2295ab3ecc	t	2026-05-18 23:06:38.057	2026-05-18 20:58:09.98	2026-05-18 23:06:38.058
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: app_settings app_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: cash_movements cash_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cash_movements
    ADD CONSTRAINT cash_movements_pkey PRIMARY KEY (id);


--
-- Name: cash_registers cash_registers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cash_registers
    ADD CONSTRAINT cash_registers_pkey PRIMARY KEY (id);


--
-- Name: cash_sessions cash_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cash_sessions
    ADD CONSTRAINT cash_sessions_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: company_settings company_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_settings
    ADD CONSTRAINT company_settings_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: inventory_adjustments inventory_adjustments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_adjustments
    ADD CONSTRAINT inventory_adjustments_pkey PRIMARY KEY (id);


--
-- Name: inventory inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_pkey PRIMARY KEY (id);


--
-- Name: invoice_numbering invoice_numbering_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_numbering
    ADD CONSTRAINT invoice_numbering_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: kardex_entries kardex_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kardex_entries
    ADD CONSTRAINT kardex_entries_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: product_alternate_units product_alternate_units_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_alternate_units
    ADD CONSTRAINT product_alternate_units_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: purchase_items purchase_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_items
    ADD CONSTRAINT purchase_items_pkey PRIMARY KEY (id);


--
-- Name: purchases purchases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: sale_adjustment_lines sale_adjustment_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_adjustment_lines
    ADD CONSTRAINT sale_adjustment_lines_pkey PRIMARY KEY (id);


--
-- Name: sale_adjustments sale_adjustments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_adjustments
    ADD CONSTRAINT sale_adjustments_pkey PRIMARY KEY (id);


--
-- Name: sale_items sale_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_pkey PRIMARY KEY (id);


--
-- Name: sales sales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: units_of_measure units_of_measure_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.units_of_measure
    ADD CONSTRAINT units_of_measure_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: app_settings_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX app_settings_key_key ON public.app_settings USING btree (key);


--
-- Name: audit_logs_module_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "audit_logs_module_createdAt_idx" ON public.audit_logs USING btree (module, "createdAt");


--
-- Name: audit_logs_userId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "audit_logs_userId_createdAt_idx" ON public.audit_logs USING btree ("userId", "createdAt");


--
-- Name: cash_registers_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX cash_registers_name_key ON public.cash_registers USING btree (name);


--
-- Name: customers_documentNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "customers_documentNumber_key" ON public.customers USING btree ("documentNumber");


--
-- Name: inventory_productId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "inventory_productId_key" ON public.inventory USING btree ("productId");


--
-- Name: invoice_numbering_prefix_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX invoice_numbering_prefix_key ON public.invoice_numbering USING btree (prefix);


--
-- Name: invoices_prefix_number_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX invoices_prefix_number_key ON public.invoices USING btree (prefix, number);


--
-- Name: invoices_saleId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "invoices_saleId_key" ON public.invoices USING btree ("saleId");


--
-- Name: kardex_entries_productId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "kardex_entries_productId_createdAt_idx" ON public.kardex_entries USING btree ("productId", "createdAt");


--
-- Name: notifications_userId_isRead_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "notifications_userId_isRead_idx" ON public.notifications USING btree ("userId", "isRead");


--
-- Name: permissions_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX permissions_code_key ON public.permissions USING btree (code);


--
-- Name: product_alternate_units_productId_unitOfMeasureId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "product_alternate_units_productId_unitOfMeasureId_key" ON public.product_alternate_units USING btree ("productId", "unitOfMeasureId");


--
-- Name: products_barcode_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX products_barcode_key ON public.products USING btree (barcode);


--
-- Name: products_sku_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX products_sku_key ON public.products USING btree (sku);


--
-- Name: purchases_number_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX purchases_number_key ON public.purchases USING btree (number);


--
-- Name: role_permissions_roleId_permissionId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "role_permissions_roleId_permissionId_key" ON public.role_permissions USING btree ("roleId", "permissionId");


--
-- Name: roles_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX roles_name_key ON public.roles USING btree (name);


--
-- Name: sale_adjustments_saleId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "sale_adjustments_saleId_idx" ON public.sale_adjustments USING btree ("saleId");


--
-- Name: sales_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "sales_createdAt_idx" ON public.sales USING btree ("createdAt");


--
-- Name: sales_number_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX sales_number_key ON public.sales USING btree (number);


--
-- Name: suppliers_nit_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX suppliers_nit_key ON public.suppliers USING btree (nit);


--
-- Name: system_settings_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX system_settings_key_key ON public.system_settings USING btree (key);


--
-- Name: units_of_measure_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX units_of_measure_code_key ON public.units_of_measure USING btree (code);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_keycloakId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "users_keycloakId_key" ON public.users USING btree ("keycloakId");


--
-- Name: audit_logs audit_logs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cash_movements cash_movements_sessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cash_movements
    ADD CONSTRAINT "cash_movements_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES public.cash_sessions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cash_movements cash_movements_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cash_movements
    ADD CONSTRAINT "cash_movements_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: cash_sessions cash_sessions_cashRegisterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cash_sessions
    ADD CONSTRAINT "cash_sessions_cashRegisterId_fkey" FOREIGN KEY ("cashRegisterId") REFERENCES public.cash_registers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: cash_sessions cash_sessions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cash_sessions
    ADD CONSTRAINT "cash_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: categories categories_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: documents documents_uploadedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT "documents_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: inventory_adjustments inventory_adjustments_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_adjustments
    ADD CONSTRAINT "inventory_adjustments_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: inventory_adjustments inventory_adjustments_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_adjustments
    ADD CONSTRAINT "inventory_adjustments_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: inventory inventory_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT "inventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: invoices invoices_saleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT "invoices_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES public.sales(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: kardex_entries kardex_entries_operationalUnitId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kardex_entries
    ADD CONSTRAINT "kardex_entries_operationalUnitId_fkey" FOREIGN KEY ("operationalUnitId") REFERENCES public.units_of_measure(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: kardex_entries kardex_entries_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kardex_entries
    ADD CONSTRAINT "kardex_entries_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: kardex_entries kardex_entries_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kardex_entries
    ADD CONSTRAINT "kardex_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: notifications notifications_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payments payments_saleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "payments_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES public.sales(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_alternate_units product_alternate_units_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_alternate_units
    ADD CONSTRAINT "product_alternate_units_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_alternate_units product_alternate_units_unitOfMeasureId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_alternate_units
    ADD CONSTRAINT "product_alternate_units_unitOfMeasureId_fkey" FOREIGN KEY ("unitOfMeasureId") REFERENCES public.units_of_measure(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: products products_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_contentUnitId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "products_contentUnitId_fkey" FOREIGN KEY ("contentUnitId") REFERENCES public.units_of_measure(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_unitOfMeasureId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "products_unitOfMeasureId_fkey" FOREIGN KEY ("unitOfMeasureId") REFERENCES public.units_of_measure(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: purchase_items purchase_items_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_items
    ADD CONSTRAINT "purchase_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: purchase_items purchase_items_purchaseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_items
    ADD CONSTRAINT "purchase_items_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES public.purchases(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: purchase_items purchase_items_purchaseUnitId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_items
    ADD CONSTRAINT "purchase_items_purchaseUnitId_fkey" FOREIGN KEY ("purchaseUnitId") REFERENCES public.units_of_measure(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: purchases purchases_supplierId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT "purchases_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES public.suppliers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: purchases purchases_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT "purchases_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: role_permissions role_permissions_permissionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES public.permissions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sale_adjustment_lines sale_adjustment_lines_adjustmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_adjustment_lines
    ADD CONSTRAINT "sale_adjustment_lines_adjustmentId_fkey" FOREIGN KEY ("adjustmentId") REFERENCES public.sale_adjustments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sale_adjustment_lines sale_adjustment_lines_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_adjustment_lines
    ADD CONSTRAINT "sale_adjustment_lines_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: sale_adjustments sale_adjustments_cashSessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_adjustments
    ADD CONSTRAINT "sale_adjustments_cashSessionId_fkey" FOREIGN KEY ("cashSessionId") REFERENCES public.cash_sessions(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: sale_adjustments sale_adjustments_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_adjustments
    ADD CONSTRAINT "sale_adjustments_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: sale_adjustments sale_adjustments_saleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_adjustments
    ADD CONSTRAINT "sale_adjustments_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES public.sales(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sale_items sale_items_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT "sale_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: sale_items sale_items_saleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT "sale_items_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES public.sales(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sale_items sale_items_saleUnitId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT "sale_items_saleUnitId_fkey" FOREIGN KEY ("saleUnitId") REFERENCES public.units_of_measure(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: sales sales_cashSessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT "sales_cashSessionId_fkey" FOREIGN KEY ("cashSessionId") REFERENCES public.cash_sessions(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: sales sales_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT "sales_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: sales sales_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT "sales_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: user_sessions user_sessions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users users_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict 1zGRfnRA6QfKDuBh8QRSsRu2xZaLDLFKD1HXH87eEufl07bEvd7TVao43H6H9Q0

