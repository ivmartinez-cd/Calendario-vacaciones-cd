--
-- PostgreSQL database dump
--

\restrict a2b5IOZGCLHcbQ3Qh92MfGq3XTS0QU5V5BzessFWgkbzOdemt9bHi0j0XhYZ64g

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: ApprovalDecision; Type: TYPE; Schema: public; Owner: vacasync
--

CREATE TYPE public."ApprovalDecision" AS ENUM (
    'APPROVED',
    'REJECTED'
);


ALTER TYPE public."ApprovalDecision" OWNER TO vacasync;

--
-- Name: EmployeeStatus; Type: TYPE; Schema: public; Owner: vacasync
--

CREATE TYPE public."EmployeeStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE'
);


ALTER TYPE public."EmployeeStatus" OWNER TO vacasync;

--
-- Name: RequestStatus; Type: TYPE; Schema: public; Owner: vacasync
--

CREATE TYPE public."RequestStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE public."RequestStatus" OWNER TO vacasync;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: vacasync
--

CREATE TYPE public."Role" AS ENUM (
    'ADMIN',
    'EMPLOYEE'
);


ALTER TYPE public."Role" OWNER TO vacasync;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ApprovalHistory; Type: TABLE; Schema: public; Owner: vacasync
--

CREATE TABLE public."ApprovalHistory" (
    id text NOT NULL,
    decision public."ApprovalDecision" NOT NULL,
    comment text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "requestId" text NOT NULL,
    "approverId" text NOT NULL
);


ALTER TABLE public."ApprovalHistory" OWNER TO vacasync;

--
-- Name: AuditLog; Type: TABLE; Schema: public; Owner: vacasync
--

CREATE TABLE public."AuditLog" (
    id text NOT NULL,
    action text NOT NULL,
    entity text NOT NULL,
    "entityId" text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "userId" text
);


ALTER TABLE public."AuditLog" OWNER TO vacasync;

--
-- Name: Department; Type: TABLE; Schema: public; Owner: vacasync
--

CREATE TABLE public."Department" (
    id text NOT NULL,
    name text NOT NULL,
    color text DEFAULT '#3b82f6'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Department" OWNER TO vacasync;

--
-- Name: Employee; Type: TABLE; Schema: public; Owner: vacasync
--

CREATE TABLE public."Employee" (
    id text NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    email text NOT NULL,
    "position" text NOT NULL,
    "hireDate" timestamp(3) without time zone NOT NULL,
    "annualVacationDays" integer DEFAULT 22 NOT NULL,
    status public."EmployeeStatus" DEFAULT 'ACTIVE'::public."EmployeeStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "departmentId" text NOT NULL,
    color text DEFAULT '#3b82f6'::text NOT NULL
);


ALTER TABLE public."Employee" OWNER TO vacasync;

--
-- Name: Holiday; Type: TABLE; Schema: public; Owner: vacasync
--

CREATE TABLE public."Holiday" (
    id text NOT NULL,
    name text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "deductsVacation" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Holiday" OWNER TO vacasync;

--
-- Name: Notification; Type: TABLE; Schema: public; Owner: vacasync
--

CREATE TABLE public."Notification" (
    id text NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    read boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "userId" text NOT NULL
);


ALTER TABLE public."Notification" OWNER TO vacasync;

--
-- Name: SystemConfig; Type: TABLE; Schema: public; Owner: vacasync
--

CREATE TABLE public."SystemConfig" (
    id text DEFAULT 'singleton'::text NOT NULL,
    "seniorityTiers" jsonb DEFAULT '[{"days": 7, "maxYears": 0.5, "minYears": 0}, {"days": 14, "maxYears": 1, "minYears": 0.5}, {"days": 14, "maxYears": 5, "minYears": 1}, {"days": 21, "maxYears": 10, "minYears": 5}, {"days": 21, "maxYears": 15, "minYears": 10}, {"days": 28, "maxYears": 20, "minYears": 15}, {"days": 35, "maxYears": 99, "minYears": 20}]'::jsonb NOT NULL,
    "minAdvanceNoticeDays" integer DEFAULT 7 NOT NULL,
    "maxOverlapPercent" integer DEFAULT 50 NOT NULL,
    "maxOverlapCount" integer DEFAULT 0 NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "allowAdvanceRequest" boolean DEFAULT true NOT NULL,
    "maxAdvanceDays" integer DEFAULT 0 NOT NULL,
    "nextYearOpenDay" integer DEFAULT 1 NOT NULL,
    "nextYearOpenMonth" integer DEFAULT 10 NOT NULL,
    "allowCarryOver" boolean DEFAULT true NOT NULL,
    "maxCarryOverDays" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."SystemConfig" OWNER TO vacasync;

--
-- Name: User; Type: TABLE; Schema: public; Owner: vacasync
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    role public."Role" DEFAULT 'EMPLOYEE'::public."Role" NOT NULL,
    "resetToken" text,
    "resetExpires" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "employeeId" text
);


ALTER TABLE public."User" OWNER TO vacasync;

--
-- Name: VacationCycle; Type: TABLE; Schema: public; Owner: vacasync
--

CREATE TABLE public."VacationCycle" (
    id text NOT NULL,
    year integer NOT NULL,
    "annualDays" integer NOT NULL,
    "carryOver" integer DEFAULT 0 NOT NULL,
    "isOpen" boolean DEFAULT false NOT NULL,
    "openedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "employeeId" text NOT NULL
);


ALTER TABLE public."VacationCycle" OWNER TO vacasync;

--
-- Name: VacationRequest; Type: TABLE; Schema: public; Owner: vacasync
--

CREATE TABLE public."VacationRequest" (
    id text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    "daysRequested" integer NOT NULL,
    reason text,
    status public."RequestStatus" DEFAULT 'PENDING'::public."RequestStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "employeeId" text NOT NULL,
    "chargedToYear" integer
);


ALTER TABLE public."VacationRequest" OWNER TO vacasync;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: vacasync
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


ALTER TABLE public._prisma_migrations OWNER TO vacasync;

--
-- Data for Name: ApprovalHistory; Type: TABLE DATA; Schema: public; Owner: vacasync
--

COPY public."ApprovalHistory" (id, decision, comment, "createdAt", "requestId", "approverId") FROM stdin;
c7ed5a92-181b-4b3d-b359-ee43522e6429	REJECTED	\N	2026-06-19 14:55:25.594	b81b4fc0-2060-4672-9c14-74275c61885e	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
3218ae62-6325-4c43-bf05-469a1e8e543a	REJECTED	\N	2026-06-19 14:55:31.816	3f104a8c-b85b-4f3b-9c14-58ba37e793d3	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
f7a09ecf-8fb1-4793-a153-0eaae90db809	APPROVED	\N	2026-06-19 17:12:08.725	aaaba7f1-381c-4972-ae73-3d8503b4941b	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
2cd35465-8247-4e06-aa98-e505931adcde	APPROVED	\N	2026-06-19 17:20:30.071	4cd7fea7-428b-47ba-8ab5-b4fd1ae95271	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
4d750aaa-b23b-447e-9700-fd851e9abb2a	APPROVED	\N	2026-06-19 17:20:36.778	1ceb7483-6a34-4a7c-97ce-139e1fb75632	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
089042a0-25c1-4285-8c2b-25e43a5379f4	APPROVED	\N	2026-06-19 18:03:51.729	82a7829f-456f-46fb-b52a-f157378b482f	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
e82d38f1-750b-40eb-81d2-5fddde3a4a6f	APPROVED	\N	2026-06-19 18:09:48.428	cd74333a-b4d1-49e2-8c3a-91a126a96776	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
caf61ebb-74a2-4c4b-abc9-69030ba558fe	REJECTED	\N	2026-06-19 18:12:06.55	f56205c1-49cc-4353-823b-37f01605b084	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
541b8cfc-12b8-406c-b92e-bf004d09748e	APPROVED	\N	2026-06-19 18:15:48.823	212a3319-e2f8-450d-b0ce-69c2413575e6	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
b90bd76f-3fa4-45bd-818f-315c9a6ab193	APPROVED	\N	2026-06-19 18:28:12.685	212a3319-e2f8-450d-b0ce-69c2413575e6	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
0b1ba1f6-26d0-449c-9c92-e30350150c4c	APPROVED	\N	2026-06-19 18:32:06.329	1ceb7483-6a34-4a7c-97ce-139e1fb75632	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
0383a1a3-dfe1-4bd1-ad97-bc6a9861c2c0	APPROVED	\N	2026-06-19 18:38:34.179	1ceb7483-6a34-4a7c-97ce-139e1fb75632	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
28da0867-6a73-480c-b527-c49cbf9757bb	APPROVED	\N	2026-06-19 19:17:56.614	82a7829f-456f-46fb-b52a-f157378b482f	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
9e6f1b71-d029-49e1-91f7-f509dbcf13d9	APPROVED	\N	2026-06-19 19:54:49.965	82a7829f-456f-46fb-b52a-f157378b482f	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
a1be4b74-ab2d-4b83-820f-80b3c89aa4ba	APPROVED	\N	2026-06-19 19:58:48.713	bfa779f6-55ef-4567-8830-270191caabf2	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
c18f3e20-bfa6-4e3f-8219-15a356007501	APPROVED	\N	2026-06-22 12:28:20.552	e41f8780-3883-469d-97a6-714552b2555c	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
50343256-fb5c-463c-a52d-127d03a90fcd	APPROVED	\N	2026-06-22 13:54:28.448	03164f42-23a1-42f6-99ec-ec172c8389fd	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
84038bef-143c-4f48-9b9e-ffd26b427ca0	APPROVED	\N	2026-06-22 13:54:35.999	be28e887-165f-4927-94d1-ca8f0a2a951d	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
dbf93d6b-a3ec-4a96-8eaf-8c0557a9240a	APPROVED	\N	2026-06-22 13:54:41.967	bb3e42ce-e13a-4a0c-8b41-d22ebbc0e20d	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
65d13443-0da1-4781-b053-857fef689b26	APPROVED	\N	2026-06-22 13:54:47.371	cc25555a-3dee-429e-86f8-2ade6e0ce4e2	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
ff62a24c-dc4e-4774-b810-2380b88ede8b	APPROVED	\N	2026-06-22 13:54:52.574	b1ddbbe6-96e9-4ff0-a0c3-1623169c907c	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
cf002e5c-6bda-4dbb-bacd-3cd2449c8305	APPROVED	\N	2026-06-22 13:54:59.152	8a3a5971-cc52-41e1-8eac-c64bf03711b3	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
e5c90d6b-70e2-4403-bdcf-b52927465718	APPROVED	\N	2026-06-22 13:55:14.256	12530124-c11f-4a7c-ad37-8a5f2a1837b3	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
660e153b-ba79-4581-9d3a-924928a24cd1	APPROVED	\N	2026-06-22 13:55:20.098	686a912a-3c75-47f3-8acd-89bd35b96484	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
c5287fb4-f77e-40ee-b205-1ce037bea65b	APPROVED	\N	2026-06-22 13:55:25.503	64efa627-465e-4593-8a26-2c4c5b5ccd43	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
e236ab79-9f77-4146-9793-ba153f22b4da	APPROVED	\N	2026-06-22 13:55:30.593	01bd86c2-2753-4ed3-ba49-ddf2c3bfccf6	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
3b226034-8eff-4bdb-a923-7f953c72b1e1	APPROVED	\N	2026-06-22 13:55:35.934	24b10560-e968-45ab-ac7f-88ad11d99d51	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
afe4d33c-3e55-44d9-a6ea-712345a796d8	APPROVED	\N	2026-06-22 13:55:41.535	28d4add0-c540-44a3-8179-083b55b2815e	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
679afb64-7218-479b-b698-7aaad4abca13	APPROVED	\N	2026-06-22 13:55:46.601	971b5d64-db87-4aaf-bb1f-33f9638da1d0	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
fbd18966-f71e-4c06-8700-0df4bf1517d7	APPROVED	Corresponden a 2027	2026-06-22 14:23:24.178	9d66cc35-521c-46af-a50a-0a5313a8eec7	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
1377f499-f963-49da-8380-3842e8375c75	APPROVED	\N	2026-06-22 14:24:55.457	f48a57ce-f4a5-4110-9826-8b417547bbc5	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
abcc25cd-7a3a-4b77-9b5d-f251e52ee854	APPROVED	\N	2026-06-22 15:07:40.169	b778ab65-9c07-41e2-ba59-5fe77f1e4f83	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
79e5c374-5c9f-44bd-9c59-8a2e1fea156a	APPROVED	\N	2026-06-23 16:00:42.679	23b14177-f462-4480-8277-cec894d9522d	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
103980c5-6e54-494b-91d0-faf36545468b	APPROVED	\N	2026-06-23 16:15:53.027	c343d516-5a4a-4f2c-8b20-25e59c1c61b9	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
8d2fd0e8-094c-4710-9693-167b3d6c1d3e	REJECTED	\N	2026-06-23 18:12:52.711	9d66cc35-521c-46af-a50a-0a5313a8eec7	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
232062a1-b8bb-421b-8577-ea1fef87ff6c	REJECTED	\N	2026-06-24 16:59:27.751	b4818b1a-b554-47bf-ab64-9501b8c11e3d	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
7f23bcf6-fe17-4ada-982a-b50ca2e12b26	REJECTED	\N	2026-06-25 14:29:49.755	b4818b1a-b554-47bf-ab64-9501b8c11e3d	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
f51a343a-210f-40da-93b8-aac745c7c8fc	REJECTED	\N	2026-06-25 14:30:55.908	b778ab65-9c07-41e2-ba59-5fe77f1e4f83	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
\.


--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: vacasync
--

COPY public."AuditLog" (id, action, entity, "entityId", metadata, "createdAt", "userId") FROM stdin;
7eabfa5d-e49f-4e9c-8199-fc30f2faefb1	LOGIN	User	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc	\N	2026-06-17 17:38:30.173	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
3b88f8c2-c3c6-45d5-9d01-c341e509eff0	LOGIN	User	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc	\N	2026-06-17 17:39:20.257	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
cdd9bc1d-baf8-4fa7-a9ae-4e759bfaf79f	CREATE	Department	5dbc4523-badf-40cc-989c-9bea7450fa74	\N	2026-06-17 17:42:22.735	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
53ab66f4-d427-4234-b1c2-2a3c1454d582	CREATE	Department	4da6adca-a95b-4cc1-ac37-ddabecc06be3	\N	2026-06-17 17:42:57.198	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
052f01bf-a4c2-40db-9e36-f5eac595e52b	CREATE	Department	7c7118a2-c7a2-4217-a821-bba65700615f	\N	2026-06-17 17:43:02.974	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
033bbc16-e2fd-48af-9429-c13a5f2aa1ba	CREATE	Employee	a21baef8-bea4-4d1d-8d80-3251b63dea6d	\N	2026-06-17 17:43:48.144	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
0e69c06d-58ff-41d3-8c36-f26a2c5afb83	CREATE	Employee	01d66c3a-7545-418d-8528-22e3bdca5df0	\N	2026-06-17 17:44:19.566	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
2f165901-4ae2-4d05-8dd8-1f522c1ad026	CREATE	Employee	fd92cacc-c90b-4e46-a443-daadf138d834	\N	2026-06-17 17:44:58.925	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
ceed9bd4-cdf9-4705-89f8-b5196efc6731	CREATE	VacationRequest	b81b4fc0-2060-4672-9c14-74275c61885e	\N	2026-06-17 17:47:52.476	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
be595010-617f-4496-85d9-46a7c8b91c1c	LOGIN	User	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc	\N	2026-06-17 17:49:10.784	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
ab68e020-2bcb-415b-b2ac-98d557eadbca	CREATE	Holiday	4cd35f7e-13eb-4fb4-8fef-551e9ea678da	\N	2026-06-17 17:49:10.888	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
5e0c9f53-6467-494d-87a3-4371d03eb982	LOGIN	User	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc	\N	2026-06-17 17:55:08.174	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
4df4d657-2efa-40bb-a8f4-ebf744b66cbd	LOGIN	User	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc	\N	2026-06-17 17:57:18.472	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
7ad8fb55-b1a0-421b-9395-01127fa6a179	LOGIN	User	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc	\N	2026-06-17 17:57:27.085	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
41508dc2-4fe5-4c9d-90fc-907589786ba4	LOGIN	User	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc	\N	2026-06-17 17:57:47.788	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
288e4509-ca76-44ce-8008-75f05a221e48	UPDATE	Holiday	4cd35f7e-13eb-4fb4-8fef-551e9ea678da	\N	2026-06-17 17:57:47.887	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
6cfbbb02-698e-4df8-8666-023f2a873656	LOGIN	User	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc	\N	2026-06-17 17:57:53.479	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
e22143df-34e8-46b0-ac0b-978f838b4972	LOGIN	User	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc	\N	2026-06-17 18:03:26.991	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
cdd32c16-9d9a-4c54-8ed1-fe39ae0969b6	LOGIN	User	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc	\N	2026-06-17 18:19:47.165	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
16bdda29-fd6f-4bfd-a941-ff7f8f109b5a	LOGIN	User	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc	\N	2026-06-17 18:19:56.921	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
e84c02c1-24cb-43b7-b81d-5a7314cf4a86	LOGIN	User	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc	\N	2026-06-17 18:21:54.964	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
ec8f37ee-62c9-45a7-b9f4-7adf20b8ca85	CREATE	Holiday	af4c9ce9-e59d-4585-9068-bcf8fa55fc75	\N	2026-06-17 18:24:36.744	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
9c30b871-5428-4aab-a548-13103a7f93d3	CREATE	VacationRequest	0132a672-fac3-485d-ae15-a7e40251a658	\N	2026-06-17 18:25:13.789	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
16701c8c-7d7f-4f13-a454-c04bdf72ad13	UPDATE	Holiday	af4c9ce9-e59d-4585-9068-bcf8fa55fc75	\N	2026-06-17 18:25:56.435	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
6dbb539b-89aa-40db-a3e7-716b20c5ed03	UPDATE	Holiday	af4c9ce9-e59d-4585-9068-bcf8fa55fc75	\N	2026-06-17 18:26:23.647	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
262cd121-6d6d-4595-9d92-85f1948a002b	UPDATE	Holiday	af4c9ce9-e59d-4585-9068-bcf8fa55fc75	\N	2026-06-17 18:28:05.188	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
3395ad3d-0148-4882-918c-5f4c03ffc069	DELETE	VacationRequest	0132a672-fac3-485d-ae15-a7e40251a658	\N	2026-06-17 18:28:32.527	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
b291d586-cdf6-4589-bab0-1ebfcc2c1914	CREATE	VacationRequest	3f104a8c-b85b-4f3b-9c14-58ba37e793d3	\N	2026-06-17 18:28:53.322	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
7c58c269-99ea-458f-b6fe-b78416110a3a	LOGIN	User	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc	\N	2026-06-17 18:36:49.89	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
e2c5c64e-717d-4358-ab6c-3002729b3837	CREATE	VacationRequest	12a66f4a-8f8d-455c-a99c-8445728bd9f6	\N	2026-06-17 18:37:19.251	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
82c5aa86-282a-4111-b32b-67e31c0adb85	DELETE	Employee	a21baef8-bea4-4d1d-8d80-3251b63dea6d	\N	2026-06-17 18:38:15.133	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
6eb2729d-416a-4708-a9f2-e537888137d6	LOGIN	User	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc	\N	2026-06-17 19:09:12.022	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
eb99ff79-0f1a-4aa1-a94a-017d53ecbb02	CREATE	Employee	aee74c84-0cea-406c-9d42-e0637f173a2c	\N	2026-06-17 19:22:19.19	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
60fcb6da-e930-48f5-99ad-a0311e40c98b	LOGIN	User	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc	\N	2026-06-18 11:52:39.161	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
c567f362-a8d0-45db-a0bf-8fe5a8295b42	LOGIN	User	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc	\N	2026-06-19 14:50:12.464	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
6dd5ee86-dd50-4d95-b03c-10abd0d1d948	APPROVE	VacationRequest	106aef48-2ff8-421c-968e-0dd01576e6c0	{"comment": "seis dias es un abuso"}	2026-06-19 14:54:15.907	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
9a0a3116-94de-4478-b0f3-f89655223054	REJECT	VacationRequest	b81b4fc0-2060-4672-9c14-74275c61885e	{}	2026-06-19 14:55:29.386	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
0c145f51-32ca-4f21-b6d6-356a075cd984	REJECT	VacationRequest	3f104a8c-b85b-4f3b-9c14-58ba37e793d3	{}	2026-06-19 14:55:35.661	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
53308458-b94e-4454-a5ad-05a53791392a	CREATE	VacationRequest	a536d115-4787-4c15-9429-94f3786857f0	\N	2026-06-19 14:58:22.868	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
9b80f046-d402-4d50-95ec-2589f23ec32a	APPROVE	VacationRequest	a536d115-4787-4c15-9429-94f3786857f0	{"comment": "Ya tomadas"}	2026-06-19 14:58:44.426	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
efedd2a1-d9c3-407b-9907-50464634c69c	CREATE	Holiday	48806ee7-983a-41fc-8905-206ad85f667c	\N	2026-06-19 15:25:52.648	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
e5d85760-2c5d-4c7e-a798-8ad404ec9b3c	CREATE	Holiday	8d3560b4-9ced-4a96-996e-e80ac85123d9	\N	2026-06-19 15:26:04.164	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
8238f8ab-414d-4597-9845-be153bc9ba68	CREATE	Holiday	37ec176e-f162-4298-a5f9-fd704aa30b3b	\N	2026-06-19 15:26:11.973	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
8995d9ac-8679-4397-a114-97aaf1fa9d33	CREATE	Holiday	7ebfcea7-63b5-41a0-91dd-9827fefa89a5	\N	2026-06-19 15:26:27.528	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
8831c759-95cf-482e-8772-07766f91383e	CREATE	Holiday	eb0f7f04-65b4-4067-9ad4-dc3904508f53	\N	2026-06-19 15:26:35.452	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
6932b4e2-c501-4a05-b355-3b4eb7dae71d	CREATE	Holiday	3e6aed84-8a37-4876-831e-fe3bb1bdfdb4	\N	2026-06-19 15:26:45.435	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
e8474b2c-d2fc-451f-937a-d672a0d28e43	CREATE	Holiday	aea1bf6d-c3ee-4556-9ebd-dbff70e056ce	\N	2026-06-19 15:27:00.659	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
0d259619-9cd7-4f28-bfce-c780b8977fdd	CREATE	Holiday	c1ff396b-b3d4-4a14-b8dc-3d0e2ccdd278	\N	2026-06-19 15:27:11.136	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
9615d0e4-367a-42b5-b2be-6493b95b20ff	CREATE	Holiday	714ef280-abdd-4f11-9e7a-c74d11080431	\N	2026-06-19 15:27:21.024	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
3fe44ce4-5280-46cc-9a4e-93e8d10543eb	CREATE	Holiday	fe615108-08ad-4e1f-8170-c3e348426705	\N	2026-06-19 15:27:32.257	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
23b51e81-93d2-42eb-873c-469087fab604	CREATE	Holiday	3ae1ef01-c930-461e-a037-0d346d22a5c2	\N	2026-06-19 15:27:39.712	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
ed843cbf-de26-4759-89a3-783cc2cadff1	CREATE	Holiday	71e3c185-3dba-4762-a440-ec6b80e1bc6c	\N	2026-06-19 15:27:50.674	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
fec345a6-d2b1-4488-aef8-06026842bc9b	CREATE	Holiday	3ce149e0-db5c-412a-832c-b8da5632e227	\N	2026-06-19 15:27:58.43	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
5ba512d6-c0f7-4ceb-9a29-11b096526ad8	CREATE	Holiday	ea5214b8-4373-420b-a256-7e226e668aa8	\N	2026-06-19 15:28:08.125	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
6037aad9-4822-4cbb-b20b-83439c94c07b	CREATE	Holiday	6ce5e097-cb06-4d64-9b2d-651ad5468279	\N	2026-06-19 15:28:14.561	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
78433409-7d1e-471b-9a91-f60354d1b9e9	UPDATE	Holiday	af4c9ce9-e59d-4585-9068-bcf8fa55fc75	\N	2026-06-19 15:28:39.958	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
8336a439-d1b2-4867-b321-60892159bfe8	CREATE	Holiday	aab70625-d50f-419c-a6f6-8bcf3f5563d1	\N	2026-06-19 15:29:09.325	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
5ecf11f9-720d-4393-b807-90a695aa6e89	UPDATE	Holiday	af4c9ce9-e59d-4585-9068-bcf8fa55fc75	\N	2026-06-19 15:29:16.229	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
b94e1767-367f-4c38-8df5-1a60668f5aae	CREATE	Holiday	4df5fe92-2167-4afa-8b08-2c986bbc25af	\N	2026-06-19 15:29:52.067	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
8517d979-24c9-4356-8186-aa7479754c6b	CREATE	Employee	9c066787-94f9-4d7f-ba5f-ea5e94c69e3a	\N	2026-06-19 15:41:03.844	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
3130a844-f069-4520-a6ac-4cf80d05fce2	CREATE	Employee	7d8d086f-677a-489b-a73e-ca38dc5ccb64	\N	2026-06-19 15:41:28.815	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
0da19ae5-3a98-49cb-a288-caac5b66215a	CREATE	Employee	244d708d-255f-48c1-8f87-ea822ea1bf8d	\N	2026-06-19 15:41:53.194	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
9cf36473-9b24-493e-9c1c-9fc6ff510458	CREATE	Employee	49ba9106-648f-4441-802a-be4cd5a244d6	\N	2026-06-19 15:43:06.588	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
34e02f74-bef4-4190-91bc-8ab672f39eea	UPDATE	Department	4da6adca-a95b-4cc1-ac37-ddabecc06be3	\N	2026-06-19 15:47:03.432	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
3f742bf6-b10d-4f63-98af-a21855c3a871	UPDATE	Department	7c7118a2-c7a2-4217-a821-bba65700615f	\N	2026-06-19 15:47:18.094	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
5234efbe-bd98-4816-8ae6-232787eb82c4	CREATE	Department	175b8d3d-21a3-4691-9aa4-e74f2b892ba9	\N	2026-06-19 15:47:31.736	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
661915a8-83a5-4399-a915-c5fae3109940	CREATE	Department	1a07312a-661d-4511-93b7-bccbf63962fb	\N	2026-06-19 15:47:41.188	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
df94a5c5-23dc-4e29-b639-4c8af18b5739	CREATE	Department	23f1961d-ccaf-467f-a37f-541b4d09e91b	\N	2026-06-19 15:47:54.614	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
782c9540-c212-4f47-bf03-0912fa4607fb	UPDATE	Department	23f1961d-ccaf-467f-a37f-541b4d09e91b	\N	2026-06-19 15:48:03.393	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
ab4579a8-78ee-4a2e-8f3a-ac031aee8c50	UPDATE	Department	4da6adca-a95b-4cc1-ac37-ddabecc06be3	\N	2026-06-19 15:48:16.04	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
dbf91b35-97cf-4e9b-972b-e74d4d0dfdfa	UPDATE	Department	4da6adca-a95b-4cc1-ac37-ddabecc06be3	\N	2026-06-19 15:48:26.615	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
333ba5cd-2b90-4c9a-a3a2-5724fe95e45a	UPDATE	Department	1a07312a-661d-4511-93b7-bccbf63962fb	\N	2026-06-19 15:48:32.452	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
4d8cddc8-a074-4d31-a8a3-954a1039666c	UPDATE	Department	23f1961d-ccaf-467f-a37f-541b4d09e91b	\N	2026-06-19 15:48:36.161	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
1e37b6f8-51bd-4256-9d93-c90935477a1f	UPDATE	Department	175b8d3d-21a3-4691-9aa4-e74f2b892ba9	\N	2026-06-19 15:49:01.797	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
5301a9c0-b5bf-48d8-b6ed-2a5a4c36a5b6	CREATE	Employee	7152f7f9-971f-48e9-bb14-fbc303fdd152	\N	2026-06-19 15:59:40.136	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
e17786db-c292-4a89-8b88-1fb5221b2c68	LOGIN	User	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc	\N	2026-06-19 16:31:40.473	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
c5cb4375-ba30-4fca-9f03-96e7ced9833b	CREATE	Employee	c9400fbf-1bbc-4ef5-9495-ca82c9ec4aa6	\N	2026-06-19 16:53:23.876	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
fa27a65f-b489-48f0-8a60-047faf1ef6de	UPDATE	Employee	c9400fbf-1bbc-4ef5-9495-ca82c9ec4aa6	\N	2026-06-19 16:53:41.901	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
ce98f4f6-71ac-4192-982c-b6c2e75b02be	CREATE	Employee	dc388f7d-9a02-4621-ae39-22556456732b	\N	2026-06-19 16:55:42.012	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
15a59a20-8f25-44f7-a66c-f5c3c73e3e5b	CREATE	Employee	817b6dd3-3d1a-41c6-9d6d-83641093db1b	\N	2026-06-19 17:01:03.484	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
f98a45dc-e989-496c-bd9c-cad04531124a	CREATE	Employee	86c1a1b3-81be-4b3a-b037-907463dd9d14	\N	2026-06-19 17:08:56.104	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
c451e628-1bd6-4c69-ac2f-c61340b85234	CREATE	VacationRequest	aaaba7f1-381c-4972-ae73-3d8503b4941b	\N	2026-06-19 17:12:02.672	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
d6fcb1b1-a7aa-4b15-92a0-4cdebb2e3d16	APPROVE	VacationRequest	aaaba7f1-381c-4972-ae73-3d8503b4941b	{}	2026-06-19 17:12:14.072	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
feaa0285-409a-430c-957a-75db89334d94	CREATE	VacationRequest	a615c4e2-efb4-445e-9686-4a95352748fc	\N	2026-06-19 17:17:15.892	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
e85ad267-bf4f-4e13-81c6-320ef5b23087	DELETE	VacationRequest	a615c4e2-efb4-445e-9686-4a95352748fc	\N	2026-06-19 17:17:43.236	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
03c2a0cb-f930-4d5f-8b00-e7f40c34bfc2	DELETE	VacationRequest	9f3f8488-c320-43e1-867f-7dc01c10397f	\N	2026-06-19 17:17:50.972	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
1f5be7d4-9021-4de4-b27e-84e00a66b66d	CREATE	VacationRequest	4cd7fea7-428b-47ba-8ab5-b4fd1ae95271	\N	2026-06-19 17:18:17.073	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
7e1a8ee0-6b92-49de-941d-802d075060e8	CREATE	VacationRequest	1ceb7483-6a34-4a7c-97ce-139e1fb75632	\N	2026-06-19 17:19:03.422	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
dfa8dddf-de51-4625-bc15-1bd435f40b0b	APPROVE	VacationRequest	4cd7fea7-428b-47ba-8ab5-b4fd1ae95271	{}	2026-06-19 17:20:33.93	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
456da2b0-47d8-49ec-9c63-afb81a689c61	APPROVE	VacationRequest	1ceb7483-6a34-4a7c-97ce-139e1fb75632	{}	2026-06-19 17:20:39.868	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
52aebe6b-7125-4ad2-9e93-023c10d63dac	LOGIN	User	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc	\N	2026-06-19 17:22:41.905	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
1b9043eb-f4c3-4d0e-8911-e5fb16c0be00	UPDATE	SystemConfig	singleton	\N	2026-06-19 17:25:09.577	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
e8ad3923-b702-43da-a900-8296992b3441	UPDATE	Employee	aee74c84-0cea-406c-9d42-e0637f173a2c	\N	2026-06-19 17:25:18.284	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
ba3d223e-08db-4d6a-bd4b-28c766b04ee7	DELETE	Employee	aee74c84-0cea-406c-9d42-e0637f173a2c	\N	2026-06-19 17:25:34.096	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
cc99ecc1-46ab-4fb5-8a8c-87a4878f067c	LOGIN	User	371fded5-10a8-4cdb-a31c-e61d4547e681	\N	2026-06-17 19:22:38.046	\N
4c533a91-fb49-4517-b177-9e0dd50edcd6	LOGIN	User	371fded5-10a8-4cdb-a31c-e61d4547e681	\N	2026-06-19 14:52:08.424	\N
579df963-5a83-4d6e-9995-fe4c05d379b6	CREATE	VacationRequest	106aef48-2ff8-421c-968e-0dd01576e6c0	\N	2026-06-19 14:52:54.5	\N
2ee28680-b0be-45c9-8f22-c2eef243e282	LOGIN	User	371fded5-10a8-4cdb-a31c-e61d4547e681	\N	2026-06-19 17:15:48.925	\N
3c487cbe-6d21-46a4-9e2c-f4dc3529d41d	CREATE	VacationRequest	9f3f8488-c320-43e1-867f-7dc01c10397f	\N	2026-06-19 17:16:38.385	\N
f8f69a15-3be2-49b1-b68e-1bc995c5f54e	DELETE	Employee	40e74ce9-1e06-4156-931f-48af72235923	\N	2026-06-19 17:34:32.519	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
cc06aec0-f647-4a98-b823-ed3d865c0a87	CREATE	Employee	4a9be2c4-04a0-4b94-86b8-c2e2f863af3a	\N	2026-06-19 17:35:04.693	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
8646b216-4281-4aed-9111-05d15be44935	CREATE	VacationRequest	82a7829f-456f-46fb-b52a-f157378b482f	\N	2026-06-19 18:03:30.058	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
277de874-8107-4b22-b191-67d88911f9d3	APPROVE	VacationRequest	82a7829f-456f-46fb-b52a-f157378b482f	{}	2026-06-19 18:03:55.945	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
a7c3bb13-7c1e-4356-a07c-2fd90ba5be79	CREATE	VacationRequest	cd74333a-b4d1-49e2-8c3a-91a126a96776	\N	2026-06-19 18:09:43.96	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
b12b1709-0cf7-4a22-9d58-f4015fb10e41	APPROVE	VacationRequest	cd74333a-b4d1-49e2-8c3a-91a126a96776	{}	2026-06-19 18:09:53.655	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
c407627b-fd00-4be1-8554-364e1bcfa4ca	CREATE	VacationRequest	f56205c1-49cc-4353-823b-37f01605b084	\N	2026-06-19 18:11:54.943	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
b7faa4c7-e913-4a97-b907-c4818ab3fda6	REJECT	VacationRequest	f56205c1-49cc-4353-823b-37f01605b084	{}	2026-06-19 18:12:11.087	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
c76ab151-6a1b-4102-a782-a2c3888d7117	CREATE	VacationRequest	212a3319-e2f8-450d-b0ce-69c2413575e6	\N	2026-06-19 18:13:27.473	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
27b33ea6-75ee-4b97-8f3b-da7fd442b9fb	APPROVE	VacationRequest	212a3319-e2f8-450d-b0ce-69c2413575e6	{}	2026-06-19 18:15:53.428	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
e8317d5a-2ac9-459f-ab49-975dfbaa02e3	UPDATE	Holiday	4df5fe92-2167-4afa-8b08-2c986bbc25af	\N	2026-06-19 18:18:12.495	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
5eb42c9b-3b87-4fa7-b9bb-98f0b669b332	UPDATE	Holiday	7ebfcea7-63b5-41a0-91dd-9827fefa89a5	\N	2026-06-19 18:18:16.115	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
718fdbea-ffbb-4710-aaf4-511bc7be3c75	UPDATE	VacationRequest	212a3319-e2f8-450d-b0ce-69c2413575e6	\N	2026-06-19 18:28:05.075	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
c028eca0-67bc-4a44-a9ce-91c410452b05	APPROVE	VacationRequest	212a3319-e2f8-450d-b0ce-69c2413575e6	{}	2026-06-19 18:28:17.657	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
91db1d45-9264-47cd-b211-c38325fe9144	UPDATE	VacationRequest	1ceb7483-6a34-4a7c-97ce-139e1fb75632	\N	2026-06-19 18:31:56.153	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
92484d2b-3437-4a05-ab99-2c722da00110	APPROVE	VacationRequest	1ceb7483-6a34-4a7c-97ce-139e1fb75632	{}	2026-06-19 18:32:09.402	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
7d6ca279-4900-4b41-87c6-7e083db03746	UPDATE	VacationRequest	1ceb7483-6a34-4a7c-97ce-139e1fb75632	\N	2026-06-19 18:33:22.85	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
166746ca-d458-4616-91d4-b674337a116f	APPROVE	VacationRequest	1ceb7483-6a34-4a7c-97ce-139e1fb75632	{"days": 14, "endDate": "2026-12-22", "employee": "Mariana  Rodriguez", "startDate": "2026-12-09"}	2026-06-19 18:38:38.712	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
932da7c7-b0af-4161-8f67-e2cadcc3ea50	UPDATE	VacationRequest	82a7829f-456f-46fb-b52a-f157378b482f	{"days": 10, "endDate": "2026-12-31", "employee": "Maria Jose Vela", "startDate": "2026-12-21", "previousEnd": "2026-12-31", "previousStart": "2026-12-21"}	2026-06-19 19:17:48.316	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
f4e50d5b-40b8-4b8f-8493-f1ef5f3ed3bf	APPROVE	VacationRequest	82a7829f-456f-46fb-b52a-f157378b482f	{"days": 10, "endDate": "2026-12-31", "employee": "Maria Jose Vela", "startDate": "2026-12-21"}	2026-06-19 19:18:00.677	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
65f9d58f-9f0a-4f57-8dce-f140da07a69b	CREATE	Holiday	4753dc78-e401-4f1b-b24e-c562137a0403	{"date": "2026-12-24", "name": "No laborable"}	2026-06-19 19:18:56.767	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
704f649d-4487-4a85-bff5-ffe02643cdf3	UPDATE	VacationRequest	82a7829f-456f-46fb-b52a-f157378b482f	{"days": 14, "endDate": "2027-01-01", "employee": "Maria Jose Vela", "startDate": "2026-12-21", "previousEnd": "2026-12-31", "previousStart": "2026-12-21"}	2026-06-19 19:54:45.506	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
71aff4b4-f455-48a0-9b1d-91a18c846ebf	APPROVE	VacationRequest	82a7829f-456f-46fb-b52a-f157378b482f	{"days": 14, "endDate": "2027-01-01", "employee": "Maria Jose Vela", "startDate": "2026-12-21"}	2026-06-19 19:54:54.264	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
ee45c890-63c6-4e43-b838-fa11bb5cdc16	CREATE	VacationRequest	bfa779f6-55ef-4567-8830-270191caabf2	{"days": 14, "endDate": "2026-03-03", "employee": "Ivan Martinez", "startDate": "2026-02-18"}	2026-06-19 19:56:57.803	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
15abac7b-5ce9-42f7-bf91-286225026a55	APPROVE	VacationRequest	bfa779f6-55ef-4567-8830-270191caabf2	{"days": 14, "endDate": "2026-03-03", "employee": "Ivan Martinez", "startDate": "2026-02-18"}	2026-06-19 19:58:52.596	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
355c5c30-1ceb-4b02-8e37-2a383738b09f	CREATE	Employee	7fe572ce-b5ab-41d3-b8f9-95ab6c591306	{"email": "aotero@canaldirecto.com.ar", "employee": "Ariel Otero"}	2026-06-22 11:43:54.143	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
9a86f249-5afc-4d91-9f8f-ce45c98f3722	LOGIN	User	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc	{"email": "admin@canaldirecto.com"}	2026-06-22 12:23:01.615	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
7a6bacbb-6099-4738-b85e-3dcf72b173d9	CREATE	VacationRequest	e41f8780-3883-469d-97a6-714552b2555c	{"days": 7, "endDate": "2026-07-24", "employee": "Marcia Pollero", "startDate": "2026-07-20"}	2026-06-22 12:28:14.44	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
48df8b67-b667-4b54-a4c8-13f8a4ed341a	APPROVE	VacationRequest	e41f8780-3883-469d-97a6-714552b2555c	{"days": 7, "endDate": "2026-07-24", "employee": "Marcia Pollero", "startDate": "2026-07-20"}	2026-06-22 12:28:26.574	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
dd2e0350-d61d-4922-86b8-101fc72f9013	CREATE	VacationRequest	03164f42-23a1-42f6-99ec-ec172c8389fd	{"days": 7, "endDate": "2025-11-14", "employee": "Victor Paez", "startDate": "2025-11-10"}	2026-06-22 12:30:34.689	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
e84d0490-6f7a-4494-833d-f93bb8fd47e6	CREATE	VacationRequest	be28e887-165f-4927-94d1-ca8f0a2a951d	{"days": 7, "endDate": "2025-12-20", "employee": "Marcia Pollero", "startDate": "2025-12-15"}	2026-06-22 12:31:07.564	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
194592d6-5a68-407e-8838-de478540ebf5	CREATE	VacationRequest	8a3a5971-cc52-41e1-8eac-c64bf03711b3	{"days": 7, "endDate": "2026-01-30", "employee": "Marcia Pollero", "startDate": "2026-01-26"}	2026-06-22 12:33:14.776	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
759e119a-e0bc-4f8b-9831-4cd1bf08964a	CREATE	VacationRequest	cc25555a-3dee-429e-86f8-2ade6e0ce4e2	{"days": 7, "endDate": "2026-01-16", "employee": "Lucas Ledesma", "startDate": "2026-01-12"}	2026-06-22 12:32:00.739	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
80ebf9a2-ff6a-4102-8b8d-7bc2ea349e04	CREATE	VacationRequest	b1ddbbe6-96e9-4ff0-a0c3-1623169c907c	{"days": 7, "endDate": "2026-01-25", "employee": "Luna Torres", "startDate": "2026-01-19"}	2026-06-22 12:32:30.704	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
b3164c5f-f675-4071-8d67-82d2497c706f	CREATE	VacationRequest	12530124-c11f-4a7c-ad37-8a5f2a1837b3	{"days": 7, "endDate": "2026-02-08", "employee": "Mariano Villegas", "startDate": "2026-02-02"}	2026-06-22 12:33:41.596	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
3d61ea7b-c2a8-46a3-9118-39f538ea7dd7	CREATE	VacationRequest	686a912a-3c75-47f3-8acd-89bd35b96484	{"days": 7, "endDate": "2026-03-29", "employee": "Franco  Lombardi", "startDate": "2026-03-23"}	2026-06-22 12:37:25.555	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
cc64068c-7a08-4ae3-9518-15e60864ca14	CREATE	VacationRequest	64efa627-465e-4593-8a26-2c4c5b5ccd43	{"days": 7, "endDate": "2026-04-12", "employee": "Lucas Ledesma", "startDate": "2026-04-06"}	2026-06-22 12:37:54.922	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
dcfb1294-7922-4341-bbfe-54a5ab16b2e7	CREATE	VacationRequest	01bd86c2-2753-4ed3-ba49-ddf2c3bfccf6	{"days": 14, "endDate": "2026-06-07", "employee": "Franco  Lombardi", "startDate": "2026-05-25"}	2026-06-22 12:38:34.466	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
dade3c88-fd31-4c3d-9d7f-98d329167f3b	UPDATE	VacationRequest	01bd86c2-2753-4ed3-ba49-ddf2c3bfccf6	{"days": 14, "endDate": "2026-06-07", "employee": "Franco  Lombardi", "startDate": "2026-05-25", "previousEnd": "2026-06-07", "previousStart": "2026-05-25"}	2026-06-22 12:38:45.976	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
3404ba5f-566a-417f-9b5a-29c80e7c4940	CREATE	VacationRequest	28d4add0-c540-44a3-8179-083b55b2815e	{"days": 7, "endDate": "2026-07-19", "employee": "Mariano Villegas", "startDate": "2026-07-13"}	2026-06-22 12:39:19.931	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
4ff4a4b5-b51d-4d4f-aa6a-f0441dd97dd4	CREATE	VacationRequest	bb3e42ce-e13a-4a0c-8b41-d22ebbc0e20d	{"days": 7, "endDate": "2026-01-16", "employee": "Fernando  Fontanella", "startDate": "2026-01-12"}	2026-06-22 12:40:06.382	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
291eebcb-2c2d-4840-bee5-e66f9fd54af0	CREATE	VacationRequest	24b10560-e968-45ab-ac7f-88ad11d99d51	{"days": 3, "endDate": "2026-07-08", "employee": "Fernando  Fontanella", "startDate": "2026-07-06"}	2026-06-22 12:40:40.707	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
1c9aeaec-d391-4220-84b4-db1d1f9ba730	CREATE	VacationRequest	971b5d64-db87-4aaf-bb1f-33f9638da1d0	{"days": 7, "endDate": "2026-07-31", "employee": "Fernando  Fontanella", "startDate": "2026-07-27"}	2026-06-22 12:41:45.461	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
b6d38eb2-1a50-448e-b310-3a010f6b9075	LOGIN	User	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc	{"email": "admin@canaldirecto.com"}	2026-06-22 12:51:51.496	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
b5600952-9eb1-40a4-8ca2-b505af33d0b9	APPROVE	VacationRequest	03164f42-23a1-42f6-99ec-ec172c8389fd	{"days": 7, "endDate": "2025-11-14", "employee": "Victor Paez", "startDate": "2025-11-10"}	2026-06-22 13:54:33.969	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
fea39b20-911b-41ae-ac79-22dd153dc579	APPROVE	VacationRequest	be28e887-165f-4927-94d1-ca8f0a2a951d	{"days": 7, "endDate": "2025-12-20", "employee": "Marcia Pollero", "startDate": "2025-12-15"}	2026-06-22 13:54:39.921	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
8119fbe5-de72-43b2-993e-10ad611b5c52	APPROVE	VacationRequest	bb3e42ce-e13a-4a0c-8b41-d22ebbc0e20d	{"days": 7, "endDate": "2026-01-16", "employee": "Fernando  Fontanella", "startDate": "2026-01-12"}	2026-06-22 13:54:45.036	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
31c4a9a2-7ac7-4117-9e19-5b206a515e4c	APPROVE	VacationRequest	cc25555a-3dee-429e-86f8-2ade6e0ce4e2	{"days": 7, "endDate": "2026-01-16", "employee": "Lucas Ledesma", "startDate": "2026-01-12"}	2026-06-22 13:54:50.447	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
1762f384-34f5-4768-b36e-2edc64b8793d	APPROVE	VacationRequest	b1ddbbe6-96e9-4ff0-a0c3-1623169c907c	{"days": 7, "endDate": "2026-01-25", "employee": "Luna Torres", "startDate": "2026-01-19"}	2026-06-22 13:54:56.388	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
0782783a-7d0c-45e0-897d-218d6d66ecbc	APPROVE	VacationRequest	8a3a5971-cc52-41e1-8eac-c64bf03711b3	{"days": 7, "endDate": "2026-01-30", "employee": "Marcia Pollero", "startDate": "2026-01-26"}	2026-06-22 13:55:03.007	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
e989abc1-deae-4dc4-bb9b-c2811beba3cb	APPROVE	VacationRequest	12530124-c11f-4a7c-ad37-8a5f2a1837b3	{"days": 7, "endDate": "2026-02-08", "employee": "Mariano Villegas", "startDate": "2026-02-02"}	2026-06-22 13:55:18.118	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
d189b011-7b19-457f-8004-e24f4f351589	APPROVE	VacationRequest	686a912a-3c75-47f3-8acd-89bd35b96484	{"days": 7, "endDate": "2026-03-29", "employee": "Franco  Lombardi", "startDate": "2026-03-23"}	2026-06-22 13:55:23.846	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
24528a9e-91b0-4923-8e13-9dc0e508b6de	APPROVE	VacationRequest	64efa627-465e-4593-8a26-2c4c5b5ccd43	{"days": 7, "endDate": "2026-04-12", "employee": "Lucas Ledesma", "startDate": "2026-04-06"}	2026-06-22 13:55:28.626	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
a74ad2f4-718c-439c-b774-9f00bfb5ec2b	APPROVE	VacationRequest	01bd86c2-2753-4ed3-ba49-ddf2c3bfccf6	{"days": 14, "endDate": "2026-06-07", "employee": "Franco  Lombardi", "startDate": "2026-05-25"}	2026-06-22 13:55:33.676	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
b1a73480-b4ef-41fa-b44b-1a5e41578e77	APPROVE	VacationRequest	24b10560-e968-45ab-ac7f-88ad11d99d51	{"days": 3, "endDate": "2026-07-08", "employee": "Fernando  Fontanella", "startDate": "2026-07-06"}	2026-06-22 13:55:39.817	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
1c84450e-a048-4813-b564-94a98bb5d273	APPROVE	VacationRequest	28d4add0-c540-44a3-8179-083b55b2815e	{"days": 7, "endDate": "2026-07-19", "employee": "Mariano Villegas", "startDate": "2026-07-13"}	2026-06-22 13:55:44.73	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
f8340751-b2fb-4ac3-ab51-be6ff7f7fc3b	APPROVE	VacationRequest	971b5d64-db87-4aaf-bb1f-33f9638da1d0	{"days": 7, "endDate": "2026-07-31", "employee": "Fernando  Fontanella", "startDate": "2026-07-27"}	2026-06-22 13:55:49.716	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
a4d390ac-3eca-47dc-8271-491cee6722bc	CREATE	Employee	954f69ec-62e1-4b03-bfa4-3570bca42dba	{"email": "rculver@servexternos.santandertecnologia.com.ar", "employee": "Roberto Culver"}	2026-06-22 14:18:54.189	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
a0b2c563-f615-4915-8e7b-d4fa44264548	CREATE	VacationRequest	9d66cc35-521c-46af-a50a-0a5313a8eec7	{"days": 7, "endDate": "2026-11-20", "employee": "Victor Paez", "startDate": "2026-11-16"}	2026-06-22 14:23:11.36	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
1f8ce80e-fffa-4d3d-ae1a-ab21e6d3aaa2	APPROVE	VacationRequest	9d66cc35-521c-46af-a50a-0a5313a8eec7	{"days": 7, "comment": "Corresponden a 2027", "endDate": "2026-11-20", "employee": "Victor Paez", "startDate": "2026-11-16"}	2026-06-22 14:23:27.334	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
b6b2c81a-b973-4fdb-a688-ae2491016ed8	CREATE	VacationRequest	f48a57ce-f4a5-4110-9826-8b417547bbc5	{"days": 7, "endDate": "2026-03-22", "employee": "Victor Paez", "startDate": "2026-03-16"}	2026-06-22 14:24:51.452	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
d27d8f48-f8dd-4ea4-87dd-ae611daccbf5	APPROVE	VacationRequest	f48a57ce-f4a5-4110-9826-8b417547bbc5	{"days": 7, "endDate": "2026-03-22", "employee": "Victor Paez", "startDate": "2026-03-16"}	2026-06-22 14:24:58.474	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
f77da9ad-e5b8-4f74-8dca-4e85bf82d3f5	IMPORT	Holiday	\N	{"year": 2026, "count": 19, "source": "api.argentinadatos.com"}	2026-06-22 14:36:50.9	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
8f6f3b40-a38a-4bf9-9831-0ede0e3e1710	CREATE	VacationRequest	b778ab65-9c07-41e2-ba59-5fe77f1e4f83	{"days": 6, "endDate": "2026-08-21", "employee": "Ivan Martinez", "startDate": "2026-08-17"}	2026-06-22 15:07:30.687	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
2d449de7-5714-4782-bd4a-038e38546b73	APPROVE	VacationRequest	b778ab65-9c07-41e2-ba59-5fe77f1e4f83	{"days": 6, "endDate": "2026-08-21", "employee": "Ivan Martinez", "startDate": "2026-08-17"}	2026-06-22 15:07:44.607	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
2ebcb308-29b8-43e9-b831-a18f4d80d037	LOGIN	User	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc	{"email": "admin@canaldirecto.com"}	2026-06-22 15:22:03.638	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
aa42af8d-1ca9-4ef2-b3b8-a5474aee92e5	LOGIN	User	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc	{"email": "admin@canaldirecto.com"}	2026-06-22 15:22:25.434	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
de800ff7-5e8f-419e-94d0-30c43fd33b94	LOGIN	User	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc	{"email": "admin@canaldirecto.com"}	2026-06-22 15:23:11.59	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
d23e27d8-73f5-49d0-87d6-706725bccc22	LOGIN	User	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc	{"email": "admin@canaldirecto.com"}	2026-06-22 15:25:09.384	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
858fc55e-6dd4-4218-b02c-8356739b0696	LOGIN	User	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc	{"email": "admin@canaldirecto.com"}	2026-06-22 16:27:19.899	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
9bb129e1-0d59-4a65-8e55-8949baf3cbed	LOGIN	User	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc	{"email": "admin@canaldirecto.com"}	2026-06-22 16:27:32.052	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
0fd95fcc-bc2a-41c9-9fca-1e7b1dc48e95	LOGIN	User	715230ba-a1d9-4928-a653-730ff42abaf7	{"email": "imartinez@canaldirecto.com.ar"}	2026-06-22 16:34:10.16	715230ba-a1d9-4928-a653-730ff42abaf7
6e2970bc-6724-45cb-b626-f63fac5f96ca	LOGIN	User	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc	{"email": "admin@canaldirecto.com"}	2026-06-22 16:34:26.875	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
fa99cf9e-eafe-4f3f-bbee-c97c019735a9	CREATE	VacationRequest	23b14177-f462-4480-8277-cec894d9522d	{"days": 7, "endDate": "2026-03-15", "employee": "Marcia Pollero", "startDate": "2026-03-09"}	2026-06-23 16:00:38.102	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
fed4f149-4426-4edf-b80e-406352c2741e	APPROVE	VacationRequest	23b14177-f462-4480-8277-cec894d9522d	{"days": 7, "endDate": "2026-03-15", "employee": "Marcia Pollero", "startDate": "2026-03-09"}	2026-06-23 16:00:49.528	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
60aaca05-2a49-4eb8-a206-403007c84697	CREATE	VacationRequest	c343d516-5a4a-4f2c-8b20-25e59c1c61b9	{"days": 7, "endDate": "2026-02-15", "employee": "Leonardo Pressburger", "startDate": "2026-02-09"}	2026-06-23 16:06:14.653	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
232f28d1-0786-4554-8941-209adb0b128c	APPROVE	VacationRequest	c343d516-5a4a-4f2c-8b20-25e59c1c61b9	{"days": 7, "endDate": "2026-02-15", "employee": "Leonardo Pressburger", "startDate": "2026-02-09"}	2026-06-23 16:15:57.662	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
d1d277cf-8f3f-469d-8678-91fc49655dbf	UPDATE	VacationRequest	9d66cc35-521c-46af-a50a-0a5313a8eec7	{"days": 7, "endDate": "2026-11-20", "employee": "Victor Paez", "startDate": "2026-11-16", "previousEnd": "2026-11-20", "previousStart": "2026-11-16"}	2026-06-23 18:12:48.075	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
ad35da43-d095-4e4d-acdc-e812506e5a1d	REJECT	VacationRequest	9d66cc35-521c-46af-a50a-0a5313a8eec7	{"days": 7, "endDate": "2026-11-20", "employee": "Victor Paez", "startDate": "2026-11-16"}	2026-06-23 18:12:57.4	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
b42bf52e-77d7-48c3-95a4-cb136097f5fd	CREATE	Department	250dd6cb-de94-4297-a5ae-9c455216aa42	{"name": "Stock"}	2026-06-24 16:32:04.341	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
47386d15-5e4a-4296-8be4-eb6686fc1d0c	UPDATE	Department	175b8d3d-21a3-4691-9aa4-e74f2b892ba9	{"name": "Taller "}	2026-06-24 16:32:10.511	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
59a8999a-8ba6-4cff-ae93-d1c4c6b7e168	CREATE	VacationRequest	b4818b1a-b554-47bf-ab64-9501b8c11e3d	{"days": 15, "endDate": "2026-10-15", "employee": "Ariel Otero", "startDate": "2026-10-01"}	2026-06-24 16:41:55.688	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
449b4c45-5366-4ede-9105-48808ca2685b	CREATE	Employee	dfad3bfe-6cad-4bfa-917d-cea7319e9d12	{"email": "1@canaldirecto.com.ar", "employee": "Chavez Pawluk Miqueas"}	2026-06-24 16:50:56.5	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
2592e9d0-5087-497a-b3cd-32ccf4311eae	CREATE	Employee	dc315223-e516-498b-bae8-ed8738d54952	{"email": "2@canaldirecto.com.ar", "employee": "Diego Estevez"}	2026-06-24 16:52:42.425	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
733ddc13-fa0a-4ee2-9a20-dd1357521879	CREATE	Employee	d59e6a7f-c333-47b9-bc92-0ef0640f364d	{"email": "3@canaldirecto.com.ar", "employee": "Lucas Martinez"}	2026-06-24 16:53:27.265	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
b59d7a86-abd0-40e9-a35e-b5617e6ecc0a	CREATE	Employee	cbb8604f-1cb4-4d29-8b5a-9956126bb9d8	{"email": "4@canaldirecto.com.ar", "employee": "Ciro Palacio"}	2026-06-24 16:54:24.077	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
b7cf9331-88c4-41f7-9101-23a124a1e17a	UPDATE	Employee	cbb8604f-1cb4-4d29-8b5a-9956126bb9d8	{"changes": ["firstName", "lastName", "email", "departmentId", "position", "hireDate", "color", "status", "annualVacationDays"], "employee": "Ciro Palacio"}	2026-06-24 16:54:31.439	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
ea326ffe-33c1-4217-9399-bb6a6852e6d8	CREATE	Employee	b5e8d2aa-0c7d-4219-9177-d54f6aad01e8	{"email": "5@canaldirecto.com.ar", "employee": "Axel Pereira"}	2026-06-24 16:55:06.041	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
9bbd7fae-020c-49f5-8726-9952047d1125	CREATE	Employee	8bd5fa9b-5396-411d-82e7-284bc2b38f3d	{"email": "6@canaldirecto.com.ar", "employee": "Guido Zamboni"}	2026-06-24 16:55:44.485	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
f4f21b7c-5799-4c41-b733-095488a4e4e3	REJECT	VacationRequest	b4818b1a-b554-47bf-ab64-9501b8c11e3d	{"days": 15, "endDate": "2026-10-15", "employee": "Ariel Otero", "startDate": "2026-10-01"}	2026-06-24 16:59:31.992	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
2c5d25fc-81ba-44c9-b0c5-d11cc08be000	CREATE	Employee	95221991-05cc-4df9-bf72-2f439278f80f	{"email": "7@canaldirecto.com.ar", "employee": "Alexandro Matias"}	2026-06-24 17:15:46.03	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
2b2d95ec-4759-4012-b043-efe5a50a233e	CREATE	Employee	8f9f3ccd-9465-4762-9508-99e4e1e6bada	{"email": "8@canaldirecto.com.ar", "employee": "Navarro Christian"}	2026-06-24 17:16:32.363	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
f08a26b8-9312-4a8f-95af-3f329b1cb83d	CREATE	Employee	642c98ab-6f43-4adc-a2fc-b2a52ae534d9	{"email": "9@canaldirecto.com.ar", "employee": "Fernando Torrez Neri"}	2026-06-24 17:17:53.285	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
61f24b11-90ad-4d91-9159-60524dc3b33f	CREATE	Employee	152a9a13-3cd2-44bb-a82c-dd75343a30c7	{"email": "malonso@canaldirecto.com.ar", "employee": "Mariano Alonso"}	2026-06-24 17:18:42.998	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
6a630e4c-a36a-4400-b91d-fd88dca3ec87	UPDATE	Department	250dd6cb-de94-4297-a5ae-9c455216aa42	{"name": "Stock"}	2026-06-24 17:19:26.359	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
1e48fad4-0855-4663-a6f5-6679b38350d8	CREATE	Department	d2f643b9-9843-4935-a338-41470428e947	{"name": "Choferes"}	2026-06-24 17:20:03.071	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
8bbc90dc-c1c1-42cb-a8fb-12edcfa27e64	CREATE	Employee	dadaebbb-41c7-4123-8e84-999b9e6df3ad	{"email": "10@canaldirecto.com.ar", "employee": "Roberto Pugliese"}	2026-06-24 17:20:58.412	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
9ce6fa7a-d08d-4cfc-8dc1-143bfa97d71f	CREATE	Employee	f35e9cfb-dd49-45d4-bef9-649fc9cd36b2	{"email": "11@canaldirecto.com.ar", "employee": "Alejandro Rodriguez"}	2026-06-24 17:21:31.223	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
acda9b7d-8e6c-4cb4-800d-ca466bb88e39	CREATE	Employee	194951f9-7099-46fe-877a-3a82871d27dc	{"email": "12@canaldirecto.com.ar", "employee": "Ariel Vivas"}	2026-06-24 17:22:08.54	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
cbbb430b-a806-4e81-8907-b5a365007434	CREATE	Employee	f1d95412-b024-4da2-89c5-5d9738fec332	{"email": "mblanco@canaldirecto.com.ar", "employee": "Martin Blanco"}	2026-06-24 17:22:45.846	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
2965d9e7-a42c-40d7-919a-344b143a1de7	CREATE	Employee	9d92f27b-a073-4c27-b158-1b08c9585d74	{"email": "acla@canaldirecto.com.ar", "employee": "Alejandro Cla"}	2026-06-24 17:23:23.264	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
5fb68d27-115c-4ad2-a59c-28a780400ff5	UPDATE	Employee	f1d95412-b024-4da2-89c5-5d9738fec332	{"changes": ["firstName", "lastName", "email", "departmentId", "position", "hireDate", "color", "status", "annualVacationDays"], "employee": "Martin Blanco"}	2026-06-24 17:23:36.092	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
60b0e773-2d10-4d64-b3eb-b7ab79ef3790	CREATE	Employee	f6ab8d74-6f45-458b-bc2d-3219da4d3e27	{"email": "ldiez@canaldirecto.com.ar", "employee": "Lautaro Diez"}	2026-06-24 17:24:55.874	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
56129500-1445-4032-ba60-71b99fd7ca21	CREATE	Employee	2fadfbb2-5bf1-498d-95c9-385df90c0c4d	{"email": "cferreyra@canaldirecto.com.ar", "employee": "Cristian  Ferreyra"}	2026-06-24 17:26:58.758	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
287a467a-7b2a-4786-9844-ba6f2442f00d	CREATE	Employee	6b6ec440-9a48-45f1-bc71-a25a57bac579	{"email": "ahaczek@canaldirecto.com.ar", "employee": "Agustin  Haczek"}	2026-06-24 17:36:50.64	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
8e3661cd-4862-4616-9363-ec696d2496c2	CREATE	Employee	dcd1232c-c49e-4d29-9694-34929e2ad8b4	{"email": "alorenz@canaldirecto.com.ar", "employee": "Alejandro  Lorenz"}	2026-06-24 17:37:46.297	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
24300b5d-1a8f-4034-92a2-f7f701a916b2	CREATE	Employee	8cd32692-d313-4ba7-8130-ed46b3a478d5	{"email": "tmeleri@canaldirecto.com.ar", "employee": "Thiago Meleri"}	2026-06-24 17:38:23.832	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
7a4fd60a-626b-4ccb-9201-2545f0296d37	CREATE	Employee	7988575f-5c4c-4d78-be9e-20db815f2c29	{"email": "nmon@canaldirecto.com.ar", "employee": "Nicolas  Mon"}	2026-06-24 17:40:14.109	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
e1c1d58e-4ad9-4dd8-8f4a-862fe53bba7a	CREATE	Employee	219c10c9-19e9-41b1-93f1-8465f1c47cfd	{"email": "mmilan@canaldirecto.com.ar", "employee": "Milan Matias"}	2026-06-24 17:40:49.51	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
cdb42276-791f-4175-ad5c-c41300da3508	CREATE	Employee	eedd3f48-32ba-482e-a55c-61c14ba9cbfa	{"email": "jortiz@canaldirecto.com.ar", "employee": "Julian Ortiz"}	2026-06-24 17:45:33.74	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
7eae7ca8-6caa-4c46-a3df-b2cf3a4f0687	CREATE	Employee	199fcf51-3f7a-41b1-b901-846a488e6698	{"email": "mpalacio@canaldirecto.com.ar", "employee": "Miguel Palacio"}	2026-06-24 17:46:08.116	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
95728037-0e35-4358-b05b-37cbaa8727fb	CREATE	Employee	ca3f6152-e16a-4a19-98f7-51b86b814c01	{"email": "rsanchez@canaldirecto.com.ar", "employee": "Rocco Sanchez"}	2026-06-24 17:46:48.218	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
cdd4fb59-3d38-49a2-94fb-dca76431d813	CREATE	Employee	7342c9d3-3999-4308-aaa3-271aada21281	{"email": "isiguen@canaldirecto.com.ar", "employee": "Juan Ignacio Siguen"}	2026-06-24 17:47:28.164	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
671b81c2-78a4-4234-bbb6-b0aad7c6e548	CREATE	Employee	3ab77285-0209-405a-80c8-08d8f2b02299	{"email": "pskocir@canaldirecto.com.ar", "employee": "Patricio Skocir"}	2026-06-24 17:51:42.076	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
de427441-ac8a-4722-a862-d697e09c1258	CREATE	Employee	4a4c1f6c-907a-4c32-b7c1-8fd76e951189	{"email": "pvalverde@canaldirecto.com.ar", "employee": "Pablo Valverde"}	2026-06-24 17:52:16.349	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
fcb7daee-1c32-4f9f-b2df-02c275bc837c	UPDATE	Employee	3ab77285-0209-405a-80c8-08d8f2b02299	{"changes": ["firstName", "lastName", "email", "departmentId", "position", "hireDate", "color", "status", "annualVacationDays"], "employee": "Patricio Skocir"}	2026-06-24 17:57:28.35	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
5871c7ed-24a3-49ed-8975-97854fc4d2b4	UPDATE	Employee	219c10c9-19e9-41b1-93f1-8465f1c47cfd	{"changes": ["firstName", "lastName", "email", "departmentId", "position", "hireDate", "color", "status", "annualVacationDays"], "employee": "Milan Matias"}	2026-06-24 17:57:39.849	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
f6aa311c-5f88-4d73-8b53-2b30fd358602	UPDATE	Employee	8cd32692-d313-4ba7-8130-ed46b3a478d5	{"changes": ["firstName", "lastName", "email", "departmentId", "position", "hireDate", "color", "status", "annualVacationDays"], "employee": "Thiago Meleri"}	2026-06-24 17:57:55.972	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
6087f69b-449e-436b-89f4-2a2d79d3530c	UPDATE	Employee	f6ab8d74-6f45-458b-bc2d-3219da4d3e27	{"changes": ["firstName", "lastName", "email", "departmentId", "position", "hireDate", "color", "status", "annualVacationDays"], "employee": "Lautaro Diez"}	2026-06-24 18:09:47.307	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
e7d8d9f9-60ea-449b-a3e4-3965794a0b42	UPDATE	Employee	6b6ec440-9a48-45f1-bc71-a25a57bac579	{"changes": ["firstName", "lastName", "email", "departmentId", "position", "hireDate", "color", "status", "annualVacationDays"], "employee": "Agustin  Haczek"}	2026-06-24 18:10:06.709	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
9d0fe9ed-345e-4edc-a12f-520499a705c2	UPDATE	Employee	2fadfbb2-5bf1-498d-95c9-385df90c0c4d	{"changes": ["firstName", "lastName", "email", "departmentId", "position", "hireDate", "color", "status", "annualVacationDays"], "employee": "Cristian  Ferreyra"}	2026-06-24 18:10:14.177	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
84cac777-6c82-492f-a947-e86eb0b563dc	UPDATE	Employee	9d92f27b-a073-4c27-b158-1b08c9585d74	{"changes": ["firstName", "lastName", "email", "departmentId", "position", "hireDate", "color", "status", "annualVacationDays"], "employee": "Alejandro Cla"}	2026-06-24 18:10:21.24	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
25780c05-04d6-4dc1-b17e-fa0e823bca61	UPDATE	Employee	eedd3f48-32ba-482e-a55c-61c14ba9cbfa	{"changes": ["firstName", "lastName", "email", "departmentId", "position", "hireDate", "color", "status", "annualVacationDays"], "employee": "Julian Ortiz"}	2026-06-24 18:10:30.346	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
1a79bf26-5a28-4397-869a-7604b3d516df	UPDATE	Employee	199fcf51-3f7a-41b1-b901-846a488e6698	{"changes": ["firstName", "lastName", "email", "departmentId", "position", "hireDate", "color", "status", "annualVacationDays"], "employee": "Miguel Palacio"}	2026-06-24 18:10:37.569	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
bbafd3a6-58d4-4563-b9e8-66cdc17d7bee	UPDATE	Employee	219c10c9-19e9-41b1-93f1-8465f1c47cfd	{"changes": ["firstName", "lastName", "email", "departmentId", "position", "hireDate", "color", "status", "annualVacationDays"], "employee": "Milan Matias"}	2026-06-24 18:10:45.399	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
034405c8-883d-4777-a711-3115993a69ec	UPDATE	Employee	4a4c1f6c-907a-4c32-b7c1-8fd76e951189	{"changes": ["firstName", "lastName", "email", "departmentId", "position", "hireDate", "color", "status", "annualVacationDays"], "employee": "Pablo Valverde"}	2026-06-24 18:10:56.423	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
2791969c-92a3-4bed-8acb-9936bb6bae4d	UPDATE	Employee	3ab77285-0209-405a-80c8-08d8f2b02299	{"changes": ["firstName", "lastName", "email", "departmentId", "position", "hireDate", "color", "status", "annualVacationDays"], "employee": "Patricio Skocir"}	2026-06-24 18:11:05.812	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
530195ab-27fa-4272-9164-7229f81ba3bc	UPDATE	Employee	ca3f6152-e16a-4a19-98f7-51b86b814c01	{"changes": ["firstName", "lastName", "email", "departmentId", "position", "hireDate", "color", "status", "annualVacationDays"], "employee": "Rocco Sanchez"}	2026-06-24 18:11:10.704	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
59a7e31e-40bd-407a-9a67-f28329e5f474	UPDATE	Employee	8cd32692-d313-4ba7-8130-ed46b3a478d5	{"changes": ["firstName", "lastName", "email", "departmentId", "position", "hireDate", "color", "status", "annualVacationDays"], "employee": "Thiago Meleri"}	2026-06-24 18:11:15.636	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
1900ec0a-edc7-4f28-a7eb-4f14117792c5	UPDATE	VacationRequest	b4818b1a-b554-47bf-ab64-9501b8c11e3d	{"days": 15, "endDate": "2026-10-15", "employee": "Ariel Otero", "startDate": "2026-10-01", "previousEnd": "2026-10-15", "previousStart": "2026-10-01"}	2026-06-24 18:17:37.766	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
f8ee6a1e-8500-49b9-839b-afe15927071c	UPDATE	Employee	dc315223-e516-498b-bae8-ed8738d54952	{"changes": ["firstName", "lastName", "email", "departmentId", "position", "hireDate", "color", "status", "annualVacationDays"], "employee": "Diego Estevez"}	2026-06-24 18:18:31.392	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
15574e57-529a-4caa-a653-b8d8c89b291c	UPDATE	Employee	7988575f-5c4c-4d78-be9e-20db815f2c29	{"changes": ["firstName", "lastName", "email", "departmentId", "position", "hireDate", "color", "status", "annualVacationDays"], "employee": "Nicolas  Mon"}	2026-06-24 18:30:05.993	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
41204176-d359-4ef2-a300-c9106eabd68e	UPDATE	Employee	eedd3f48-32ba-482e-a55c-61c14ba9cbfa	{"changes": ["firstName", "lastName", "email", "departmentId", "position", "hireDate", "color", "status", "annualVacationDays"], "employee": "Julian Ortiz"}	2026-06-24 18:32:40.579	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
1b2cadc7-9695-48cc-8e49-11ead20f005a	UPDATE	Employee	8f9f3ccd-9465-4762-9508-99e4e1e6bada	{"changes": ["firstName", "lastName", "email", "departmentId", "position", "hireDate", "color", "status", "annualVacationDays"], "employee": "Christian Navarro"}	2026-06-24 18:40:02.6	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
4708ee1a-f623-4209-a9b7-8b193e974b76	UPDATE	Employee	dfad3bfe-6cad-4bfa-917d-cea7319e9d12	{"changes": ["firstName", "lastName", "email", "departmentId", "position", "hireDate", "color", "status", "annualVacationDays"], "employee": "Miqueas Chavez Pawluk"}	2026-06-24 18:40:21.84	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
9259e8d2-1300-42ad-bcd7-f67500e0d1a7	UPDATE	Employee	244d708d-255f-48c1-8f87-ea822ea1bf8d	{"changes": ["firstName", "lastName", "email", "departmentId", "position", "hireDate", "color", "status", "annualVacationDays"], "employee": "Victor Paez"}	2026-06-25 11:35:26.27	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
6b768ead-961e-4af8-8afc-d9c95fa44f72	UPDATE	Employee	86c1a1b3-81be-4b3a-b037-907463dd9d14	{"changes": ["firstName", "lastName", "email", "departmentId", "position", "hireDate", "color", "status", "annualVacationDays"], "employee": "Mariana  Rodriguez"}	2026-06-25 11:35:39.352	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
4ba8fd2c-6918-45dc-ae3c-aa9aa6e4d611	UPDATE	Employee	9c066787-94f9-4d7f-ba5f-ea5e94c69e3a	{"changes": ["firstName", "lastName", "email", "departmentId", "position", "hireDate", "color", "status", "annualVacationDays"], "employee": "Maria Jose Vela"}	2026-06-25 11:35:48.046	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
4f5af1ec-f24e-49c1-b6be-5214b3403a48	UPDATE	Employee	7152f7f9-971f-48e9-bb14-fbc303fdd152	{"changes": ["firstName", "lastName", "email", "departmentId", "position", "hireDate", "color", "status", "annualVacationDays"], "employee": "Marcia Pollero"}	2026-06-25 11:35:56.275	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
5e57025f-cfe0-442f-a152-fe93bd9578b5	UPDATE	Employee	7d8d086f-677a-489b-a73e-ca38dc5ccb64	{"changes": ["firstName", "lastName", "email", "departmentId", "position", "hireDate", "color", "status", "annualVacationDays"], "employee": "Luna Torres"}	2026-06-25 11:36:05.383	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
d5682337-2ca2-42c5-94d8-c6e613955fe7	UPDATE	Employee	49ba9106-648f-4441-802a-be4cd5a244d6	{"changes": ["firstName", "lastName", "email", "departmentId", "position", "hireDate", "color", "status", "annualVacationDays"], "employee": "Leonardo Pressburger"}	2026-06-25 11:36:12.722	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
9a179e64-1ec2-4a49-bb53-241b79ef2303	UPDATE	Employee	4a9be2c4-04a0-4b94-86b8-c2e2f863af3a	{"changes": ["firstName", "lastName", "email", "departmentId", "position", "hireDate", "color", "status", "annualVacationDays"], "employee": "Ivan Martinez"}	2026-06-25 11:36:30.744	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
b299b3f7-2973-4d70-9ec2-f61cb77195e3	UPDATE	Employee	7152f7f9-971f-48e9-bb14-fbc303fdd152	{"changes": ["firstName", "lastName", "email", "departmentId", "position", "hireDate", "color", "status", "annualVacationDays"], "employee": "Marcia Pollero"}	2026-06-25 11:37:02.421	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
4fd9405d-e036-494d-b6ae-2bc21eedb59b	UPDATE	Employee	86c1a1b3-81be-4b3a-b037-907463dd9d14	{"changes": ["firstName", "lastName", "email", "departmentId", "position", "hireDate", "color", "status", "annualVacationDays"], "employee": "Mariana  Rodriguez"}	2026-06-25 11:37:10.878	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
fa209a83-2692-4469-9fbb-37cad136f7f3	UPDATE	Employee	199fcf51-3f7a-41b1-b901-846a488e6698	{"changes": ["firstName", "lastName", "email", "departmentId", "position", "hireDate", "color", "status", "annualVacationDays"], "employee": "Miguel Palacio"}	2026-06-25 12:00:55.781	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
cab5f508-acd8-4050-8010-ff71472dbf78	UPDATE	Employee	4a4c1f6c-907a-4c32-b7c1-8fd76e951189	{"changes": ["firstName", "lastName", "email", "departmentId", "position", "hireDate", "color", "status", "annualVacationDays"], "employee": "Pablo Valverde"}	2026-06-25 13:02:05.792	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
1f48d392-70c2-4ec9-a785-63210ebcdd0f	UPDATE	Employee	ca3f6152-e16a-4a19-98f7-51b86b814c01	{"changes": ["firstName", "lastName", "email", "departmentId", "position", "hireDate", "color", "status", "annualVacationDays"], "employee": "Rocco Sanchez"}	2026-06-25 13:03:21.426	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
71e690fe-64c3-488b-b203-fe2377d0ef46	LOGIN	User	715230ba-a1d9-4928-a653-730ff42abaf7	{"email": "imartinez@canaldirecto.com.ar"}	2026-06-25 13:13:36.653	715230ba-a1d9-4928-a653-730ff42abaf7
ebe29d51-78ab-463f-b089-147f1fa2a2ab	LOGIN	User	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc	{"email": "admin@canaldirecto.com"}	2026-06-25 13:29:49.333	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
9c1a5932-2754-4331-9eb5-0b46b7c50159	LOGIN	User	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc	{"email": "admin@canaldirecto.com"}	2026-06-25 13:30:19.852	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
ea4e49b6-3c40-431d-9cb8-09d242efee2e	LOGIN	User	715230ba-a1d9-4928-a653-730ff42abaf7	{"email": "imartinez@canaldirecto.com.ar"}	2026-06-25 14:26:57.521	715230ba-a1d9-4928-a653-730ff42abaf7
4d3fbe63-7059-4ef2-8a3f-5c18bcdf9c0c	LOGIN	User	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc	{"email": "admin@canaldirecto.com"}	2026-06-25 14:27:26.012	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
0ee9cc38-3340-4891-8736-36f9b7bfb718	LOGIN	User	715230ba-a1d9-4928-a653-730ff42abaf7	{"email": "imartinez@canaldirecto.com.ar"}	2026-06-25 14:28:46.902	715230ba-a1d9-4928-a653-730ff42abaf7
dbd9007b-9a48-421d-9755-191ecdd3ba40	LOGIN	User	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc	{"email": "admin@canaldirecto.com"}	2026-06-25 14:29:43.155	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
d79e6ef8-71b3-4b38-bc0d-aba385cf4b23	REJECT	VacationRequest	b4818b1a-b554-47bf-ab64-9501b8c11e3d	{"days": 15, "endDate": "2026-10-15", "employee": "Ariel Otero", "startDate": "2026-10-01"}	2026-06-25 14:29:55.847	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
d208e566-27e1-42a8-b263-fc467813b02e	UPDATE	VacationRequest	b778ab65-9c07-41e2-ba59-5fe77f1e4f83	{"days": 6, "endDate": "2026-08-21", "employee": "Ivan Martinez", "startDate": "2026-08-17", "previousEnd": "2026-08-21", "previousStart": "2026-08-17"}	2026-06-25 14:30:29.086	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
04dd9983-95e5-4fd3-8944-20f517cfbb77	REJECT	VacationRequest	b778ab65-9c07-41e2-ba59-5fe77f1e4f83	{"days": 6, "endDate": "2026-08-21", "employee": "Ivan Martinez", "startDate": "2026-08-17"}	2026-06-25 14:31:00.553	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
f4d0ed2c-7540-4e2e-bb04-dbc2199adafe	UPDATE	Employee	642c98ab-6f43-4adc-a2fc-b2a52ae534d9	{"changes": ["firstName", "lastName", "email", "departmentId", "position", "hireDate", "color", "status", "annualVacationDays"], "employee": "Fernando Torrez Neri"}	2026-06-25 17:25:56.619	ccfcc641-2a62-4c2c-bafc-37d51d39ebdc
\.


--
-- Data for Name: Department; Type: TABLE DATA; Schema: public; Owner: vacasync
--

COPY public."Department" (id, name, color, "createdAt", "updatedAt") FROM stdin;
5dbc4523-badf-40cc-989c-9bea7450fa74	Administración de Operaciones	#f59e0b	2026-06-17 17:42:22.731	2026-06-17 17:42:22.731
7c7118a2-c7a2-4217-a821-bba65700615f	Gerencia Operativa	#ef4444	2026-06-17 17:43:02.971	2026-06-19 15:47:18.089
4da6adca-a95b-4cc1-ac37-ddabecc06be3	Técnico	#6366f1	2026-06-17 17:42:57.193	2026-06-19 15:48:26.61
1a07312a-661d-4511-93b7-bccbf63962fb	Logística	#14b8a6	2026-06-19 15:47:41.183	2026-06-19 15:48:32.448
23f1961d-ccaf-467f-a37f-541b4d09e91b	MDA Externas	#8b5cf6	2026-06-19 15:47:54.609	2026-06-19 15:48:36.157
175b8d3d-21a3-4691-9aa4-e74f2b892ba9	Taller 	#3b82f6	2026-06-19 15:47:31.73	2026-06-24 16:32:10.497
250dd6cb-de94-4297-a5ae-9c455216aa42	Stock	#10b981	2026-06-24 16:32:04.332	2026-06-24 17:19:26.34
d2f643b9-9843-4935-a338-41470428e947	Choferes	#ec4899	2026-06-24 17:20:03.065	2026-06-24 17:20:03.065
\.


--
-- Data for Name: Employee; Type: TABLE DATA; Schema: public; Owner: vacasync
--

COPY public."Employee" (id, "firstName", "lastName", email, "position", "hireDate", "annualVacationDays", status, "createdAt", "updatedAt", "departmentId", color) FROM stdin;
01d66c3a-7545-418d-8528-22e3bdca5df0	Juan Pablo	Corigliano	jpcorigliano@canaldirecto.com.ar	Jefe de Operaciones	2000-08-01 00:00:00	35	ACTIVE	2026-06-17 17:44:19.561	2026-06-19 19:22:28.838	7c7118a2-c7a2-4217-a821-bba65700615f	#3b82f6
fd92cacc-c90b-4e46-a443-daadf138d834	Fernando 	Fontanella	ffontanella@canaldirecto.com.ar	Tecnico Centro	2007-04-23 00:00:00	28	ACTIVE	2026-06-17 17:44:58.914	2026-06-19 19:22:28.845	4da6adca-a95b-4cc1-ac37-ddabecc06be3	#ef4444
86c1a1b3-81be-4b3a-b037-907463dd9d14	Mariana 	Rodriguez	marodriguez@canaldirecto.com.ar	Team Leader MDA	2008-07-01 00:00:00	28	ACTIVE	2026-06-19 17:08:56.098	2026-06-25 11:37:10.874	5dbc4523-badf-40cc-989c-9bea7450fa74	#fde808
49ba9106-648f-4441-802a-be4cd5a244d6	Leonardo	Pressburger	lpresburger@canaldirecto.com.ar	Team Leader Técnico	2017-05-02 00:00:00	21	ACTIVE	2026-06-19 15:43:06.577	2026-06-25 11:36:12.716	5dbc4523-badf-40cc-989c-9bea7450fa74	#1dfc42
199fcf51-3f7a-41b1-b901-846a488e6698	Miguel	Palacio	mpalacio@canaldirecto.com.ar	Tecnico O	2018-01-02 00:00:00	21	ACTIVE	2026-06-24 17:46:08.112	2026-06-25 12:00:55.775	4da6adca-a95b-4cc1-ac37-ddabecc06be3	#1a3561
4a9be2c4-04a0-4b94-86b8-c2e2f863af3a	Ivan	Martinez	imartinez@canaldirecto.com.ar	The Butcher	2015-08-24 00:00:00	28	ACTIVE	2026-06-19 17:35:04.567	2026-06-25 11:36:30.736	5dbc4523-badf-40cc-989c-9bea7450fa74	#03a5a2
7d8d086f-677a-489b-a73e-ca38dc5ccb64	Luna	Torres	ltorres@canaldirecto.com.ar	Operadora	2025-08-04 00:00:00	14	ACTIVE	2026-06-19 15:41:28.799	2026-06-25 11:36:05.376	5dbc4523-badf-40cc-989c-9bea7450fa74	#eeafe2
c9400fbf-1bbc-4ef5-9495-ca82c9ec4aa6	Franco 	Lombardi	flombardi@canaldirecto.com.ar	Operador	2010-01-01 00:00:00	28	ACTIVE	2026-06-19 16:53:23.863	2026-06-19 19:22:28.868	1a07312a-661d-4511-93b7-bccbf63962fb	#f97316
dc388f7d-9a02-4621-ae39-22556456732b	Mariano	Villegas	mvillegas@canaldirecto.com.ar	Operador	2023-06-12 00:00:00	14	ACTIVE	2026-06-19 16:55:41.996	2026-06-19 19:22:28.871	1a07312a-661d-4511-93b7-bccbf63962fb	#6366f1
817b6dd3-3d1a-41c6-9d6d-83641093db1b	Lucas	Ledesma	lucasledesma@servexternos.santandertecnologia.com.ar	Runner BSR	2004-11-08 00:00:00	35	ACTIVE	2026-06-19 17:01:03.471	2026-06-19 19:22:28.875	23f1961d-ccaf-467f-a37f-541b4d09e91b	#14b8a6
9c066787-94f9-4d7f-ba5f-ea5e94c69e3a	Maria Jose	Vela	mjvela@canaldirecto.com.ar	Operadora	2008-11-03 00:00:00	28	ACTIVE	2026-06-19 15:41:03.838	2026-06-25 11:35:48.042	5dbc4523-badf-40cc-989c-9bea7450fa74	#d282f7
7152f7f9-971f-48e9-bb14-fbc303fdd152	Marcia	Pollero	mpollero@canaldirecto.com.ar	Operadora	2008-06-25 00:00:00	28	ACTIVE	2026-06-19 15:59:40.115	2026-06-25 11:37:02.416	5dbc4523-badf-40cc-989c-9bea7450fa74	#a26f15
7fe572ce-b5ab-41d3-b8f9-95ab6c591306	Ariel	Otero	aotero@canaldirecto.com.ar	Gerente Operaciones	1998-11-01 00:00:00	35	ACTIVE	2026-06-22 11:43:54.129	2026-06-22 11:43:54.129	7c7118a2-c7a2-4217-a821-bba65700615f	#3b82f6
954f69ec-62e1-4b03-bfa4-3570bca42dba	Roberto	Culver	rculver@servexternos.santandertecnologia.com.ar	MDA Credicoop	2016-05-16 00:00:00	28	ACTIVE	2026-06-22 14:18:54.181	2026-06-22 14:18:54.181	23f1961d-ccaf-467f-a37f-541b4d09e91b	#3b82f6
d59e6a7f-c333-47b9-bc92-0ef0640f364d	Lucas	Martinez	3@canaldirecto.com.ar	Tecnico	2025-07-01 00:00:00	14	ACTIVE	2026-06-24 16:53:27.257	2026-06-24 16:53:27.257	175b8d3d-21a3-4691-9aa4-e74f2b892ba9	#f73bde
cbb8604f-1cb4-4d29-8b5a-9956126bb9d8	Ciro	Palacio	4@canaldirecto.com.ar	Tecnico	2025-01-27 00:00:00	14	ACTIVE	2026-06-24 16:54:24.073	2026-06-24 16:54:31.435	175b8d3d-21a3-4691-9aa4-e74f2b892ba9	#3bf7e1
b5e8d2aa-0c7d-4219-9177-d54f6aad01e8	Axel	Pereira	5@canaldirecto.com.ar	Tecnico	2023-04-11 00:00:00	14	ACTIVE	2026-06-24 16:55:06.037	2026-06-24 16:55:06.037	175b8d3d-21a3-4691-9aa4-e74f2b892ba9	#99f73b
8bd5fa9b-5396-411d-82e7-284bc2b38f3d	Guido	Zamboni	6@canaldirecto.com.ar	Tecnico	2019-10-15 00:00:00	21	ACTIVE	2026-06-24 16:55:44.48	2026-06-24 16:55:44.48	175b8d3d-21a3-4691-9aa4-e74f2b892ba9	#f73ba9
95221991-05cc-4df9-bf72-2f439278f80f	Alexandro	Matias	7@canaldirecto.com.ar	Operador	2022-11-03 00:00:00	14	ACTIVE	2026-06-24 17:15:46.025	2026-06-24 17:15:46.025	250dd6cb-de94-4297-a5ae-9c455216aa42	#8a66cc
152a9a13-3cd2-44bb-a82c-dd75343a30c7	Mariano	Alonso	malonso@canaldirecto.com.ar	Jefe	2011-01-24 00:00:00	28	ACTIVE	2026-06-24 17:18:42.995	2026-06-24 17:18:42.995	175b8d3d-21a3-4691-9aa4-e74f2b892ba9	#ed1d1d
dadaebbb-41c7-4123-8e84-999b9e6df3ad	Roberto	Pugliese	10@canaldirecto.com.ar	Chofer Insumos	2008-08-11 00:00:00	28	ACTIVE	2026-06-24 17:20:58.397	2026-06-24 17:20:58.397	d2f643b9-9843-4935-a338-41470428e947	#00ff6e
f35e9cfb-dd49-45d4-bef9-649fc9cd36b2	Alejandro	Rodriguez	11@canaldirecto.com.ar	Chofer Insumos	2008-08-11 00:00:00	28	ACTIVE	2026-06-24 17:21:31.217	2026-06-24 17:21:31.217	d2f643b9-9843-4935-a338-41470428e947	#a0eb00
194951f9-7099-46fe-877a-3a82871d27dc	Ariel	Vivas	12@canaldirecto.com.ar	Chofer Equipamiento	2017-10-17 00:00:00	21	ACTIVE	2026-06-24 17:22:08.536	2026-06-24 17:22:08.536	d2f643b9-9843-4935-a338-41470428e947	#a3ffe0
f1d95412-b024-4da2-89c5-5d9738fec332	Martin	Blanco	mblanco@canaldirecto.com.ar	Tecnico CABA	2012-08-21 00:00:00	28	ACTIVE	2026-06-24 17:22:45.84	2026-06-24 17:23:36.088	4da6adca-a95b-4cc1-ac37-ddabecc06be3	#8caad9
dcd1232c-c49e-4d29-9694-34929e2ad8b4	Alejandro 	Lorenz	alorenz@canaldirecto.com.ar	Instalador	2007-04-23 00:00:00	28	ACTIVE	2026-06-24 17:37:46.293	2026-06-24 17:37:46.293	4da6adca-a95b-4cc1-ac37-ddabecc06be3	#69b55a
dc315223-e516-498b-bae8-ed8738d54952	Diego	Estevez	2@canaldirecto.com.ar	Tecnico	2007-04-23 00:00:00	28	ACTIVE	2026-06-24 16:52:42.419	2026-06-24 18:18:31.38	175b8d3d-21a3-4691-9aa4-e74f2b892ba9	#a6bbdd
f6ab8d74-6f45-458b-bc2d-3219da4d3e27	Lautaro	Diez	ldiez@canaldirecto.com.ar	Tecnico SO	2025-07-01 00:00:00	14	ACTIVE	2026-06-24 17:24:55.87	2026-06-24 18:09:47.301	4da6adca-a95b-4cc1-ac37-ddabecc06be3	#7bda52
6b6ec440-9a48-45f1-bc71-a25a57bac579	Agustin 	Haczek	ahaczek@canaldirecto.com.ar	Tecnico SM - SO - O	2024-12-02 00:00:00	14	ACTIVE	2026-06-24 17:36:50.634	2026-06-24 18:10:06.703	4da6adca-a95b-4cc1-ac37-ddabecc06be3	#f73ba9
2fadfbb2-5bf1-498d-95c9-385df90c0c4d	Cristian 	Ferreyra	cferreyra@canaldirecto.com.ar	Tecnico SM - SO - O	2023-09-07 00:00:00	14	ACTIVE	2026-06-24 17:26:58.751	2026-06-24 18:10:14.173	4da6adca-a95b-4cc1-ac37-ddabecc06be3	#928320
9d92f27b-a073-4c27-b158-1b08c9585d74	Alejandro	Cla	acla@canaldirecto.com.ar	Tecnico N	2017-09-11 00:00:00	21	ACTIVE	2026-06-24 17:23:23.261	2026-06-24 18:10:21.133	4da6adca-a95b-4cc1-ac37-ddabecc06be3	#02743e
8f9f3ccd-9465-4762-9508-99e4e1e6bada	Christian	Navarro	8@canaldirecto.com.ar	Operador	2006-06-01 00:00:00	35	ACTIVE	2026-06-24 17:16:32.348	2026-06-24 18:40:02.595	250dd6cb-de94-4297-a5ae-9c455216aa42	#aeeade
ca3f6152-e16a-4a19-98f7-51b86b814c01	Rocco	Sanchez	rsanchez@canaldirecto.com.ar	Tecnico N	2025-07-01 00:00:00	14	ACTIVE	2026-06-24 17:46:48.213	2026-06-25 13:03:21.403	4da6adca-a95b-4cc1-ac37-ddabecc06be3	#be63bf
642c98ab-6f43-4adc-a2fc-b2a52ae534d9	Fernando	Torrez Neri	9@canaldirecto.com.ar	Operador	2005-04-25 00:00:00	35	ACTIVE	2026-06-24 17:17:53.279	2026-06-25 17:25:56.611	250dd6cb-de94-4297-a5ae-9c455216aa42	#e6b400
8cd32692-d313-4ba7-8130-ed46b3a478d5	Thiago	Meleri	tmeleri@canaldirecto.com.ar	Tecnico S	2025-02-10 00:00:00	14	ACTIVE	2026-06-24 17:38:23.827	2026-06-24 18:11:15.63	4da6adca-a95b-4cc1-ac37-ddabecc06be3	#e6e864
7988575f-5c4c-4d78-be9e-20db815f2c29	Nicolas 	Mon	nmon@canaldirecto.com.ar	Tecnico CABA 	2018-01-02 00:00:00	21	ACTIVE	2026-06-24 17:40:14.104	2026-06-24 18:30:05.987	4da6adca-a95b-4cc1-ac37-ddabecc06be3	#fb13f4
eedd3f48-32ba-482e-a55c-61c14ba9cbfa	Julian	Ortiz	jortiz@canaldirecto.com.ar	Tecnico S	2022-06-08 00:00:00	14	ACTIVE	2026-06-24 17:45:33.735	2026-06-24 18:32:40.575	4da6adca-a95b-4cc1-ac37-ddabecc06be3	#8aec88
dfad3bfe-6cad-4bfa-917d-cea7319e9d12	Miqueas	Chavez Pawluk	1@canaldirecto.com.ar	Tecnico	2026-03-09 00:00:00	7	ACTIVE	2026-06-24 16:50:56.495	2026-06-24 18:40:21.835	175b8d3d-21a3-4691-9aa4-e74f2b892ba9	#3b82f6
244d708d-255f-48c1-8f87-ea822ea1bf8d	Victor	Paez	vipaez@canaldirecto.com.ar	Operador	2024-09-16 00:00:00	14	ACTIVE	2026-06-19 15:41:53.183	2026-06-25 11:35:26.246	5dbc4523-badf-40cc-989c-9bea7450fa74	#2a5cf4
7342c9d3-3999-4308-aaa3-271aada21281	Juan Ignacio	Siguen	isiguen@canaldirecto.com.ar	Tecnico CABA	2025-07-01 00:00:00	14	ACTIVE	2026-06-24 17:47:28.143	2026-06-24 17:47:28.143	4da6adca-a95b-4cc1-ac37-ddabecc06be3	#84d78d
219c10c9-19e9-41b1-93f1-8465f1c47cfd	Milan	Matias	mmilan@canaldirecto.com.ar	Tecnico N	2009-03-09 00:00:00	28	ACTIVE	2026-06-24 17:40:49.505	2026-06-24 18:10:45.394	4da6adca-a95b-4cc1-ac37-ddabecc06be3	#0afbff
3ab77285-0209-405a-80c8-08d8f2b02299	Patricio	Skocir	pskocir@canaldirecto.com.ar	Tecnico N (C)	2015-09-22 00:00:00	28	ACTIVE	2026-06-24 17:51:42.064	2026-06-24 18:11:05.807	4da6adca-a95b-4cc1-ac37-ddabecc06be3	#ce3bf7
4a4c1f6c-907a-4c32-b7c1-8fd76e951189	Pablo	Valverde	pvalverde@canaldirecto.com.ar	Tecnico S (C)	2017-10-17 00:00:00	21	ACTIVE	2026-06-24 17:52:16.337	2026-06-25 13:02:05.757	4da6adca-a95b-4cc1-ac37-ddabecc06be3	#f7573b
\.


--
-- Data for Name: Holiday; Type: TABLE DATA; Schema: public; Owner: vacasync
--

COPY public."Holiday" (id, name, date, "deductsVacation", "createdAt", "updatedAt") FROM stdin;
37ec176e-f162-4298-a5f9-fd704aa30b3b	Día de la Soberanía Nacional	2026-11-20 00:00:00	f	2026-06-19 15:26:11.968	2026-06-19 15:26:11.968
3e6aed84-8a37-4876-831e-fe3bb1bdfdb4	Año Nuevo	2027-01-01 00:00:00	f	2026-06-19 15:26:45.432	2026-06-19 15:26:45.432
c1ff396b-b3d4-4a14-b8dc-3d0e2ccdd278	Paso a la Inmortalidad del General Martín Güemes	2026-06-17 00:00:00	f	2026-06-19 15:27:11.131	2026-06-19 15:27:11.131
4753dc78-e401-4f1b-b24e-c562137a0403	No laborable	2026-12-24 00:00:00	f	2026-06-19 19:18:56.761	2026-06-19 19:18:56.761
80686a47-75ea-4e9a-8610-6449356a2ecc	Año nuevo	2026-01-01 00:00:00	f	2026-06-22 14:36:50.825	2026-06-22 14:36:50.825
ea5214b8-4373-420b-a256-7e226e668aa8	Carnaval	2026-02-16 00:00:00	f	2026-06-19 15:28:08.122	2026-06-22 14:36:50.833
6ce5e097-cb06-4d64-9b2d-651ad5468279	Carnaval	2026-02-17 00:00:00	f	2026-06-19 15:28:14.551	2026-06-22 14:36:50.837
aab70625-d50f-419c-a6f6-8bcf3f5563d1	Puente turístico no laborable	2026-03-23 00:00:00	f	2026-06-19 15:29:09.314	2026-06-22 14:36:50.842
3ce149e0-db5c-412a-832c-b8da5632e227	Día Nacional de la Memoria por la Verdad y la Justicia	2026-03-24 00:00:00	f	2026-06-19 15:27:58.426	2026-06-22 14:36:50.845
71e3c185-3dba-4762-a440-ec6b80e1bc6c	Día del Veterano y de los Caídos en la Guerra de Malvinas	2026-04-02 00:00:00	f	2026-06-19 15:27:50.667	2026-06-22 14:36:50.849
3ae1ef01-c930-461e-a037-0d346d22a5c2	Viernes Santo	2026-04-03 00:00:00	f	2026-06-19 15:27:39.708	2026-06-22 14:36:50.854
fe615108-08ad-4e1f-8170-c3e348426705	Día del Trabajador	2026-05-01 00:00:00	f	2026-06-19 15:27:32.254	2026-06-22 14:36:50.857
714ef280-abdd-4f11-9e7a-c74d11080431	Día de la Revolución de Mayo	2026-05-25 00:00:00	f	2026-06-19 15:27:21.02	2026-06-22 14:36:50.86
80bde5f8-ad23-42aa-a9de-ef92be734781	Paso a la Inmortalidad del General Martín Güemes (17/6)	2026-06-15 00:00:00	f	2026-06-22 14:36:50.863	2026-06-22 14:36:50.863
aea1bf6d-c3ee-4556-9ebd-dbff70e056ce	Paso a la Inmortalidad del General Manuel Belgrano	2026-06-20 00:00:00	f	2026-06-19 15:27:00.655	2026-06-22 14:36:50.869
4cd35f7e-13eb-4fb4-8fef-551e9ea678da	Día de la Independencia	2026-07-09 00:00:00	f	2026-06-17 17:49:10.88	2026-06-22 14:36:50.872
af4c9ce9-e59d-4585-9068-bcf8fa55fc75	Puente turístico no laborable	2026-07-10 00:00:00	f	2026-06-17 18:24:36.739	2026-06-22 14:36:50.875
48806ee7-983a-41fc-8905-206ad85f667c	Paso a la Inmortalidad del Gral. José de San Martín	2026-08-17 00:00:00	f	2026-06-19 15:25:52.639	2026-06-22 14:36:50.878
8d3560b4-9ced-4a96-996e-e80ac85123d9	Día del Respeto a la Diversidad Cultural	2026-10-12 00:00:00	f	2026-06-19 15:26:04.161	2026-06-22 14:36:50.882
9fce9c2d-820e-42ab-af73-abe97c839bfb	Día de la Soberanía Nacional (20/11)	2026-11-23 00:00:00	f	2026-06-22 14:36:50.886	2026-06-22 14:36:50.886
4df5fe92-2167-4afa-8b08-2c986bbc25af	Puente turístico no laborable	2026-12-07 00:00:00	f	2026-06-19 15:29:52.064	2026-06-22 14:36:50.889
7ebfcea7-63b5-41a0-91dd-9827fefa89a5	Día de la Inmaculada Concepción de María	2026-12-08 00:00:00	f	2026-06-19 15:26:27.524	2026-06-22 14:36:50.893
eb0f7f04-65b4-4067-9ad4-dc3904508f53	Navidad	2026-12-25 00:00:00	f	2026-06-19 15:26:35.448	2026-06-22 14:36:50.897
\.


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: vacasync
--

COPY public."Notification" (id, title, body, read, "createdAt", "userId") FROM stdin;
dcfdec73-9399-4778-8971-6ea16f533285	Solicitud rechazada	Tu solicitud del 12/07/2026 al 17/07/2026 ha sido rechazada.	f	2026-06-19 18:12:06.557	715230ba-a1d9-4928-a653-730ff42abaf7
fd6d2e12-ddd0-4b08-9cc0-dcf9d62761a5	Solicitud aprobada	Tu solicitud del 12/07/2026 al 17/07/2026 ha sido aprobada.	f	2026-06-19 18:15:48.841	715230ba-a1d9-4928-a653-730ff42abaf7
c93b76b2-09dc-4d91-8132-a9c933738b31	Solicitud aprobada	Tu solicitud del 13/07/26 al 17/07/26 ha sido aprobada.	f	2026-06-19 18:28:12.696	715230ba-a1d9-4928-a653-730ff42abaf7
4acd09bd-a50a-40c7-953f-055d8853decf	Solicitud aprobada	Tu solicitud del 18/02/26 al 03/03/26 ha sido aprobada.	f	2026-06-19 19:58:48.722	715230ba-a1d9-4928-a653-730ff42abaf7
0e71cf2f-8a57-4546-ac9b-09c1f9934703	Solicitud aprobada	Tu solicitud del 17/08/26 al 21/08/26 ha sido aprobada.	f	2026-06-22 15:07:40.177	715230ba-a1d9-4928-a653-730ff42abaf7
5c55fb63-1139-435c-a4f6-2aabbeabaccd	Solicitud rechazada	Tu solicitud del 17/08/26 al 21/08/26 ha sido rechazada.	f	2026-06-25 14:30:55.915	715230ba-a1d9-4928-a653-730ff42abaf7
\.


--
-- Data for Name: SystemConfig; Type: TABLE DATA; Schema: public; Owner: vacasync
--

COPY public."SystemConfig" (id, "seniorityTiers", "minAdvanceNoticeDays", "maxOverlapPercent", "maxOverlapCount", "updatedAt", "allowAdvanceRequest", "maxAdvanceDays", "nextYearOpenDay", "nextYearOpenMonth", "allowCarryOver", "maxCarryOverDays") FROM stdin;
singleton	[{"days": 7, "maxYears": 0.5, "minYears": 0}, {"days": 14, "maxYears": 1, "minYears": 0.5}, {"days": 14, "maxYears": 5, "minYears": 1}, {"days": 21, "maxYears": 10, "minYears": 5}, {"days": 28, "maxYears": 15, "minYears": 10}, {"days": 28, "maxYears": 20, "minYears": 15}, {"days": 35, "maxYears": 99, "minYears": 20}]	7	50	0	2026-06-19 17:25:09.573	t	0	1	10	t	0
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: vacasync
--

COPY public."User" (id, email, password, role, "resetToken", "resetExpires", "createdAt", "updatedAt", "employeeId") FROM stdin;
ccfcc641-2a62-4c2c-bafc-37d51d39ebdc	admin@canaldirecto.com	$2a$10$9/nWRUhkrFFE5TDn7GgSCuNmAfILtbBbGpZh2Y6jaba27uo35TZPu	ADMIN	\N	\N	2026-06-17 17:38:07.497	2026-06-17 17:38:07.497	\N
715230ba-a1d9-4928-a653-730ff42abaf7	imartinez@canaldirecto.com.ar	$2a$10$ne9JdllOUpORjF62iCVN0O0asRMGAtGUH4YO5Q71681MjvR/1qBMK	EMPLOYEE	\N	\N	2026-06-19 17:35:04.687	2026-06-19 17:35:04.687	4a9be2c4-04a0-4b94-86b8-c2e2f863af3a
\.


--
-- Data for Name: VacationCycle; Type: TABLE DATA; Schema: public; Owner: vacasync
--

COPY public."VacationCycle" (id, year, "annualDays", "carryOver", "isOpen", "openedAt", "createdAt", "updatedAt", "employeeId") FROM stdin;
0edf4694-c59c-49b2-9213-2d9619b1f690	2000	35	0	f	\N	2026-06-22 13:07:51.518	2026-06-22 13:07:51.518	01d66c3a-7545-418d-8528-22e3bdca5df0
bc7d5a87-235c-481a-a89f-262b4095b068	2001	7	35	f	\N	2026-06-22 13:07:51.507	2026-06-22 13:07:51.529	01d66c3a-7545-418d-8528-22e3bdca5df0
8c75e746-45e3-4f87-864c-c2592a1131a6	2002	14	42	f	\N	2026-06-22 13:07:51.496	2026-06-22 13:07:51.534	01d66c3a-7545-418d-8528-22e3bdca5df0
637e4cef-2236-4531-b5b0-949e782ad06a	2003	14	56	f	\N	2026-06-22 13:07:51.485	2026-06-22 13:07:51.539	01d66c3a-7545-418d-8528-22e3bdca5df0
449b0586-3693-4c38-a458-a48fb8dd756d	2004	14	70	f	\N	2026-06-22 13:07:51.472	2026-06-22 13:07:51.543	01d66c3a-7545-418d-8528-22e3bdca5df0
4cbc75aa-0dcf-4f53-ad84-23b00c9bbccc	2005	14	84	f	\N	2026-06-22 13:07:51.462	2026-06-22 13:07:51.548	01d66c3a-7545-418d-8528-22e3bdca5df0
0e5d6e17-7c6e-403e-b08a-ac6db0ed9d0c	2006	21	98	f	\N	2026-06-22 13:07:51.452	2026-06-22 13:07:51.553	01d66c3a-7545-418d-8528-22e3bdca5df0
f8c0b9ed-e609-482d-bc80-b0c31c63054f	2007	21	119	f	\N	2026-06-22 13:07:51.44	2026-06-22 13:07:51.558	01d66c3a-7545-418d-8528-22e3bdca5df0
181f412b-7779-49f1-b591-30f5fc5f7726	2008	21	140	f	\N	2026-06-22 13:07:51.428	2026-06-22 13:07:51.562	01d66c3a-7545-418d-8528-22e3bdca5df0
88e2cbe5-3032-4db1-b7bd-d6c8de4b2ff2	2010	21	182	f	\N	2026-06-22 13:07:51.406	2026-06-22 13:07:51.577	01d66c3a-7545-418d-8528-22e3bdca5df0
fb57b76b-cf6d-4677-9d64-e3c5e29a8429	2011	28	203	f	\N	2026-06-22 13:07:51.393	2026-06-22 13:07:51.584	01d66c3a-7545-418d-8528-22e3bdca5df0
859aac2f-4ba2-4af8-b937-749021810e05	2012	28	231	f	\N	2026-06-22 13:07:51.383	2026-06-22 13:07:51.588	01d66c3a-7545-418d-8528-22e3bdca5df0
71eaddd1-b971-4324-b797-773852064642	2013	28	259	f	\N	2026-06-22 13:07:51.372	2026-06-22 13:07:51.593	01d66c3a-7545-418d-8528-22e3bdca5df0
31368cc2-f417-42a2-a39f-fe6a78f03318	2014	28	287	f	\N	2026-06-22 13:07:51.36	2026-06-22 13:07:51.597	01d66c3a-7545-418d-8528-22e3bdca5df0
ccbe7e21-9ad5-4e99-b407-08d792e345ac	2015	28	315	f	\N	2026-06-22 13:07:51.346	2026-06-22 13:07:51.601	01d66c3a-7545-418d-8528-22e3bdca5df0
de074a09-f9e5-48cc-b44a-4408fe19ca13	2016	28	343	f	\N	2026-06-22 13:07:51.333	2026-06-22 13:07:51.605	01d66c3a-7545-418d-8528-22e3bdca5df0
97e8774f-ab16-49ca-bacc-875489553e24	2017	28	371	f	\N	2026-06-22 13:07:51.323	2026-06-22 13:07:51.61	01d66c3a-7545-418d-8528-22e3bdca5df0
22ebdea9-9674-4890-b0e2-8c121b09d50d	2018	28	399	f	\N	2026-06-22 13:07:51.31	2026-06-22 13:07:51.615	01d66c3a-7545-418d-8528-22e3bdca5df0
6b56ea76-6da0-450e-b78d-b7af67b40f4e	2019	28	427	f	\N	2026-06-22 13:07:51.295	2026-06-22 13:07:51.619	01d66c3a-7545-418d-8528-22e3bdca5df0
6bd598a5-c044-41e4-a324-58907b2c6bd0	2020	28	455	f	\N	2026-06-22 13:07:51.282	2026-06-22 13:07:51.622	01d66c3a-7545-418d-8528-22e3bdca5df0
6c0f0501-1f67-4072-be4b-c256d3fef8bd	2021	35	483	f	\N	2026-06-22 13:07:51.271	2026-06-22 13:07:51.627	01d66c3a-7545-418d-8528-22e3bdca5df0
29b35f92-fde6-4a8f-a286-429ab08750eb	2022	35	518	f	\N	2026-06-22 13:07:51.258	2026-06-22 13:07:51.63	01d66c3a-7545-418d-8528-22e3bdca5df0
2c119111-0c2b-4ab2-9120-1b8852fee1cf	2023	35	553	f	\N	2026-06-22 13:07:51.244	2026-06-22 13:07:51.636	01d66c3a-7545-418d-8528-22e3bdca5df0
7054c144-4b6e-4d03-9bd1-ef676fd237bc	2024	35	588	f	\N	2026-06-22 13:07:51.231	2026-06-22 13:07:51.64	01d66c3a-7545-418d-8528-22e3bdca5df0
f5e93e72-a5a6-4812-9360-dc0d9c1c7a1f	2025	35	623	f	\N	2026-06-22 13:07:51.217	2026-06-22 13:07:51.646	01d66c3a-7545-418d-8528-22e3bdca5df0
66da1f46-5076-46ac-a927-8cd24706b46b	2026	28	0	t	2026-06-22 12:23:01.745	2026-06-22 12:23:01.746	2026-06-22 13:28:18.077	fd92cacc-c90b-4e46-a443-daadf138d834
d6ff821f-5e32-4dad-ad96-7e49215d180b	2026	28	0	t	2026-06-22 12:23:01.756	2026-06-22 12:23:01.757	2026-06-22 13:28:18.086	9c066787-94f9-4d7f-ba5f-ea5e94c69e3a
2ef97e96-6b38-4f00-a901-fc8c1ef29534	2026	7	0	t	2026-06-22 12:23:01.767	2026-06-22 12:23:01.768	2026-06-22 13:28:18.096	7d8d086f-677a-489b-a73e-ca38dc5ccb64
9dd38097-5b54-468b-a3b1-df254d00f22a	2026	14	0	t	2026-06-22 12:23:01.777	2026-06-22 12:23:01.778	2026-06-22 13:28:18.104	244d708d-255f-48c1-8f87-ea822ea1bf8d
6dcb7282-003f-42bc-a8f2-d1e551893239	2025	7	35	f	\N	2026-06-22 12:30:34.671	2026-06-22 13:07:52.292	244d708d-255f-48c1-8f87-ea822ea1bf8d
b1e69346-02bf-4343-9d66-fdcc27e30e2e	2026	21	0	t	2026-06-22 12:23:01.789	2026-06-22 12:23:01.79	2026-06-22 13:28:18.114	49ba9106-648f-4441-802a-be4cd5a244d6
65fe0ed3-66c1-431e-8681-186069b74738	2026	28	0	t	2026-06-22 12:23:01.799	2026-06-22 12:23:01.8	2026-06-22 13:28:18.122	7152f7f9-971f-48e9-bb14-fbc303fdd152
6ff6eb90-9fc1-4afc-b14c-e92a34ff3020	2025	28	378	f	\N	2026-06-22 12:31:07.548	2026-06-22 13:07:52.705	7152f7f9-971f-48e9-bb14-fbc303fdd152
3007949e-e16d-47c4-ae75-a6a0026c2721	2026	28	0	t	2026-06-22 12:23:01.809	2026-06-22 12:23:01.81	2026-06-22 13:28:18.13	c9400fbf-1bbc-4ef5-9495-ca82c9ec4aa6
1fc8d993-1b62-4f72-99bd-7f9035d27358	2026	14	0	t	2026-06-22 12:23:01.823	2026-06-22 12:23:01.824	2026-06-22 13:28:18.137	dc388f7d-9a02-4621-ae39-22556456732b
99609ee2-2aba-4832-9a21-2d774f85918e	2026	35	0	t	2026-06-22 12:23:01.833	2026-06-22 12:23:01.834	2026-06-22 13:28:18.146	817b6dd3-3d1a-41c6-9d6d-83641093db1b
9b29fc73-d5f3-4a09-8379-d1516b11bef3	2026	28	0	t	2026-06-22 12:23:01.846	2026-06-22 12:23:01.847	2026-06-22 13:28:18.155	86c1a1b3-81be-4b3a-b037-907463dd9d14
3eb23d9a-ebe4-4726-90ef-b7a3738ba21a	2026	28	0	t	2026-06-22 12:23:01.856	2026-06-22 12:23:01.857	2026-06-22 13:28:18.164	4a9be2c4-04a0-4b94-86b8-c2e2f863af3a
a63024a2-2aa6-4ff9-b320-e78f308d4182	2026	35	0	t	2026-06-22 12:23:01.866	2026-06-22 12:23:01.867	2026-06-22 13:28:18.172	7fe572ce-b5ab-41d3-b8f9-95ab6c591306
dc847a24-e8de-4096-bb84-a0d6f6cd4e94	2027	28	11	t	2026-06-22 14:27:00.032	2026-06-22 12:25:26.938	2026-06-22 14:27:00.033	fd92cacc-c90b-4e46-a443-daadf138d834
49fe263a-fb4f-47d6-ac70-9f366b90554b	2027	28	7	t	2026-06-22 14:27:00.1	2026-06-22 12:25:34.505	2026-06-25 17:25:41.189	4a9be2c4-04a0-4b94-86b8-c2e2f863af3a
8c9b3de5-ee97-4950-b597-1d98e0c4b8ff	2027	21	14	t	2026-06-22 14:27:00.061	2026-06-22 12:25:34.515	2026-06-23 16:06:14.822	49ba9106-648f-4441-802a-be4cd5a244d6
fa0ca875-8046-460a-b559-4f4aeb664ab5	2027	28	7	t	2026-06-22 14:27:00.067	2026-06-22 12:25:34.511	2026-06-23 16:00:38.293	7152f7f9-971f-48e9-bb14-fbc303fdd152
08df9388-ae95-4222-9423-20ed9d4b2d38	2027	14	0	t	2026-06-22 14:27:00.081	2026-06-22 12:26:13.205	2026-06-22 14:27:00.082	dc388f7d-9a02-4621-ae39-22556456732b
a385f62e-cd71-4c15-b444-c79a67d55256	2027	14	0	t	2026-06-22 14:27:00.052	2026-06-22 12:25:34.529	2026-06-22 14:27:00.053	244d708d-255f-48c1-8f87-ea822ea1bf8d
224518c4-464b-4fc6-9b68-9ef55c809240	2027	35	21	t	2026-06-22 14:27:00.089	2026-06-22 12:25:17.316	2026-06-22 14:27:00.09	817b6dd3-3d1a-41c6-9d6d-83641093db1b
70ed791d-24fd-4860-9392-831edccfc812	2027	14	0	t	2026-06-22 14:27:00.045	2026-06-22 12:25:34.512	2026-06-22 14:27:00.046	7d8d086f-677a-489b-a73e-ca38dc5ccb64
dfb04ac4-6e13-4564-b34b-f94e3fd44ab9	2027	35	35	t	2026-06-22 14:27:00.109	2026-06-22 12:26:13.174	2026-06-25 14:29:58.265	7fe572ce-b5ab-41d3-b8f9-95ab6c591306
9a7f9ee0-266c-4515-b72e-40191cfc2ef5	2027	28	0	t	2026-06-22 14:27:00.039	2026-06-22 12:25:34.518	2026-06-22 14:27:00.04	9c066787-94f9-4d7f-ba5f-ea5e94c69e3a
ae70e121-ed3e-4ee0-813f-75769cc3b8dd	2027	35	35	t	2026-06-22 14:27:00.021	2026-06-22 12:26:13.206	2026-06-22 14:27:00.022	01d66c3a-7545-418d-8528-22e3bdca5df0
dbe74c92-a990-4859-ab97-42b3218d5da3	2026	35	0	t	2026-06-22 12:23:01.727	2026-06-22 12:23:01.727	2026-06-22 13:28:18.052	01d66c3a-7545-418d-8528-22e3bdca5df0
b8890f32-4794-4c6a-90a5-41d176028cf0	2009	21	161	f	\N	2026-06-22 13:07:51.417	2026-06-22 13:07:51.569	01d66c3a-7545-418d-8528-22e3bdca5df0
14604e91-0266-4b59-89d9-73f54f4acb9b	2007	35	0	f	\N	2026-06-22 13:07:51.873	2026-06-22 13:07:51.873	fd92cacc-c90b-4e46-a443-daadf138d834
9fcdfe15-721b-46eb-97ba-4f67ca5eb63b	2008	14	35	f	\N	2026-06-22 13:07:51.861	2026-06-22 13:07:51.879	fd92cacc-c90b-4e46-a443-daadf138d834
6e51bb17-7712-4b8b-8f99-52bfec3a7275	2009	14	49	f	\N	2026-06-22 13:07:51.849	2026-06-22 13:07:51.884	fd92cacc-c90b-4e46-a443-daadf138d834
e93b1f23-fdef-4f32-98f5-ee808bde2607	2010	14	63	f	\N	2026-06-22 13:07:51.839	2026-06-22 13:07:51.889	fd92cacc-c90b-4e46-a443-daadf138d834
118a1463-77e4-45d9-bcf2-df61f5aad3e4	2011	14	77	f	\N	2026-06-22 13:07:51.828	2026-06-22 13:07:51.893	fd92cacc-c90b-4e46-a443-daadf138d834
0ca78eb5-b076-46d4-82d9-a88f54712a6a	2012	14	91	f	\N	2026-06-22 13:07:51.817	2026-06-22 13:07:51.897	fd92cacc-c90b-4e46-a443-daadf138d834
fa758df4-8a9e-4874-90c2-c4542c89ce5e	2013	21	105	f	\N	2026-06-22 13:07:51.802	2026-06-22 13:07:51.903	fd92cacc-c90b-4e46-a443-daadf138d834
29a708fa-e6c9-4fc0-af92-021d337832d5	2014	21	126	f	\N	2026-06-22 13:07:51.79	2026-06-22 13:07:51.912	fd92cacc-c90b-4e46-a443-daadf138d834
afa4b2cc-2255-4849-b62d-84580069e5ca	2015	21	147	f	\N	2026-06-22 13:07:51.781	2026-06-22 13:07:51.918	fd92cacc-c90b-4e46-a443-daadf138d834
b1729183-aec1-4852-b6de-6e4a35ba1028	2016	21	168	f	\N	2026-06-22 13:07:51.771	2026-06-22 13:07:51.921	fd92cacc-c90b-4e46-a443-daadf138d834
1f17b3fc-623f-424e-b638-931b8259e3dc	2017	21	189	f	\N	2026-06-22 13:07:51.76	2026-06-22 13:07:51.925	fd92cacc-c90b-4e46-a443-daadf138d834
7733dafc-a796-4f96-bae8-9a2785db292f	2018	28	210	f	\N	2026-06-22 13:07:51.75	2026-06-22 13:07:51.929	fd92cacc-c90b-4e46-a443-daadf138d834
fe6d15b3-d9a5-4dca-afd8-db70a24115a7	2019	28	238	f	\N	2026-06-22 13:07:51.739	2026-06-22 13:07:51.935	fd92cacc-c90b-4e46-a443-daadf138d834
c25eacf7-7122-4f92-aa70-70e232440dec	2020	28	266	f	\N	2026-06-22 13:07:51.725	2026-06-22 13:07:51.939	fd92cacc-c90b-4e46-a443-daadf138d834
d3f918e7-3471-4718-b191-04aa71a3f323	2021	28	294	f	\N	2026-06-22 13:07:51.714	2026-06-22 13:07:51.942	fd92cacc-c90b-4e46-a443-daadf138d834
04d8043b-dc4a-4aae-8428-0ecbf6431af7	2022	28	322	f	\N	2026-06-22 13:07:51.703	2026-06-22 13:07:51.946	fd92cacc-c90b-4e46-a443-daadf138d834
1b5b4554-d5b4-4ad1-8b41-6f1f06550d39	2023	28	350	f	\N	2026-06-22 13:07:51.69	2026-06-22 13:07:51.951	fd92cacc-c90b-4e46-a443-daadf138d834
b1b372f9-a9c7-4b69-854e-0ba673b46db5	2024	28	378	f	\N	2026-06-22 13:07:51.679	2026-06-22 13:07:51.954	fd92cacc-c90b-4e46-a443-daadf138d834
96e8cfa9-7733-46d3-b711-ea9bc3f7aafd	2025	28	406	f	\N	2026-06-22 13:07:51.667	2026-06-22 13:07:51.958	fd92cacc-c90b-4e46-a443-daadf138d834
e6092ef0-2f13-46ad-bcdc-a789e6a3c70a	2009	7	35	f	\N	2026-06-22 13:07:52.149	2026-06-22 13:07:52.168	9c066787-94f9-4d7f-ba5f-ea5e94c69e3a
871bc6b1-b08e-4c1d-a543-9addac243a04	2010	14	42	f	\N	2026-06-22 13:07:52.138	2026-06-22 13:07:52.173	9c066787-94f9-4d7f-ba5f-ea5e94c69e3a
08094163-774d-4f0b-b2e6-78e1096221f4	2011	14	56	f	\N	2026-06-22 13:07:52.126	2026-06-22 13:07:52.177	9c066787-94f9-4d7f-ba5f-ea5e94c69e3a
df75664a-1f51-46d7-9f16-19407ff589a2	2012	14	70	f	\N	2026-06-22 13:07:52.116	2026-06-22 13:07:52.181	9c066787-94f9-4d7f-ba5f-ea5e94c69e3a
5b64af15-f9cb-4a66-bc52-80d339bbac2a	2013	14	84	f	\N	2026-06-22 13:07:52.106	2026-06-22 13:07:52.185	9c066787-94f9-4d7f-ba5f-ea5e94c69e3a
1142347f-9cae-46ed-a658-01e78753d3d5	2014	21	98	f	\N	2026-06-22 13:07:52.096	2026-06-22 13:07:52.19	9c066787-94f9-4d7f-ba5f-ea5e94c69e3a
deb32a07-ecf9-4e58-96c1-580427fedaaf	2015	21	119	f	\N	2026-06-22 13:07:52.084	2026-06-22 13:07:52.194	9c066787-94f9-4d7f-ba5f-ea5e94c69e3a
46549b24-90bc-4b9e-8900-4c91c82d5779	2016	21	140	f	\N	2026-06-22 13:07:52.074	2026-06-22 13:07:52.198	9c066787-94f9-4d7f-ba5f-ea5e94c69e3a
39472163-2aa5-43c9-b305-220f82b531b8	2017	21	161	f	\N	2026-06-22 13:07:52.064	2026-06-22 13:07:52.203	9c066787-94f9-4d7f-ba5f-ea5e94c69e3a
0c5e6e4b-c29a-4704-b6bd-5ad36981bd49	2018	21	182	f	\N	2026-06-22 13:07:52.053	2026-06-22 13:07:52.208	9c066787-94f9-4d7f-ba5f-ea5e94c69e3a
9ca294ad-a0ba-45bc-84e5-df46bc4e6d88	2019	28	203	f	\N	2026-06-22 13:07:52.043	2026-06-22 13:07:52.213	9c066787-94f9-4d7f-ba5f-ea5e94c69e3a
e88ca22b-862e-4dc5-87b1-ccb382bf6cbc	2020	28	231	f	\N	2026-06-22 13:07:52.033	2026-06-22 13:07:52.217	9c066787-94f9-4d7f-ba5f-ea5e94c69e3a
34749484-613b-445c-9141-64714967a345	2021	28	259	f	\N	2026-06-22 13:07:52.022	2026-06-22 13:07:52.222	9c066787-94f9-4d7f-ba5f-ea5e94c69e3a
76dfef49-668c-441c-bb86-012bbbf1fba2	2022	28	287	f	\N	2026-06-22 13:07:52.011	2026-06-22 13:07:52.226	9c066787-94f9-4d7f-ba5f-ea5e94c69e3a
fe567dbe-01e9-4b1f-bf40-767d4d2c467b	2023	28	315	f	\N	2026-06-22 13:07:52	2026-06-22 13:07:52.232	9c066787-94f9-4d7f-ba5f-ea5e94c69e3a
81d1f875-1704-4322-b640-c203316f7f6e	2024	28	343	f	\N	2026-06-22 13:07:51.988	2026-06-22 13:07:52.237	9c066787-94f9-4d7f-ba5f-ea5e94c69e3a
4ad338cc-5041-47bd-87fd-1470e723eb8c	2025	28	371	f	\N	2026-06-22 13:07:51.975	2026-06-22 13:07:52.241	9c066787-94f9-4d7f-ba5f-ea5e94c69e3a
f651f659-2834-422c-8376-07264d77db88	2008	35	0	f	\N	2026-06-22 13:07:52.161	2026-06-22 13:07:52.161	9c066787-94f9-4d7f-ba5f-ea5e94c69e3a
a893c115-0a08-4c28-b6ad-07b0d4d797ab	2025	35	0	f	\N	2026-06-22 13:07:52.258	2026-06-22 13:07:52.258	7d8d086f-677a-489b-a73e-ca38dc5ccb64
76142b15-5b1b-4235-bc99-011847111011	2024	35	0	f	\N	2026-06-22 13:07:52.284	2026-06-22 13:07:52.284	244d708d-255f-48c1-8f87-ea822ea1bf8d
1db61727-a904-4b56-a5b2-29e6ee8e6ff5	2017	35	0	f	\N	2026-06-22 13:07:52.393	2026-06-22 13:07:52.393	49ba9106-648f-4441-802a-be4cd5a244d6
c6fde850-a7d1-42fa-9154-3ac9acaefd52	2018	14	35	f	\N	2026-06-22 13:07:52.383	2026-06-22 13:07:52.399	49ba9106-648f-4441-802a-be4cd5a244d6
4ad1880e-9c8c-4351-8b89-8d18f1af4e12	2019	14	49	f	\N	2026-06-22 13:07:52.372	2026-06-22 13:07:52.404	49ba9106-648f-4441-802a-be4cd5a244d6
95aae33f-234f-4df4-81e4-968f5e176da5	2020	14	63	f	\N	2026-06-22 13:07:52.361	2026-06-22 13:07:52.408	49ba9106-648f-4441-802a-be4cd5a244d6
b2f05735-5c9e-40c5-afa4-b39f54d3bc57	2021	14	77	f	\N	2026-06-22 13:07:52.351	2026-06-22 13:07:52.411	49ba9106-648f-4441-802a-be4cd5a244d6
9a725948-7925-4b1e-8f68-a613cfe053c0	2022	14	91	f	\N	2026-06-22 13:07:52.341	2026-06-22 13:07:52.415	49ba9106-648f-4441-802a-be4cd5a244d6
42c16a16-f1b7-4c67-92d2-dbc4c3d0282e	2023	21	105	f	\N	2026-06-22 13:07:52.329	2026-06-22 13:07:52.42	49ba9106-648f-4441-802a-be4cd5a244d6
40bbd77b-16c0-42d8-b9eb-e920d7b19a7f	2024	21	126	f	\N	2026-06-22 13:07:52.318	2026-06-22 13:07:52.424	49ba9106-648f-4441-802a-be4cd5a244d6
31015435-4008-409a-8a2f-88e8bae20541	2025	21	147	f	\N	2026-06-22 13:07:52.307	2026-06-22 13:07:52.428	49ba9106-648f-4441-802a-be4cd5a244d6
6ed93075-d731-417f-8167-1ced33155f2a	2008	35	0	f	\N	2026-06-22 13:07:52.628	2026-06-22 13:07:52.628	7152f7f9-971f-48e9-bb14-fbc303fdd152
1e1a83c1-0943-451f-b6ba-e283c537065d	2009	14	35	f	\N	2026-06-22 13:07:52.618	2026-06-22 13:07:52.635	7152f7f9-971f-48e9-bb14-fbc303fdd152
9d328917-9e3a-426b-a2f1-dd60006bde86	2010	14	49	f	\N	2026-06-22 13:07:52.606	2026-06-22 13:07:52.639	7152f7f9-971f-48e9-bb14-fbc303fdd152
4751f8e1-427c-4752-8f02-b2a3620cd5bf	2011	14	63	f	\N	2026-06-22 13:07:52.595	2026-06-22 13:07:52.643	7152f7f9-971f-48e9-bb14-fbc303fdd152
b68d8b8c-ea81-44a5-ba03-57813eebe025	2012	14	77	f	\N	2026-06-22 13:07:52.585	2026-06-22 13:07:52.647	7152f7f9-971f-48e9-bb14-fbc303fdd152
d251d1f3-3220-40da-93a3-ecdc2e9e9228	2013	14	91	f	\N	2026-06-22 13:07:52.574	2026-06-22 13:07:52.652	7152f7f9-971f-48e9-bb14-fbc303fdd152
e46bc9f1-65ca-4cfe-804c-647c3e207586	2014	21	105	f	\N	2026-06-22 13:07:52.561	2026-06-22 13:07:52.657	7152f7f9-971f-48e9-bb14-fbc303fdd152
bce32de9-644a-4576-b95d-75a0c0cf5570	2015	21	126	f	\N	2026-06-22 13:07:52.551	2026-06-22 13:07:52.662	7152f7f9-971f-48e9-bb14-fbc303fdd152
087d5a41-f1c5-4668-8867-6424c0c7079c	2016	21	147	f	\N	2026-06-22 13:07:52.54	2026-06-22 13:07:52.667	7152f7f9-971f-48e9-bb14-fbc303fdd152
f16ab4e0-7848-4dee-9ad4-b60c2527d44c	2017	21	168	f	\N	2026-06-22 13:07:52.529	2026-06-22 13:07:52.671	7152f7f9-971f-48e9-bb14-fbc303fdd152
161b7962-a731-4ff0-9b06-ccb9f35da69d	2018	21	189	f	\N	2026-06-22 13:07:52.518	2026-06-22 13:07:52.676	7152f7f9-971f-48e9-bb14-fbc303fdd152
1cafae28-b829-4e1d-b170-06c73dfcb87d	2019	28	210	f	\N	2026-06-22 13:07:52.507	2026-06-22 13:07:52.68	7152f7f9-971f-48e9-bb14-fbc303fdd152
b2596e2a-79f2-4f41-80e3-4b05db4ffe71	2020	28	238	f	\N	2026-06-22 13:07:52.495	2026-06-22 13:07:52.684	7152f7f9-971f-48e9-bb14-fbc303fdd152
d110b09f-0ec8-4076-8df4-6bd49c4d0628	2021	28	266	f	\N	2026-06-22 13:07:52.481	2026-06-22 13:07:52.688	7152f7f9-971f-48e9-bb14-fbc303fdd152
1b4b88cd-b15e-4c23-96fa-c4d1cfc97637	2022	28	294	f	\N	2026-06-22 13:07:52.47	2026-06-22 13:07:52.693	7152f7f9-971f-48e9-bb14-fbc303fdd152
39870a30-7347-452f-ab91-3765b4988447	2023	28	322	f	\N	2026-06-22 13:07:52.459	2026-06-22 13:07:52.697	7152f7f9-971f-48e9-bb14-fbc303fdd152
b72f4a3e-e1ff-42b7-a434-5c12ae24867d	2024	28	350	f	\N	2026-06-22 13:07:52.45	2026-06-22 13:07:52.701	7152f7f9-971f-48e9-bb14-fbc303fdd152
d1a42454-ce63-4a50-a8a3-a29ad9f198fd	2009	35	0	f	\N	2026-06-22 13:07:52.904	2026-06-22 13:07:52.904	c9400fbf-1bbc-4ef5-9495-ca82c9ec4aa6
a4589bfd-4acc-405d-b246-dc61f326c86e	2010	7	35	f	\N	2026-06-22 13:07:52.887	2026-06-22 13:07:52.912	c9400fbf-1bbc-4ef5-9495-ca82c9ec4aa6
ebf6841f-7652-49e5-be4e-1672cc09154f	2011	14	42	f	\N	2026-06-22 13:07:52.877	2026-06-22 13:07:52.917	c9400fbf-1bbc-4ef5-9495-ca82c9ec4aa6
2a640489-beba-47a8-83cc-d605f3c12829	2012	14	56	f	\N	2026-06-22 13:07:52.865	2026-06-22 13:07:52.921	c9400fbf-1bbc-4ef5-9495-ca82c9ec4aa6
3d79e9e0-3470-4bf1-be21-7b7f8214671f	2013	14	70	f	\N	2026-06-22 13:07:52.855	2026-06-22 13:07:52.925	c9400fbf-1bbc-4ef5-9495-ca82c9ec4aa6
b66fd874-94a8-4522-9c30-5700a5fa6690	2014	14	84	f	\N	2026-06-22 13:07:52.845	2026-06-22 13:07:52.931	c9400fbf-1bbc-4ef5-9495-ca82c9ec4aa6
3e5d7697-12f0-4950-855e-7ba2f5a7cdf5	2015	14	98	f	\N	2026-06-22 13:07:52.834	2026-06-22 13:07:52.936	c9400fbf-1bbc-4ef5-9495-ca82c9ec4aa6
959c3162-600c-4a03-b734-e0d43a581ffa	2016	21	112	f	\N	2026-06-22 13:07:52.821	2026-06-22 13:07:52.939	c9400fbf-1bbc-4ef5-9495-ca82c9ec4aa6
71f0aa07-86ac-4bbe-a4c7-9fc3cf82ef98	2017	21	133	f	\N	2026-06-22 13:07:52.811	2026-06-22 13:07:52.943	c9400fbf-1bbc-4ef5-9495-ca82c9ec4aa6
05320325-5a4d-44c7-9b10-ad868290ae7c	2018	21	154	f	\N	2026-06-22 13:07:52.801	2026-06-22 13:07:52.947	c9400fbf-1bbc-4ef5-9495-ca82c9ec4aa6
bb7d2bd5-a50f-4a2b-b78f-c66bdedb6511	2019	21	175	f	\N	2026-06-22 13:07:52.79	2026-06-22 13:07:52.952	c9400fbf-1bbc-4ef5-9495-ca82c9ec4aa6
07e83a96-bfc6-4aa4-80a7-3b6f47addce7	2020	21	196	f	\N	2026-06-22 13:07:52.778	2026-06-22 13:07:52.955	c9400fbf-1bbc-4ef5-9495-ca82c9ec4aa6
b3edb6b1-12de-4d8d-a3aa-fb39c97717f6	2021	28	217	f	\N	2026-06-22 13:07:52.769	2026-06-22 13:07:52.959	c9400fbf-1bbc-4ef5-9495-ca82c9ec4aa6
ce0a71ac-3228-441d-b54c-482dc80331ad	2022	28	245	f	\N	2026-06-22 13:07:52.757	2026-06-22 13:07:52.964	c9400fbf-1bbc-4ef5-9495-ca82c9ec4aa6
b79c7f66-ed71-49dd-bf27-000a56a773d8	2023	28	273	f	\N	2026-06-22 13:07:52.746	2026-06-22 13:07:52.968	c9400fbf-1bbc-4ef5-9495-ca82c9ec4aa6
e94beb3b-587a-414c-a6f2-51c124af774b	2024	28	301	f	\N	2026-06-22 13:07:52.735	2026-06-22 13:07:52.971	c9400fbf-1bbc-4ef5-9495-ca82c9ec4aa6
609dd1cd-b55c-4a5a-8797-840eba343a2b	2025	28	329	f	\N	2026-06-22 13:07:52.723	2026-06-22 13:07:52.975	c9400fbf-1bbc-4ef5-9495-ca82c9ec4aa6
d31414a9-ea77-4abc-9bec-142119250795	2023	35	0	f	\N	2026-06-22 13:07:53.016	2026-06-22 13:07:53.016	dc388f7d-9a02-4621-ae39-22556456732b
004d9dd5-5f5d-4318-9986-cd5548c47035	2024	14	35	f	\N	2026-06-22 13:07:53.004	2026-06-22 13:07:53.025	dc388f7d-9a02-4621-ae39-22556456732b
17f63731-9ea9-44c2-828f-efc91f439458	2025	14	49	f	\N	2026-06-22 13:07:52.992	2026-06-22 13:07:53.031	dc388f7d-9a02-4621-ae39-22556456732b
aa8330bd-20e2-4c46-a96b-47f17a12dbeb	2022	28	399	f	\N	2026-06-22 13:07:53.082	2026-06-22 13:07:53.364	817b6dd3-3d1a-41c6-9d6d-83641093db1b
436c428a-b5cc-466a-9526-e293c93ec61f	2023	28	427	f	\N	2026-06-22 13:07:53.071	2026-06-22 13:07:53.37	817b6dd3-3d1a-41c6-9d6d-83641093db1b
01d738b2-ea30-4fbb-9c21-cc2ee2ed2f2a	2024	28	455	f	\N	2026-06-22 13:07:53.059	2026-06-22 13:07:53.374	817b6dd3-3d1a-41c6-9d6d-83641093db1b
1b2477cd-cc31-4364-a709-f5ae81892604	2004	35	0	f	\N	2026-06-22 13:07:53.284	2026-06-22 13:07:53.284	817b6dd3-3d1a-41c6-9d6d-83641093db1b
fb4d4c71-35c9-4876-b6ab-01b155c407d8	2005	7	35	f	\N	2026-06-22 13:07:53.272	2026-06-22 13:07:53.291	817b6dd3-3d1a-41c6-9d6d-83641093db1b
d3d7f4c9-b40e-44ae-8d62-5c0f15f0c93d	2006	14	42	f	\N	2026-06-22 13:07:53.261	2026-06-22 13:07:53.295	817b6dd3-3d1a-41c6-9d6d-83641093db1b
d2bf059e-c06d-48bc-a68c-d1cfe10826d9	2007	14	56	f	\N	2026-06-22 13:07:53.25	2026-06-22 13:07:53.299	817b6dd3-3d1a-41c6-9d6d-83641093db1b
0bacca2b-e85e-4409-a077-b158b0acbacd	2008	14	70	f	\N	2026-06-22 13:07:53.239	2026-06-22 13:07:53.303	817b6dd3-3d1a-41c6-9d6d-83641093db1b
e6cc7ea9-703e-4b68-85c7-c3011ef7ea0c	2009	14	84	f	\N	2026-06-22 13:07:53.224	2026-06-22 13:07:53.307	817b6dd3-3d1a-41c6-9d6d-83641093db1b
2b7e88bc-ef10-413c-833e-42764471d52a	2010	21	98	f	\N	2026-06-22 13:07:53.213	2026-06-22 13:07:53.311	817b6dd3-3d1a-41c6-9d6d-83641093db1b
7e0037e8-6296-4754-b646-7022c2e5e01d	2011	21	119	f	\N	2026-06-22 13:07:53.202	2026-06-22 13:07:53.316	817b6dd3-3d1a-41c6-9d6d-83641093db1b
98c1288b-efe0-47bd-a3b7-5be8ddfa3e4d	2012	21	140	f	\N	2026-06-22 13:07:53.19	2026-06-22 13:07:53.322	817b6dd3-3d1a-41c6-9d6d-83641093db1b
c04d15e4-dd22-4ab6-8395-676555b6b003	2013	21	161	f	\N	2026-06-22 13:07:53.179	2026-06-22 13:07:53.327	817b6dd3-3d1a-41c6-9d6d-83641093db1b
436ab582-a737-46fe-b90c-de04e8acaa5a	2014	21	182	f	\N	2026-06-22 13:07:53.167	2026-06-22 13:07:53.331	817b6dd3-3d1a-41c6-9d6d-83641093db1b
d9282e6a-77ed-45f1-95b6-6080cfe030ad	2015	28	203	f	\N	2026-06-22 13:07:53.156	2026-06-22 13:07:53.336	817b6dd3-3d1a-41c6-9d6d-83641093db1b
92b7163d-a022-4bd7-a798-e4ba95cb6dc4	2016	28	231	f	\N	2026-06-22 13:07:53.146	2026-06-22 13:07:53.34	817b6dd3-3d1a-41c6-9d6d-83641093db1b
1bb85ca1-7227-4083-80bc-6d9ea375b9a6	2017	28	259	f	\N	2026-06-22 13:07:53.136	2026-06-22 13:07:53.343	817b6dd3-3d1a-41c6-9d6d-83641093db1b
b551db03-f06d-4024-bead-e0ccad3cc1cd	2018	28	287	f	\N	2026-06-22 13:07:53.124	2026-06-22 13:07:53.347	817b6dd3-3d1a-41c6-9d6d-83641093db1b
669af458-a5fb-4d2b-864b-9eb3b97b2ca0	2019	28	315	f	\N	2026-06-22 13:07:53.114	2026-06-22 13:07:53.353	817b6dd3-3d1a-41c6-9d6d-83641093db1b
691fa4d3-cfd9-48fa-b53b-9952d896a292	2020	28	343	f	\N	2026-06-22 13:07:53.104	2026-06-22 13:07:53.357	817b6dd3-3d1a-41c6-9d6d-83641093db1b
80ce71e3-a86c-4a26-9bee-cba7134a4747	2021	28	371	f	\N	2026-06-22 13:07:53.093	2026-06-22 13:07:53.36	817b6dd3-3d1a-41c6-9d6d-83641093db1b
376dd17a-ad46-4049-b332-2ee3497e47bd	2025	35	483	f	\N	2026-06-22 13:07:53.047	2026-06-22 13:07:53.379	817b6dd3-3d1a-41c6-9d6d-83641093db1b
b7d9b509-0d38-45f9-a5cf-0207ee75494b	2008	35	0	f	\N	2026-06-22 13:07:53.593	2026-06-22 13:07:53.593	86c1a1b3-81be-4b3a-b037-907463dd9d14
080d5c51-49dc-4fe0-b8d5-83ddee3fdd4e	2009	14	35	f	\N	2026-06-22 13:07:53.582	2026-06-22 13:07:53.6	86c1a1b3-81be-4b3a-b037-907463dd9d14
87bb63d9-45a5-4a9b-8a2c-cfc475e25907	2010	14	49	f	\N	2026-06-22 13:07:53.571	2026-06-22 13:07:53.605	86c1a1b3-81be-4b3a-b037-907463dd9d14
9e3ac438-ceb3-4c2d-9d97-fd72247ac477	2011	14	63	f	\N	2026-06-22 13:07:53.556	2026-06-22 13:07:53.61	86c1a1b3-81be-4b3a-b037-907463dd9d14
25d09a9b-b3c4-436f-b2be-6c4a7a843b7c	2012	14	77	f	\N	2026-06-22 13:07:53.545	2026-06-22 13:07:53.614	86c1a1b3-81be-4b3a-b037-907463dd9d14
8d3fc462-60c2-49cd-a45e-4f5c9df48e77	2013	14	91	f	\N	2026-06-22 13:07:53.533	2026-06-22 13:07:53.618	86c1a1b3-81be-4b3a-b037-907463dd9d14
c849b125-0566-441b-a277-927ee0a0cc6c	2014	21	105	f	\N	2026-06-22 13:07:53.522	2026-06-22 13:07:53.623	86c1a1b3-81be-4b3a-b037-907463dd9d14
a2bfcbcd-fd78-44c0-a5e7-d0328c8073d0	2015	21	126	f	\N	2026-06-22 13:07:53.51	2026-06-22 13:07:53.627	86c1a1b3-81be-4b3a-b037-907463dd9d14
4567b7fe-1855-462e-ba10-47b5acf45194	2016	21	147	f	\N	2026-06-22 13:07:53.5	2026-06-22 13:07:53.632	86c1a1b3-81be-4b3a-b037-907463dd9d14
abf8d334-9359-4384-999e-dcf5ab958b97	2017	21	168	f	\N	2026-06-22 13:07:53.489	2026-06-22 13:07:53.637	86c1a1b3-81be-4b3a-b037-907463dd9d14
bed6f05b-de10-42e7-b903-970e6a920b31	2018	21	189	f	\N	2026-06-22 13:07:53.477	2026-06-22 13:07:53.644	86c1a1b3-81be-4b3a-b037-907463dd9d14
5e7cc543-1410-441d-ba69-7ff33b9cd24a	2019	28	210	f	\N	2026-06-22 13:07:53.464	2026-06-22 13:07:53.651	86c1a1b3-81be-4b3a-b037-907463dd9d14
ba768c9e-b59b-4b51-917b-dd1f3fc531b3	2020	28	238	f	\N	2026-06-22 13:07:53.453	2026-06-22 13:07:53.655	86c1a1b3-81be-4b3a-b037-907463dd9d14
7f5a8d63-f5ea-4868-9e71-ce1403cd5fd0	2021	28	266	f	\N	2026-06-22 13:07:53.443	2026-06-22 13:07:53.659	86c1a1b3-81be-4b3a-b037-907463dd9d14
2066db9c-a278-4941-b42d-b6e4ba247087	2022	28	294	f	\N	2026-06-22 13:07:53.432	2026-06-22 13:07:53.664	86c1a1b3-81be-4b3a-b037-907463dd9d14
da8effe2-eeff-4508-9b2a-3ccab696909d	2023	28	322	f	\N	2026-06-22 13:07:53.422	2026-06-22 13:07:53.668	86c1a1b3-81be-4b3a-b037-907463dd9d14
b12befdd-d481-43c3-8bd9-2e3c36ade3a2	2024	28	350	f	\N	2026-06-22 13:07:53.411	2026-06-22 13:07:53.672	86c1a1b3-81be-4b3a-b037-907463dd9d14
871259ec-ef76-426b-85ec-68500dcc271b	2025	28	378	f	\N	2026-06-22 13:07:53.4	2026-06-22 13:07:53.676	86c1a1b3-81be-4b3a-b037-907463dd9d14
7c0ad3d9-b557-4846-af85-fb5a0a318f05	2015	35	0	f	\N	2026-06-22 13:07:53.81	2026-06-22 13:07:53.81	4a9be2c4-04a0-4b94-86b8-c2e2f863af3a
7c60c800-5172-4272-995a-6bce7e9c66a6	2016	7	35	f	\N	2026-06-22 13:07:53.8	2026-06-22 13:07:53.816	4a9be2c4-04a0-4b94-86b8-c2e2f863af3a
db49c1c9-6c5e-4aca-a55b-5ca648047084	2017	14	42	f	\N	2026-06-22 13:07:53.79	2026-06-22 13:07:53.821	4a9be2c4-04a0-4b94-86b8-c2e2f863af3a
ce3ca67e-5434-4df4-90e0-5d099ccfc7af	2018	14	56	f	\N	2026-06-22 13:07:53.779	2026-06-22 13:07:53.824	4a9be2c4-04a0-4b94-86b8-c2e2f863af3a
99662b5c-e3a4-45fb-940b-d7f2d6835f14	2019	14	70	f	\N	2026-06-22 13:07:53.768	2026-06-22 13:07:53.828	4a9be2c4-04a0-4b94-86b8-c2e2f863af3a
e3d81977-4738-4a7a-802c-87f077563ee4	2020	14	84	f	\N	2026-06-22 13:07:53.758	2026-06-22 13:07:53.831	4a9be2c4-04a0-4b94-86b8-c2e2f863af3a
d8696313-1193-4e78-91fc-af1575d08af9	2021	21	98	f	\N	2026-06-22 13:07:53.747	2026-06-22 13:07:53.837	4a9be2c4-04a0-4b94-86b8-c2e2f863af3a
31a161b5-a0d4-4609-b077-99315a6917e0	2022	21	119	f	\N	2026-06-22 13:07:53.735	2026-06-22 13:07:53.84	4a9be2c4-04a0-4b94-86b8-c2e2f863af3a
5f83c2fc-cc5b-4e2f-b575-a8e81f70901b	2023	21	140	f	\N	2026-06-22 13:07:53.723	2026-06-22 13:07:53.843	4a9be2c4-04a0-4b94-86b8-c2e2f863af3a
c6cc1c69-cee2-4e3d-82a9-8ed10f0b0939	2024	21	161	f	\N	2026-06-22 13:07:53.709	2026-06-22 13:07:53.847	4a9be2c4-04a0-4b94-86b8-c2e2f863af3a
5360056a-a87d-4fe0-9c8a-415ce702dc87	2025	21	182	f	\N	2026-06-22 13:07:53.696	2026-06-22 13:07:53.852	4a9be2c4-04a0-4b94-86b8-c2e2f863af3a
8caec9f3-722b-481c-9d08-3e75c85eef3f	2021	35	553	f	\N	2026-06-22 13:07:53.912	2026-06-22 13:07:54.268	7fe572ce-b5ab-41d3-b8f9-95ab6c591306
5ca54b1b-981e-4851-8846-a97a53b9ae29	2023	35	623	f	\N	2026-06-22 13:07:53.891	2026-06-22 13:07:54.275	7fe572ce-b5ab-41d3-b8f9-95ab6c591306
e6466970-d8d2-4a2c-bddb-c88062799580	2024	35	658	f	\N	2026-06-22 13:07:53.88	2026-06-22 13:07:54.28	7fe572ce-b5ab-41d3-b8f9-95ab6c591306
b6c3eb55-cf0d-4972-b5ab-460b979a7280	2025	35	693	f	\N	2026-06-22 13:07:53.869	2026-06-22 13:07:54.284	7fe572ce-b5ab-41d3-b8f9-95ab6c591306
6fd5d603-80f8-40e9-86f8-a4414db19265	1998	35	0	f	\N	2026-06-22 13:07:54.173	2026-06-22 13:07:54.173	7fe572ce-b5ab-41d3-b8f9-95ab6c591306
9f8b63f1-5e35-4d72-8a32-a86d16c6d993	1999	7	35	f	\N	2026-06-22 13:07:54.161	2026-06-22 13:07:54.179	7fe572ce-b5ab-41d3-b8f9-95ab6c591306
0f35da61-229b-40c2-8a0c-cd602f8cd49e	2000	14	42	f	\N	2026-06-22 13:07:54.148	2026-06-22 13:07:54.183	7fe572ce-b5ab-41d3-b8f9-95ab6c591306
a9a17c05-7302-4c18-a7cb-90c6707c2391	2001	14	56	f	\N	2026-06-22 13:07:54.138	2026-06-22 13:07:54.187	7fe572ce-b5ab-41d3-b8f9-95ab6c591306
6f44052c-7f01-42e3-899c-973a7cf3ca1c	2002	14	70	f	\N	2026-06-22 13:07:54.127	2026-06-22 13:07:54.191	7fe572ce-b5ab-41d3-b8f9-95ab6c591306
07b9da9e-4ab0-4120-901d-5891167ef849	2003	14	84	f	\N	2026-06-22 13:07:54.115	2026-06-22 13:07:54.195	7fe572ce-b5ab-41d3-b8f9-95ab6c591306
c8c3e3e0-b890-404d-9599-94c0bdb067bb	2004	21	98	f	\N	2026-06-22 13:07:54.105	2026-06-22 13:07:54.198	7fe572ce-b5ab-41d3-b8f9-95ab6c591306
a39c93c8-6f98-4504-911f-1496db2136ea	2005	21	119	f	\N	2026-06-22 13:07:54.094	2026-06-22 13:07:54.202	7fe572ce-b5ab-41d3-b8f9-95ab6c591306
585fecc4-3f99-4128-8e69-05f4314a1b97	2006	21	140	f	\N	2026-06-22 13:07:54.084	2026-06-22 13:07:54.206	7fe572ce-b5ab-41d3-b8f9-95ab6c591306
ceb5442f-bf30-45be-a919-cafc9da1ab22	2007	21	161	f	\N	2026-06-22 13:07:54.073	2026-06-22 13:07:54.21	7fe572ce-b5ab-41d3-b8f9-95ab6c591306
a8e487ef-d947-4f68-ac48-eb718cebacba	2008	21	182	f	\N	2026-06-22 13:07:54.062	2026-06-22 13:07:54.213	7fe572ce-b5ab-41d3-b8f9-95ab6c591306
012d0e30-4266-41f1-bb0e-625ab09f3d39	2009	28	203	f	\N	2026-06-22 13:07:54.052	2026-06-22 13:07:54.217	7fe572ce-b5ab-41d3-b8f9-95ab6c591306
7dcb1495-e296-42f8-a560-82beaccc91e6	2010	28	231	f	\N	2026-06-22 13:07:54.042	2026-06-22 13:07:54.222	7fe572ce-b5ab-41d3-b8f9-95ab6c591306
9c74e6a6-200b-400b-92c1-ae901780dfcc	2011	28	259	f	\N	2026-06-22 13:07:54.029	2026-06-22 13:07:54.225	7fe572ce-b5ab-41d3-b8f9-95ab6c591306
08e671ab-267b-4527-b8ee-13c86792a5d8	2012	28	287	f	\N	2026-06-22 13:07:54.018	2026-06-22 13:07:54.228	7fe572ce-b5ab-41d3-b8f9-95ab6c591306
03d41030-00b9-496e-93c1-213d623edee5	2013	28	315	f	\N	2026-06-22 13:07:54.005	2026-06-22 13:07:54.233	7fe572ce-b5ab-41d3-b8f9-95ab6c591306
03071a7b-1860-46a8-9cfa-4f2f98ddd6e2	2014	28	343	f	\N	2026-06-22 13:07:53.992	2026-06-22 13:07:54.238	7fe572ce-b5ab-41d3-b8f9-95ab6c591306
2e9c1d95-89e6-45f0-bc7a-e1d6e493ee9b	2015	28	371	f	\N	2026-06-22 13:07:53.98	2026-06-22 13:07:54.242	7fe572ce-b5ab-41d3-b8f9-95ab6c591306
df477f68-8872-47fe-b447-8a67b8764cbc	2016	28	399	f	\N	2026-06-22 13:07:53.967	2026-06-22 13:07:54.246	7fe572ce-b5ab-41d3-b8f9-95ab6c591306
7427efb2-369e-4ca4-acf6-6f8d13cd90f4	2017	28	427	f	\N	2026-06-22 13:07:53.956	2026-06-22 13:07:54.25	7fe572ce-b5ab-41d3-b8f9-95ab6c591306
db9f11b2-6e93-4af1-bc71-7065db146fe0	2018	28	455	f	\N	2026-06-22 13:07:53.946	2026-06-22 13:07:54.255	7fe572ce-b5ab-41d3-b8f9-95ab6c591306
fbf53ba9-2d8d-4266-9f86-02e5c82f56e9	2019	35	483	f	\N	2026-06-22 13:07:53.936	2026-06-22 13:07:54.259	7fe572ce-b5ab-41d3-b8f9-95ab6c591306
56ede1e9-7384-4c77-ab3a-a1e742db612b	2020	35	518	f	\N	2026-06-22 13:07:53.924	2026-06-22 13:07:54.264	7fe572ce-b5ab-41d3-b8f9-95ab6c591306
f2f29655-2db4-440f-b5b7-8239a6725da5	2022	35	588	f	\N	2026-06-22 13:07:53.901	2026-06-22 13:07:54.272	7fe572ce-b5ab-41d3-b8f9-95ab6c591306
59668bb5-6ac4-4124-aba4-1544b8a35d08	2027	21	21	f	\N	2026-06-24 16:55:44.549	2026-06-24 16:55:44.56	8bd5fa9b-5396-411d-82e7-284bc2b38f3d
0664f26b-8cb0-4dbf-b694-25d2add32585	2026	28	0	t	2026-06-24 17:18:43.029	2026-06-24 17:18:43.03	2026-06-24 17:18:43.03	152a9a13-3cd2-44bb-a82c-dd75343a30c7
41a6dd0e-9dcf-4fba-884f-5a4972e8f557	2026	21	0	t	2026-06-22 14:18:54.226	2026-06-22 14:18:54.227	2026-06-22 14:18:54.227	954f69ec-62e1-4b03-bfa4-3570bca42dba
81f45cfa-81fb-4ca3-899c-e32dfdf8667d	2027	28	7	t	2026-06-22 14:27:00.075	2026-06-22 12:26:13.185	2026-06-22 14:27:00.076	c9400fbf-1bbc-4ef5-9495-ca82c9ec4aa6
3ad8b957-bf9c-47fd-9521-07d994ad2084	2027	28	0	t	2026-06-22 14:27:00.095	2026-06-22 12:25:34.529	2026-06-22 14:27:00.096	86c1a1b3-81be-4b3a-b037-907463dd9d14
df0e0e4f-025f-4a6f-8481-abbd26cc2ccb	2027	28	21	t	2026-06-22 14:27:00.115	2026-06-22 14:18:54.321	2026-06-22 14:27:00.116	954f69ec-62e1-4b03-bfa4-3570bca42dba
eaf60520-d10f-4e6b-9958-866e6cf62ad5	2026	35	0	t	2026-06-24 16:50:56.529	2026-06-24 16:50:56.53	2026-06-24 16:50:56.53	dfad3bfe-6cad-4bfa-917d-cea7319e9d12
60c513cb-1b15-4784-8bb3-dea091c3b823	2027	14	35	f	\N	2026-06-24 16:50:56.546	2026-06-24 16:50:56.558	dfad3bfe-6cad-4bfa-917d-cea7319e9d12
c6ecbe66-b828-4963-a08d-200e4e3d1334	2026	28	0	t	2026-06-24 16:52:42.453	2026-06-24 16:52:42.454	2026-06-24 16:52:42.454	dc315223-e516-498b-bae8-ed8738d54952
0adefc96-6fa6-4203-bdc7-49ac3e194d2f	2027	28	28	f	\N	2026-06-24 16:52:42.473	2026-06-24 16:52:42.483	dc315223-e516-498b-bae8-ed8738d54952
0cc9d1d8-4e8c-4035-98ed-fa4731573ed3	2026	14	0	t	2026-06-24 16:53:27.295	2026-06-24 16:53:27.296	2026-06-24 16:53:27.296	d59e6a7f-c333-47b9-bc92-0ef0640f364d
4ff61fdd-d2f1-41d7-9f2a-b22415059141	2027	14	14	f	\N	2026-06-24 16:53:27.322	2026-06-24 16:53:27.339	d59e6a7f-c333-47b9-bc92-0ef0640f364d
209bd27e-4dbe-4394-90d9-a7a8537b9775	2026	7	0	t	2026-06-24 16:54:24.109	2026-06-24 16:54:24.11	2026-06-24 16:54:24.11	cbb8604f-1cb4-4d29-8b5a-9956126bb9d8
22dcc6db-d5ab-4ec7-8cbe-41db133675b4	2027	14	7	f	\N	2026-06-24 16:54:24.128	2026-06-24 16:54:24.14	cbb8604f-1cb4-4d29-8b5a-9956126bb9d8
27e74a26-69d3-465c-ba12-6a7ecabbccad	2026	14	0	t	2026-06-24 16:55:06.066	2026-06-24 16:55:06.067	2026-06-24 16:55:06.067	b5e8d2aa-0c7d-4219-9177-d54f6aad01e8
6c26868c-1880-45e3-87e6-3c9962f3d55e	2027	14	14	f	\N	2026-06-24 16:55:06.088	2026-06-24 16:55:06.103	b5e8d2aa-0c7d-4219-9177-d54f6aad01e8
36a1862e-4019-44c5-86d5-b6cd4f3b710f	2026	21	0	t	2026-06-24 16:55:44.514	2026-06-24 16:55:44.516	2026-06-24 16:55:44.516	8bd5fa9b-5396-411d-82e7-284bc2b38f3d
351a90e3-263a-45d2-a8f4-85c2c10c3400	2027	28	28	f	\N	2026-06-24 17:18:43.077	2026-06-24 17:18:43.09	152a9a13-3cd2-44bb-a82c-dd75343a30c7
0c27b36f-b1aa-4624-9bbd-24fdfce3bf3b	2026	21	0	t	2026-06-24 17:18:51.157	2026-06-24 17:18:51.158	2026-06-24 17:18:51.158	642c98ab-6f43-4adc-a2fc-b2a52ae534d9
2e8f18a2-1daf-482d-8b78-686686fed803	2026	28	0	t	2026-06-24 17:18:51.157	2026-06-24 17:18:51.158	2026-06-24 17:18:51.158	8f9f3ccd-9465-4762-9508-99e4e1e6bada
18e0e52d-1685-4450-8849-ec2eb7930aa4	2026	14	0	t	2026-06-24 17:18:51.157	2026-06-24 17:18:51.158	2026-06-24 17:18:51.158	95221991-05cc-4df9-bf72-2f439278f80f
cd54828d-5bb3-41a1-bccf-239a741552e8	2027	21	21	f	\N	2026-06-24 17:18:51.194	2026-06-24 17:18:51.216	642c98ab-6f43-4adc-a2fc-b2a52ae534d9
60f58c1f-c1e1-4cc8-869e-d869e4ab393f	2027	14	14	f	\N	2026-06-24 17:18:51.199	2026-06-24 17:18:51.22	95221991-05cc-4df9-bf72-2f439278f80f
d9379d93-a995-498c-8727-c3cd30ea5364	2027	35	28	f	\N	2026-06-24 17:18:51.197	2026-06-24 17:18:51.226	8f9f3ccd-9465-4762-9508-99e4e1e6bada
34cb6748-18ef-4c48-a294-623c79ec4555	2026	28	0	t	2026-06-24 17:20:58.465	2026-06-24 17:20:58.466	2026-06-24 17:20:58.466	dadaebbb-41c7-4123-8e84-999b9e6df3ad
1d6b6d95-6423-4f0b-a0d2-e3fe1bbe58da	2027	28	28	f	\N	2026-06-24 17:20:58.625	2026-06-24 17:20:58.676	dadaebbb-41c7-4123-8e84-999b9e6df3ad
257ad097-ad64-42fd-bac1-94d40801d800	2026	28	0	t	2026-06-24 17:21:31.268	2026-06-24 17:21:31.269	2026-06-24 17:21:31.269	f35e9cfb-dd49-45d4-bef9-649fc9cd36b2
43fb267a-e2f8-412a-b09a-7581cfda9427	2027	28	28	f	\N	2026-06-24 17:21:31.416	2026-06-24 17:21:31.486	f35e9cfb-dd49-45d4-bef9-649fc9cd36b2
2f77c433-ee57-42ec-b6ca-4264cbc3ed2f	2026	21	0	t	2026-06-24 17:22:08.584	2026-06-24 17:22:08.585	2026-06-24 17:22:08.585	194951f9-7099-46fe-877a-3a82871d27dc
50fa1905-1813-4798-be48-d2f7d0bce5d9	2026	21	0	t	2026-06-24 17:23:23.309	2026-06-24 17:23:23.31	2026-06-24 17:23:23.31	9d92f27b-a073-4c27-b158-1b08c9585d74
0d5fb31b-4374-4764-9132-6fd0e5583742	2027	21	21	f	\N	2026-06-24 17:22:08.754	2026-06-24 17:22:08.806	194951f9-7099-46fe-877a-3a82871d27dc
2d28c9da-f337-4d55-be7f-22d3257b1370	2026	28	0	t	2026-06-24 17:22:45.901	2026-06-24 17:22:45.902	2026-06-24 17:22:45.902	f1d95412-b024-4da2-89c5-5d9738fec332
71e4c9b2-47a6-4620-9504-c7a6aebce0ad	2027	28	28	f	\N	2026-06-24 17:22:46.075	2026-06-24 17:22:46.123	f1d95412-b024-4da2-89c5-5d9738fec332
fe506808-00ba-4c9e-be5e-dddd2d4c7b13	2027	21	21	f	\N	2026-06-24 17:23:23.434	2026-06-24 17:23:23.548	9d92f27b-a073-4c27-b158-1b08c9585d74
e57ee39a-4431-42d8-9537-2eb15a79d5ea	2026	14	0	t	2026-06-24 17:24:55.899	2026-06-24 17:24:55.899	2026-06-24 17:24:55.899	f6ab8d74-6f45-458b-bc2d-3219da4d3e27
2e1a8c58-a2ca-4272-a1d2-eb69f391b13b	2027	14	14	f	\N	2026-06-24 17:24:55.92	2026-06-24 17:24:55.93	f6ab8d74-6f45-458b-bc2d-3219da4d3e27
8073fddd-1bcb-4c82-88dd-fed9f28493af	2026	14	0	t	2026-06-24 17:26:58.796	2026-06-24 17:26:58.797	2026-06-24 17:26:58.797	2fadfbb2-5bf1-498d-95c9-385df90c0c4d
abe84675-2a66-4adb-a5f7-d806b40f6242	2027	14	14	f	\N	2026-06-24 17:26:58.834	2026-06-24 17:26:58.856	2fadfbb2-5bf1-498d-95c9-385df90c0c4d
fb670697-d738-4f9d-baa2-1d21fba7de0a	2026	14	0	t	2026-06-24 17:36:50.684	2026-06-24 17:36:50.685	2026-06-24 17:36:50.685	6b6ec440-9a48-45f1-bc71-a25a57bac579
03d2dbcd-19bd-410d-8e74-24b3e2495079	2027	14	14	f	\N	2026-06-24 17:36:50.741	2026-06-24 17:36:50.766	6b6ec440-9a48-45f1-bc71-a25a57bac579
c96ffad8-5328-4e95-b07e-a3e09a150b23	2026	28	0	t	2026-06-24 17:37:46.327	2026-06-24 17:37:46.328	2026-06-24 17:37:46.328	dcd1232c-c49e-4d29-9694-34929e2ad8b4
19ed24dc-677e-437d-9087-4a660dfa03f4	2027	28	28	f	\N	2026-06-24 17:37:46.368	2026-06-24 17:37:46.39	dcd1232c-c49e-4d29-9694-34929e2ad8b4
6e39bb1d-61e0-42e3-8c72-0df9a6ed40dd	2026	7	0	t	2026-06-24 17:38:23.868	2026-06-24 17:38:23.87	2026-06-24 17:38:23.87	8cd32692-d313-4ba7-8130-ed46b3a478d5
231b103e-f6fe-4385-adc6-139df96f44b7	2027	14	7	f	\N	2026-06-24 17:38:23.931	2026-06-24 17:38:23.942	8cd32692-d313-4ba7-8130-ed46b3a478d5
0cef3a2f-2308-46f8-b49b-778308b88731	2026	28	0	t	2026-06-24 17:40:14.143	2026-06-24 17:40:14.143	2026-06-24 17:40:14.143	7988575f-5c4c-4d78-be9e-20db815f2c29
740b4d5f-123b-42fe-adb5-bd6cff63215e	2027	28	28	f	\N	2026-06-24 17:40:14.202	2026-06-24 17:40:14.225	7988575f-5c4c-4d78-be9e-20db815f2c29
e66416c8-8805-4174-91c2-9378c876b03d	2026	14	0	t	2026-06-24 17:40:49.54	2026-06-24 17:40:49.541	2026-06-24 17:40:49.541	219c10c9-19e9-41b1-93f1-8465f1c47cfd
01ec456c-7a7a-43a3-8dc6-5ae6a191a680	2027	14	14	f	\N	2026-06-24 17:40:49.599	2026-06-24 17:40:49.628	219c10c9-19e9-41b1-93f1-8465f1c47cfd
d1d65372-55aa-43c9-9967-504f296e7d57	2026	21	0	t	2026-06-24 17:45:33.778	2026-06-24 17:45:33.778	2026-06-24 17:45:33.778	eedd3f48-32ba-482e-a55c-61c14ba9cbfa
d552ea4a-20a6-4cd1-8c2d-e9b7db7faa33	2027	21	21	f	\N	2026-06-24 17:45:33.831	2026-06-24 17:45:33.865	eedd3f48-32ba-482e-a55c-61c14ba9cbfa
8f68425d-a994-4ac6-8bd5-7cf79f550991	2026	14	0	t	2026-06-24 17:46:08.151	2026-06-24 17:46:08.152	2026-06-24 17:46:08.152	199fcf51-3f7a-41b1-b901-846a488e6698
1917d627-ae2d-4e89-a84e-ca76c59054bf	2027	14	14	f	\N	2026-06-24 17:46:08.254	2026-06-24 17:46:08.266	199fcf51-3f7a-41b1-b901-846a488e6698
e9520eae-df0a-432a-b479-192eaf55be48	2026	14	0	t	2026-06-24 17:46:48.256	2026-06-24 17:46:48.256	2026-06-24 17:46:48.256	ca3f6152-e16a-4a19-98f7-51b86b814c01
4cd42dc3-111b-4bc3-bb13-680ed9d9e7ba	2027	14	14	f	\N	2026-06-24 17:46:48.328	2026-06-24 17:46:48.367	ca3f6152-e16a-4a19-98f7-51b86b814c01
1f42a4e4-1c76-4725-a041-c1d2705e93de	2026	14	0	t	2026-06-24 17:47:28.199	2026-06-24 17:47:28.2	2026-06-24 17:47:28.2	7342c9d3-3999-4308-aaa3-271aada21281
69966631-860e-45b5-a517-d59e05cc272f	2027	14	14	f	\N	2026-06-24 17:47:28.286	2026-06-24 17:47:28.318	7342c9d3-3999-4308-aaa3-271aada21281
acfbdedd-35fd-46fc-93cf-41107af209a3	2026	14	0	t	2026-06-24 17:51:42.122	2026-06-24 17:51:42.123	2026-06-24 17:51:42.123	3ab77285-0209-405a-80c8-08d8f2b02299
8f776ad8-45ea-4dc8-801a-e91086c57a97	2027	14	14	f	\N	2026-06-24 17:51:42.15	2026-06-24 17:51:42.253	3ab77285-0209-405a-80c8-08d8f2b02299
62a6ebbd-1f09-4e1c-9db1-9c2f56dfd901	2026	28	0	t	2026-06-24 17:52:16.388	2026-06-24 17:52:16.389	2026-06-24 17:52:16.389	4a4c1f6c-907a-4c32-b7c1-8fd76e951189
ddc89b77-712a-48f5-9f36-973dd2e55455	2027	28	28	f	\N	2026-06-24 17:52:16.481	2026-06-24 17:52:16.511	4a4c1f6c-907a-4c32-b7c1-8fd76e951189
\.


--
-- Data for Name: VacationRequest; Type: TABLE DATA; Schema: public; Owner: vacasync
--

COPY public."VacationRequest" (id, "startDate", "endDate", "daysRequested", reason, status, "createdAt", "updatedAt", "employeeId", "chargedToYear") FROM stdin;
c343d516-5a4a-4f2c-8b20-25e59c1c61b9	2026-02-09 00:00:00	2026-02-15 00:00:00	7	Semana 1/3 - 2026	APPROVED	2026-06-23 16:06:14.639	2026-06-23 16:15:53.027	49ba9106-648f-4441-802a-be4cd5a244d6	2026
9d66cc35-521c-46af-a50a-0a5313a8eec7	2026-11-16 00:00:00	2026-11-20 00:00:00	7	Adelanto 2027 1/2 - 2027 	REJECTED	2026-06-22 14:23:11.346	2026-06-23 18:12:52.711	244d708d-255f-48c1-8f87-ea822ea1bf8d	2027
b778ab65-9c07-41e2-ba59-5fe77f1e4f83	2026-08-17 00:00:00	2026-08-21 00:00:00	6	 	REJECTED	2026-06-22 15:07:30.674	2026-06-25 14:30:55.908	4a9be2c4-04a0-4b94-86b8-c2e2f863af3a	2026
03164f42-23a1-42f6-99ec-ec172c8389fd	2025-11-10 00:00:00	2025-11-14 00:00:00	7	Semana 1/2 - 2026	APPROVED	2026-06-22 12:30:34.679	2026-06-22 13:54:28.448	244d708d-255f-48c1-8f87-ea822ea1bf8d	2026
b81b4fc0-2060-4672-9c14-74275c61885e	2026-07-27 00:00:00	2026-07-31 00:00:00	5	Semana 3/4 - 2026	REJECTED	2026-06-17 17:47:52.469	2026-06-19 14:55:25.594	fd92cacc-c90b-4e46-a443-daadf138d834	2026
3f104a8c-b85b-4f3b-9c14-58ba37e793d3	2026-07-06 00:00:00	2026-07-10 00:00:00	4	\N	REJECTED	2026-06-17 18:28:53.313	2026-06-19 14:55:31.816	fd92cacc-c90b-4e46-a443-daadf138d834	2026
f56205c1-49cc-4353-823b-37f01605b084	2026-07-12 00:00:00	2026-07-17 00:00:00	6	\N	REJECTED	2026-06-19 18:11:54.93	2026-06-19 18:12:06.55	4a9be2c4-04a0-4b94-86b8-c2e2f863af3a	2026
1ceb7483-6a34-4a7c-97ce-139e1fb75632	2026-12-09 00:00:00	2026-12-22 00:00:00	14	Semana 3/4 y 4/4 - 2026 	APPROVED	2026-06-19 17:19:03.409	2026-06-19 18:38:34.179	86c1a1b3-81be-4b3a-b037-907463dd9d14	2026
aaaba7f1-381c-4972-ae73-3d8503b4941b	2026-01-12 00:00:00	2026-01-16 00:00:00	7	Semana 1/4 - 2026	APPROVED	2026-06-19 17:12:02.661	2026-06-19 19:09:15.65	86c1a1b3-81be-4b3a-b037-907463dd9d14	2026
4cd7fea7-428b-47ba-8ab5-b4fd1ae95271	2026-07-27 00:00:00	2026-07-31 00:00:00	7	Semana 2/4 - 2026	APPROVED	2026-06-19 17:18:17.064	2026-06-19 19:09:15.657	86c1a1b3-81be-4b3a-b037-907463dd9d14	2026
212a3319-e2f8-450d-b0ce-69c2413575e6	2026-07-13 00:00:00	2026-07-17 00:00:00	7	MIRAME, MIRAME	APPROVED	2026-06-19 18:13:27.46	2026-06-19 19:09:15.664	4a9be2c4-04a0-4b94-86b8-c2e2f863af3a	2026
971b5d64-db87-4aaf-bb1f-33f9638da1d0	2026-07-27 00:00:00	2026-07-31 00:00:00	7	Semana 3/4 - 2026	APPROVED	2026-06-22 12:41:45.45	2026-06-22 13:55:46.601	fd92cacc-c90b-4e46-a443-daadf138d834	2026
82a7829f-456f-46fb-b52a-f157378b482f	2026-12-21 00:00:00	2027-01-01 00:00:00	14	Semanas 3/4 y 4/4 - 2026 	APPROVED	2026-06-19 18:03:30.045	2026-06-19 19:54:49.965	9c066787-94f9-4d7f-ba5f-ea5e94c69e3a	2026
cd74333a-b4d1-49e2-8c3a-91a126a96776	2026-02-02 00:00:00	2026-02-13 00:00:00	14	Semanas 1/4 y 2/4 - 2026	APPROVED	2026-06-19 18:09:43.943	2026-06-19 19:53:01.708	9c066787-94f9-4d7f-ba5f-ea5e94c69e3a	2026
bfa779f6-55ef-4567-8830-270191caabf2	2026-02-18 00:00:00	2026-03-03 00:00:00	14	Vacaciones de Verano	APPROVED	2026-06-19 19:56:57.789	2026-06-19 19:58:48.713	4a9be2c4-04a0-4b94-86b8-c2e2f863af3a	2026
e41f8780-3883-469d-97a6-714552b2555c	2026-07-20 00:00:00	2026-07-24 00:00:00	7	Semana 4/4 - 2026	APPROVED	2026-06-22 12:28:14.428	2026-06-22 12:28:20.552	7152f7f9-971f-48e9-bb14-fbc303fdd152	2026
be28e887-165f-4927-94d1-ca8f0a2a951d	2025-12-15 00:00:00	2025-12-20 00:00:00	7	Semana 1/4 - 2026	APPROVED	2026-06-22 12:31:07.554	2026-06-22 13:54:35.999	7152f7f9-971f-48e9-bb14-fbc303fdd152	2025
bb3e42ce-e13a-4a0c-8b41-d22ebbc0e20d	2026-01-12 00:00:00	2026-01-16 00:00:00	7	Semana 1/4 - 2026	APPROVED	2026-06-22 12:40:06.375	2026-06-22 13:54:41.967	fd92cacc-c90b-4e46-a443-daadf138d834	2026
cc25555a-3dee-429e-86f8-2ade6e0ce4e2	2026-01-12 00:00:00	2026-01-16 00:00:00	7	Semana 1/5 - 2026	APPROVED	2026-06-22 12:32:00.729	2026-06-22 13:54:47.371	817b6dd3-3d1a-41c6-9d6d-83641093db1b	2026
b1ddbbe6-96e9-4ff0-a0c3-1623169c907c	2026-01-19 00:00:00	2026-01-25 00:00:00	7	Semana 1/1 - 2026	APPROVED	2026-06-22 12:32:30.695	2026-06-22 13:54:52.574	7d8d086f-677a-489b-a73e-ca38dc5ccb64	2026
8a3a5971-cc52-41e1-8eac-c64bf03711b3	2026-01-26 00:00:00	2026-01-30 00:00:00	7	Semana 2/4 - 2026	APPROVED	2026-06-22 12:33:14.771	2026-06-22 13:54:59.152	7152f7f9-971f-48e9-bb14-fbc303fdd152	2026
12530124-c11f-4a7c-ad37-8a5f2a1837b3	2026-02-02 00:00:00	2026-02-08 00:00:00	7	Semana 1/2 - 2026	APPROVED	2026-06-22 12:33:41.586	2026-06-22 13:55:14.256	dc388f7d-9a02-4621-ae39-22556456732b	2026
686a912a-3c75-47f3-8acd-89bd35b96484	2026-03-23 00:00:00	2026-03-29 00:00:00	7	Semana 1/4 - 2026	APPROVED	2026-06-22 12:37:25.543	2026-06-22 13:55:20.098	c9400fbf-1bbc-4ef5-9495-ca82c9ec4aa6	2026
64efa627-465e-4593-8a26-2c4c5b5ccd43	2026-04-06 00:00:00	2026-04-12 00:00:00	7	Semana 2/5 - 2026	APPROVED	2026-06-22 12:37:54.915	2026-06-22 13:55:25.503	817b6dd3-3d1a-41c6-9d6d-83641093db1b	2026
01bd86c2-2753-4ed3-ba49-ddf2c3bfccf6	2026-05-25 00:00:00	2026-06-07 00:00:00	14	Semanas 2/4 y  3/4 - 2026	APPROVED	2026-06-22 12:38:34.455	2026-06-22 13:55:30.593	c9400fbf-1bbc-4ef5-9495-ca82c9ec4aa6	2026
24b10560-e968-45ab-ac7f-88ad11d99d51	2026-07-06 00:00:00	2026-07-08 00:00:00	3	Semana 2/4 - 2026 (3 dias restantes)	APPROVED	2026-06-22 12:40:40.698	2026-06-22 13:55:35.934	fd92cacc-c90b-4e46-a443-daadf138d834	2026
28d4add0-c540-44a3-8179-083b55b2815e	2026-07-13 00:00:00	2026-07-19 00:00:00	7	Semana 2/2 - 2026	APPROVED	2026-06-22 12:39:19.92	2026-06-22 13:55:41.535	dc388f7d-9a02-4621-ae39-22556456732b	2026
f48a57ce-f4a5-4110-9826-8b417547bbc5	2026-03-16 00:00:00	2026-03-22 00:00:00	7	Semana 2/2 - 2026	APPROVED	2026-06-22 14:24:51.438	2026-06-22 14:24:55.457	244d708d-255f-48c1-8f87-ea822ea1bf8d	2026
23b14177-f462-4480-8277-cec894d9522d	2026-03-09 00:00:00	2026-03-15 00:00:00	7	Semana 3/4 - 2026	APPROVED	2026-06-23 16:00:38.052	2026-06-23 16:00:42.679	7152f7f9-971f-48e9-bb14-fbc303fdd152	2026
b4818b1a-b554-47bf-ab64-9501b8c11e3d	2026-10-01 00:00:00	2026-10-15 00:00:00	15	 	REJECTED	2026-06-24 16:41:55.67	2026-06-25 14:29:49.755	7fe572ce-b5ab-41d3-b8f9-95ab6c591306	2026
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: vacasync
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
4c86729b-5a9e-4a68-8b8e-1aa26ff4dfbf	16b03193b32d202c9270138e8183e93b1dafc2726dcf9782a240c51952acc437	2026-06-22 14:50:58.531722+00	20260622000001_add_vacation_cycle_and_settings		\N	2026-06-22 14:50:58.531722+00	0
a2fab35f-8887-47a4-b7a9-a4cc6ea06f9e	04cdbe9f3849edfe5621b30553ef5753e188c51649bfca740b01db0b9316e312	2026-06-22 14:51:04.886093+00	20260622200000_add_charged_to_year	\N	\N	2026-06-22 14:51:04.850484+00	1
\.


--
-- Name: ApprovalHistory ApprovalHistory_pkey; Type: CONSTRAINT; Schema: public; Owner: vacasync
--

ALTER TABLE ONLY public."ApprovalHistory"
    ADD CONSTRAINT "ApprovalHistory_pkey" PRIMARY KEY (id);


--
-- Name: AuditLog AuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: vacasync
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY (id);


--
-- Name: Department Department_pkey; Type: CONSTRAINT; Schema: public; Owner: vacasync
--

ALTER TABLE ONLY public."Department"
    ADD CONSTRAINT "Department_pkey" PRIMARY KEY (id);


--
-- Name: Employee Employee_pkey; Type: CONSTRAINT; Schema: public; Owner: vacasync
--

ALTER TABLE ONLY public."Employee"
    ADD CONSTRAINT "Employee_pkey" PRIMARY KEY (id);


--
-- Name: Holiday Holiday_pkey; Type: CONSTRAINT; Schema: public; Owner: vacasync
--

ALTER TABLE ONLY public."Holiday"
    ADD CONSTRAINT "Holiday_pkey" PRIMARY KEY (id);


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: vacasync
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- Name: SystemConfig SystemConfig_pkey; Type: CONSTRAINT; Schema: public; Owner: vacasync
--

ALTER TABLE ONLY public."SystemConfig"
    ADD CONSTRAINT "SystemConfig_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: vacasync
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: VacationCycle VacationCycle_pkey; Type: CONSTRAINT; Schema: public; Owner: vacasync
--

ALTER TABLE ONLY public."VacationCycle"
    ADD CONSTRAINT "VacationCycle_pkey" PRIMARY KEY (id);


--
-- Name: VacationRequest VacationRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: vacasync
--

ALTER TABLE ONLY public."VacationRequest"
    ADD CONSTRAINT "VacationRequest_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: vacasync
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: ApprovalHistory_requestId_idx; Type: INDEX; Schema: public; Owner: vacasync
--

CREATE INDEX "ApprovalHistory_requestId_idx" ON public."ApprovalHistory" USING btree ("requestId");


--
-- Name: AuditLog_entity_idx; Type: INDEX; Schema: public; Owner: vacasync
--

CREATE INDEX "AuditLog_entity_idx" ON public."AuditLog" USING btree (entity);


--
-- Name: AuditLog_userId_idx; Type: INDEX; Schema: public; Owner: vacasync
--

CREATE INDEX "AuditLog_userId_idx" ON public."AuditLog" USING btree ("userId");


--
-- Name: Department_name_key; Type: INDEX; Schema: public; Owner: vacasync
--

CREATE UNIQUE INDEX "Department_name_key" ON public."Department" USING btree (name);


--
-- Name: Employee_email_key; Type: INDEX; Schema: public; Owner: vacasync
--

CREATE UNIQUE INDEX "Employee_email_key" ON public."Employee" USING btree (email);


--
-- Name: Holiday_date_key; Type: INDEX; Schema: public; Owner: vacasync
--

CREATE UNIQUE INDEX "Holiday_date_key" ON public."Holiday" USING btree (date);


--
-- Name: Notification_userId_idx; Type: INDEX; Schema: public; Owner: vacasync
--

CREATE INDEX "Notification_userId_idx" ON public."Notification" USING btree ("userId");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: vacasync
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_employeeId_key; Type: INDEX; Schema: public; Owner: vacasync
--

CREATE UNIQUE INDEX "User_employeeId_key" ON public."User" USING btree ("employeeId");


--
-- Name: VacationCycle_employeeId_idx; Type: INDEX; Schema: public; Owner: vacasync
--

CREATE INDEX "VacationCycle_employeeId_idx" ON public."VacationCycle" USING btree ("employeeId");


--
-- Name: VacationCycle_employeeId_year_key; Type: INDEX; Schema: public; Owner: vacasync
--

CREATE UNIQUE INDEX "VacationCycle_employeeId_year_key" ON public."VacationCycle" USING btree ("employeeId", year);


--
-- Name: VacationCycle_year_idx; Type: INDEX; Schema: public; Owner: vacasync
--

CREATE INDEX "VacationCycle_year_idx" ON public."VacationCycle" USING btree (year);


--
-- Name: VacationRequest_chargedToYear_idx; Type: INDEX; Schema: public; Owner: vacasync
--

CREATE INDEX "VacationRequest_chargedToYear_idx" ON public."VacationRequest" USING btree ("chargedToYear");


--
-- Name: VacationRequest_employeeId_idx; Type: INDEX; Schema: public; Owner: vacasync
--

CREATE INDEX "VacationRequest_employeeId_idx" ON public."VacationRequest" USING btree ("employeeId");


--
-- Name: VacationRequest_status_idx; Type: INDEX; Schema: public; Owner: vacasync
--

CREATE INDEX "VacationRequest_status_idx" ON public."VacationRequest" USING btree (status);


--
-- Name: ApprovalHistory ApprovalHistory_approverId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vacasync
--

ALTER TABLE ONLY public."ApprovalHistory"
    ADD CONSTRAINT "ApprovalHistory_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ApprovalHistory ApprovalHistory_requestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vacasync
--

ALTER TABLE ONLY public."ApprovalHistory"
    ADD CONSTRAINT "ApprovalHistory_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES public."VacationRequest"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AuditLog AuditLog_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vacasync
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Employee Employee_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vacasync
--

ALTER TABLE ONLY public."Employee"
    ADD CONSTRAINT "Employee_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public."Department"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Notification Notification_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vacasync
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: User User_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vacasync
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: VacationCycle VacationCycle_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vacasync
--

ALTER TABLE ONLY public."VacationCycle"
    ADD CONSTRAINT "VacationCycle_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: VacationRequest VacationRequest_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vacasync
--

ALTER TABLE ONLY public."VacationRequest"
    ADD CONSTRAINT "VacationRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict a2b5IOZGCLHcbQ3Qh92MfGq3XTS0QU5V5BzessFWgkbzOdemt9bHi0j0XhYZ64g

