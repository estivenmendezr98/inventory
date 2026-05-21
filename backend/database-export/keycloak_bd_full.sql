Emulate Docker CLI using podman. Create /etc/containers/nodocker to quiet msg.
--
-- PostgreSQL database dump
--

\restrict pzGVf1tKPv2AaH2BrriXWKQJPWs0ULeOdBeTacKgPxteszfre4h3VaepB4c1V9y

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_event_entity; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_event_entity (
    id character varying(36) NOT NULL,
    admin_event_time bigint,
    realm_id character varying(255),
    operation_type character varying(255),
    auth_realm_id character varying(255),
    auth_client_id character varying(255),
    auth_user_id character varying(255),
    ip_address character varying(255),
    resource_path character varying(2550),
    representation text,
    error character varying(255),
    resource_type character varying(64)
);


--
-- Name: associated_policy; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.associated_policy (
    policy_id character varying(36) NOT NULL,
    associated_policy_id character varying(36) NOT NULL
);


--
-- Name: authentication_execution; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.authentication_execution (
    id character varying(36) NOT NULL,
    alias character varying(255),
    authenticator character varying(36),
    realm_id character varying(36),
    flow_id character varying(36),
    requirement integer,
    priority integer,
    authenticator_flow boolean DEFAULT false NOT NULL,
    auth_flow_id character varying(36),
    auth_config character varying(36)
);


--
-- Name: authentication_flow; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.authentication_flow (
    id character varying(36) NOT NULL,
    alias character varying(255),
    description character varying(255),
    realm_id character varying(36),
    provider_id character varying(36) DEFAULT 'basic-flow'::character varying NOT NULL,
    top_level boolean DEFAULT false NOT NULL,
    built_in boolean DEFAULT false NOT NULL
);


--
-- Name: authenticator_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.authenticator_config (
    id character varying(36) NOT NULL,
    alias character varying(255),
    realm_id character varying(36)
);


--
-- Name: authenticator_config_entry; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.authenticator_config_entry (
    authenticator_id character varying(36) NOT NULL,
    value text,
    name character varying(255) NOT NULL
);


--
-- Name: broker_link; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.broker_link (
    identity_provider character varying(255) NOT NULL,
    storage_provider_id character varying(255),
    realm_id character varying(36) NOT NULL,
    broker_user_id character varying(255),
    broker_username character varying(255),
    token text,
    user_id character varying(255) NOT NULL
);


--
-- Name: client; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client (
    id character varying(36) NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    full_scope_allowed boolean DEFAULT false NOT NULL,
    client_id character varying(255),
    not_before integer,
    public_client boolean DEFAULT false NOT NULL,
    secret character varying(255),
    base_url character varying(255),
    bearer_only boolean DEFAULT false NOT NULL,
    management_url character varying(255),
    surrogate_auth_required boolean DEFAULT false NOT NULL,
    realm_id character varying(36),
    protocol character varying(255),
    node_rereg_timeout integer DEFAULT 0,
    frontchannel_logout boolean DEFAULT false NOT NULL,
    consent_required boolean DEFAULT false NOT NULL,
    name character varying(255),
    service_accounts_enabled boolean DEFAULT false NOT NULL,
    client_authenticator_type character varying(255),
    root_url character varying(255),
    description character varying(255),
    registration_token character varying(255),
    standard_flow_enabled boolean DEFAULT true NOT NULL,
    implicit_flow_enabled boolean DEFAULT false NOT NULL,
    direct_access_grants_enabled boolean DEFAULT false NOT NULL,
    always_display_in_console boolean DEFAULT false NOT NULL
);


--
-- Name: client_attributes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_attributes (
    client_id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    value text
);


--
-- Name: client_auth_flow_bindings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_auth_flow_bindings (
    client_id character varying(36) NOT NULL,
    flow_id character varying(36),
    binding_name character varying(255) NOT NULL
);


--
-- Name: client_initial_access; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_initial_access (
    id character varying(36) NOT NULL,
    realm_id character varying(36) NOT NULL,
    "timestamp" integer,
    expiration integer,
    count integer,
    remaining_count integer
);


--
-- Name: client_node_registrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_node_registrations (
    client_id character varying(36) NOT NULL,
    value integer,
    name character varying(255) NOT NULL
);


--
-- Name: client_scope; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_scope (
    id character varying(36) NOT NULL,
    name character varying(255),
    realm_id character varying(36),
    description character varying(255),
    protocol character varying(255)
);


--
-- Name: client_scope_attributes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_scope_attributes (
    scope_id character varying(36) NOT NULL,
    value character varying(2048),
    name character varying(255) NOT NULL
);


--
-- Name: client_scope_client; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_scope_client (
    client_id character varying(255) NOT NULL,
    scope_id character varying(255) NOT NULL,
    default_scope boolean DEFAULT false NOT NULL
);


--
-- Name: client_scope_role_mapping; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_scope_role_mapping (
    scope_id character varying(36) NOT NULL,
    role_id character varying(36) NOT NULL
);


--
-- Name: client_session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_session (
    id character varying(36) NOT NULL,
    client_id character varying(36),
    redirect_uri character varying(255),
    state character varying(255),
    "timestamp" integer,
    session_id character varying(36),
    auth_method character varying(255),
    realm_id character varying(255),
    auth_user_id character varying(36),
    current_action character varying(36)
);


--
-- Name: client_session_auth_status; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_session_auth_status (
    authenticator character varying(36) NOT NULL,
    status integer,
    client_session character varying(36) NOT NULL
);


--
-- Name: client_session_note; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_session_note (
    name character varying(255) NOT NULL,
    value character varying(255),
    client_session character varying(36) NOT NULL
);


--
-- Name: client_session_prot_mapper; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_session_prot_mapper (
    protocol_mapper_id character varying(36) NOT NULL,
    client_session character varying(36) NOT NULL
);


--
-- Name: client_session_role; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_session_role (
    role_id character varying(255) NOT NULL,
    client_session character varying(36) NOT NULL
);


--
-- Name: client_user_session_note; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_user_session_note (
    name character varying(255) NOT NULL,
    value character varying(2048),
    client_session character varying(36) NOT NULL
);


--
-- Name: component; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.component (
    id character varying(36) NOT NULL,
    name character varying(255),
    parent_id character varying(36),
    provider_id character varying(36),
    provider_type character varying(255),
    realm_id character varying(36),
    sub_type character varying(255)
);


--
-- Name: component_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.component_config (
    id character varying(36) NOT NULL,
    component_id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    value text
);


--
-- Name: composite_role; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.composite_role (
    composite character varying(36) NOT NULL,
    child_role character varying(36) NOT NULL
);


--
-- Name: credential; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.credential (
    id character varying(36) NOT NULL,
    salt bytea,
    type character varying(255),
    user_id character varying(36),
    created_date bigint,
    user_label character varying(255),
    secret_data text,
    credential_data text,
    priority integer
);


--
-- Name: databasechangelog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.databasechangelog (
    id character varying(255) NOT NULL,
    author character varying(255) NOT NULL,
    filename character varying(255) NOT NULL,
    dateexecuted timestamp without time zone NOT NULL,
    orderexecuted integer NOT NULL,
    exectype character varying(10) NOT NULL,
    md5sum character varying(35),
    description character varying(255),
    comments character varying(255),
    tag character varying(255),
    liquibase character varying(20),
    contexts character varying(255),
    labels character varying(255),
    deployment_id character varying(10)
);


--
-- Name: databasechangeloglock; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.databasechangeloglock (
    id integer NOT NULL,
    locked boolean NOT NULL,
    lockgranted timestamp without time zone,
    lockedby character varying(255)
);


--
-- Name: default_client_scope; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.default_client_scope (
    realm_id character varying(36) NOT NULL,
    scope_id character varying(36) NOT NULL,
    default_scope boolean DEFAULT false NOT NULL
);


--
-- Name: event_entity; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_entity (
    id character varying(36) NOT NULL,
    client_id character varying(255),
    details_json character varying(2550),
    error character varying(255),
    ip_address character varying(255),
    realm_id character varying(255),
    session_id character varying(255),
    event_time bigint,
    type character varying(255),
    user_id character varying(255),
    details_json_long_value text
);


--
-- Name: fed_user_attribute; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fed_user_attribute (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    user_id character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    storage_provider_id character varying(36),
    value character varying(2024),
    long_value_hash bytea,
    long_value_hash_lower_case bytea,
    long_value text
);


--
-- Name: fed_user_consent; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fed_user_consent (
    id character varying(36) NOT NULL,
    client_id character varying(255),
    user_id character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    storage_provider_id character varying(36),
    created_date bigint,
    last_updated_date bigint,
    client_storage_provider character varying(36),
    external_client_id character varying(255)
);


--
-- Name: fed_user_consent_cl_scope; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fed_user_consent_cl_scope (
    user_consent_id character varying(36) NOT NULL,
    scope_id character varying(36) NOT NULL
);


--
-- Name: fed_user_credential; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fed_user_credential (
    id character varying(36) NOT NULL,
    salt bytea,
    type character varying(255),
    created_date bigint,
    user_id character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    storage_provider_id character varying(36),
    user_label character varying(255),
    secret_data text,
    credential_data text,
    priority integer
);


--
-- Name: fed_user_group_membership; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fed_user_group_membership (
    group_id character varying(36) NOT NULL,
    user_id character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    storage_provider_id character varying(36)
);


--
-- Name: fed_user_required_action; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fed_user_required_action (
    required_action character varying(255) DEFAULT ' '::character varying NOT NULL,
    user_id character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    storage_provider_id character varying(36)
);


--
-- Name: fed_user_role_mapping; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fed_user_role_mapping (
    role_id character varying(36) NOT NULL,
    user_id character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    storage_provider_id character varying(36)
);


--
-- Name: federated_identity; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.federated_identity (
    identity_provider character varying(255) NOT NULL,
    realm_id character varying(36),
    federated_user_id character varying(255),
    federated_username character varying(255),
    token text,
    user_id character varying(36) NOT NULL
);


--
-- Name: federated_user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.federated_user (
    id character varying(255) NOT NULL,
    storage_provider_id character varying(255),
    realm_id character varying(36) NOT NULL
);


--
-- Name: group_attribute; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.group_attribute (
    id character varying(36) DEFAULT 'sybase-needs-something-here'::character varying NOT NULL,
    name character varying(255) NOT NULL,
    value character varying(255),
    group_id character varying(36) NOT NULL
);


--
-- Name: group_role_mapping; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.group_role_mapping (
    role_id character varying(36) NOT NULL,
    group_id character varying(36) NOT NULL
);


--
-- Name: identity_provider; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.identity_provider (
    internal_id character varying(36) NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    provider_alias character varying(255),
    provider_id character varying(255),
    store_token boolean DEFAULT false NOT NULL,
    authenticate_by_default boolean DEFAULT false NOT NULL,
    realm_id character varying(36),
    add_token_role boolean DEFAULT true NOT NULL,
    trust_email boolean DEFAULT false NOT NULL,
    first_broker_login_flow_id character varying(36),
    post_broker_login_flow_id character varying(36),
    provider_display_name character varying(255),
    link_only boolean DEFAULT false NOT NULL
);


--
-- Name: identity_provider_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.identity_provider_config (
    identity_provider_id character varying(36) NOT NULL,
    value text,
    name character varying(255) NOT NULL
);


--
-- Name: identity_provider_mapper; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.identity_provider_mapper (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    idp_alias character varying(255) NOT NULL,
    idp_mapper_name character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL
);


--
-- Name: idp_mapper_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.idp_mapper_config (
    idp_mapper_id character varying(36) NOT NULL,
    value text,
    name character varying(255) NOT NULL
);


--
-- Name: keycloak_group; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.keycloak_group (
    id character varying(36) NOT NULL,
    name character varying(255),
    parent_group character varying(36) NOT NULL,
    realm_id character varying(36)
);


--
-- Name: keycloak_role; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.keycloak_role (
    id character varying(36) NOT NULL,
    client_realm_constraint character varying(255),
    client_role boolean DEFAULT false NOT NULL,
    description character varying(255),
    name character varying(255),
    realm_id character varying(255),
    client character varying(36),
    realm character varying(36)
);


--
-- Name: migration_model; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.migration_model (
    id character varying(36) NOT NULL,
    version character varying(36),
    update_time bigint DEFAULT 0 NOT NULL
);


--
-- Name: offline_client_session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.offline_client_session (
    user_session_id character varying(36) NOT NULL,
    client_id character varying(255) NOT NULL,
    offline_flag character varying(4) NOT NULL,
    "timestamp" integer,
    data text,
    client_storage_provider character varying(36) DEFAULT 'local'::character varying NOT NULL,
    external_client_id character varying(255) DEFAULT 'local'::character varying NOT NULL,
    version integer DEFAULT 0
);


--
-- Name: offline_user_session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.offline_user_session (
    user_session_id character varying(36) NOT NULL,
    user_id character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    created_on integer NOT NULL,
    offline_flag character varying(4) NOT NULL,
    data text,
    last_session_refresh integer DEFAULT 0 NOT NULL,
    broker_session_id character varying(1024),
    version integer DEFAULT 0
);


--
-- Name: org; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.org (
    id character varying(255) NOT NULL,
    enabled boolean NOT NULL,
    realm_id character varying(255) NOT NULL,
    group_id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(4000)
);


--
-- Name: org_domain; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.org_domain (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    verified boolean NOT NULL,
    org_id character varying(255) NOT NULL
);


--
-- Name: policy_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.policy_config (
    policy_id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    value text
);


--
-- Name: protocol_mapper; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.protocol_mapper (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    protocol character varying(255) NOT NULL,
    protocol_mapper_name character varying(255) NOT NULL,
    client_id character varying(36),
    client_scope_id character varying(36)
);


--
-- Name: protocol_mapper_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.protocol_mapper_config (
    protocol_mapper_id character varying(36) NOT NULL,
    value text,
    name character varying(255) NOT NULL
);


--
-- Name: realm; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.realm (
    id character varying(36) NOT NULL,
    access_code_lifespan integer,
    user_action_lifespan integer,
    access_token_lifespan integer,
    account_theme character varying(255),
    admin_theme character varying(255),
    email_theme character varying(255),
    enabled boolean DEFAULT false NOT NULL,
    events_enabled boolean DEFAULT false NOT NULL,
    events_expiration bigint,
    login_theme character varying(255),
    name character varying(255),
    not_before integer,
    password_policy character varying(2550),
    registration_allowed boolean DEFAULT false NOT NULL,
    remember_me boolean DEFAULT false NOT NULL,
    reset_password_allowed boolean DEFAULT false NOT NULL,
    social boolean DEFAULT false NOT NULL,
    ssl_required character varying(255),
    sso_idle_timeout integer,
    sso_max_lifespan integer,
    update_profile_on_soc_login boolean DEFAULT false NOT NULL,
    verify_email boolean DEFAULT false NOT NULL,
    master_admin_client character varying(36),
    login_lifespan integer,
    internationalization_enabled boolean DEFAULT false NOT NULL,
    default_locale character varying(255),
    reg_email_as_username boolean DEFAULT false NOT NULL,
    admin_events_enabled boolean DEFAULT false NOT NULL,
    admin_events_details_enabled boolean DEFAULT false NOT NULL,
    edit_username_allowed boolean DEFAULT false NOT NULL,
    otp_policy_counter integer DEFAULT 0,
    otp_policy_window integer DEFAULT 1,
    otp_policy_period integer DEFAULT 30,
    otp_policy_digits integer DEFAULT 6,
    otp_policy_alg character varying(36) DEFAULT 'HmacSHA1'::character varying,
    otp_policy_type character varying(36) DEFAULT 'totp'::character varying,
    browser_flow character varying(36),
    registration_flow character varying(36),
    direct_grant_flow character varying(36),
    reset_credentials_flow character varying(36),
    client_auth_flow character varying(36),
    offline_session_idle_timeout integer DEFAULT 0,
    revoke_refresh_token boolean DEFAULT false NOT NULL,
    access_token_life_implicit integer DEFAULT 0,
    login_with_email_allowed boolean DEFAULT true NOT NULL,
    duplicate_emails_allowed boolean DEFAULT false NOT NULL,
    docker_auth_flow character varying(36),
    refresh_token_max_reuse integer DEFAULT 0,
    allow_user_managed_access boolean DEFAULT false NOT NULL,
    sso_max_lifespan_remember_me integer DEFAULT 0 NOT NULL,
    sso_idle_timeout_remember_me integer DEFAULT 0 NOT NULL,
    default_role character varying(255)
);


--
-- Name: realm_attribute; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.realm_attribute (
    name character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    value text
);


--
-- Name: realm_default_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.realm_default_groups (
    realm_id character varying(36) NOT NULL,
    group_id character varying(36) NOT NULL
);


--
-- Name: realm_enabled_event_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.realm_enabled_event_types (
    realm_id character varying(36) NOT NULL,
    value character varying(255) NOT NULL
);


--
-- Name: realm_events_listeners; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.realm_events_listeners (
    realm_id character varying(36) NOT NULL,
    value character varying(255) NOT NULL
);


--
-- Name: realm_localizations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.realm_localizations (
    realm_id character varying(255) NOT NULL,
    locale character varying(255) NOT NULL,
    texts text NOT NULL
);


--
-- Name: realm_required_credential; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.realm_required_credential (
    type character varying(255) NOT NULL,
    form_label character varying(255),
    input boolean DEFAULT false NOT NULL,
    secret boolean DEFAULT false NOT NULL,
    realm_id character varying(36) NOT NULL
);


--
-- Name: realm_smtp_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.realm_smtp_config (
    realm_id character varying(36) NOT NULL,
    value character varying(255),
    name character varying(255) NOT NULL
);


--
-- Name: realm_supported_locales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.realm_supported_locales (
    realm_id character varying(36) NOT NULL,
    value character varying(255) NOT NULL
);


--
-- Name: redirect_uris; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.redirect_uris (
    client_id character varying(36) NOT NULL,
    value character varying(255) NOT NULL
);


--
-- Name: required_action_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.required_action_config (
    required_action_id character varying(36) NOT NULL,
    value text,
    name character varying(255) NOT NULL
);


--
-- Name: required_action_provider; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.required_action_provider (
    id character varying(36) NOT NULL,
    alias character varying(255),
    name character varying(255),
    realm_id character varying(36),
    enabled boolean DEFAULT false NOT NULL,
    default_action boolean DEFAULT false NOT NULL,
    provider_id character varying(255),
    priority integer
);


--
-- Name: resource_attribute; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resource_attribute (
    id character varying(36) DEFAULT 'sybase-needs-something-here'::character varying NOT NULL,
    name character varying(255) NOT NULL,
    value character varying(255),
    resource_id character varying(36) NOT NULL
);


--
-- Name: resource_policy; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resource_policy (
    resource_id character varying(36) NOT NULL,
    policy_id character varying(36) NOT NULL
);


--
-- Name: resource_scope; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resource_scope (
    resource_id character varying(36) NOT NULL,
    scope_id character varying(36) NOT NULL
);


--
-- Name: resource_server; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resource_server (
    id character varying(36) NOT NULL,
    allow_rs_remote_mgmt boolean DEFAULT false NOT NULL,
    policy_enforce_mode smallint NOT NULL,
    decision_strategy smallint DEFAULT 1 NOT NULL
);


--
-- Name: resource_server_perm_ticket; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resource_server_perm_ticket (
    id character varying(36) NOT NULL,
    owner character varying(255) NOT NULL,
    requester character varying(255) NOT NULL,
    created_timestamp bigint NOT NULL,
    granted_timestamp bigint,
    resource_id character varying(36) NOT NULL,
    scope_id character varying(36),
    resource_server_id character varying(36) NOT NULL,
    policy_id character varying(36)
);


--
-- Name: resource_server_policy; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resource_server_policy (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(255),
    type character varying(255) NOT NULL,
    decision_strategy smallint,
    logic smallint,
    resource_server_id character varying(36) NOT NULL,
    owner character varying(255)
);


--
-- Name: resource_server_resource; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resource_server_resource (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(255),
    icon_uri character varying(255),
    owner character varying(255) NOT NULL,
    resource_server_id character varying(36) NOT NULL,
    owner_managed_access boolean DEFAULT false NOT NULL,
    display_name character varying(255)
);


--
-- Name: resource_server_scope; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resource_server_scope (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    icon_uri character varying(255),
    resource_server_id character varying(36) NOT NULL,
    display_name character varying(255)
);


--
-- Name: resource_uris; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resource_uris (
    resource_id character varying(36) NOT NULL,
    value character varying(255) NOT NULL
);


--
-- Name: role_attribute; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_attribute (
    id character varying(36) NOT NULL,
    role_id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    value character varying(255)
);


--
-- Name: scope_mapping; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scope_mapping (
    client_id character varying(36) NOT NULL,
    role_id character varying(36) NOT NULL
);


--
-- Name: scope_policy; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scope_policy (
    scope_id character varying(36) NOT NULL,
    policy_id character varying(36) NOT NULL
);


--
-- Name: user_attribute; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_attribute (
    name character varying(255) NOT NULL,
    value character varying(255),
    user_id character varying(36) NOT NULL,
    id character varying(36) DEFAULT 'sybase-needs-something-here'::character varying NOT NULL,
    long_value_hash bytea,
    long_value_hash_lower_case bytea,
    long_value text
);


--
-- Name: user_consent; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_consent (
    id character varying(36) NOT NULL,
    client_id character varying(255),
    user_id character varying(36) NOT NULL,
    created_date bigint,
    last_updated_date bigint,
    client_storage_provider character varying(36),
    external_client_id character varying(255)
);


--
-- Name: user_consent_client_scope; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_consent_client_scope (
    user_consent_id character varying(36) NOT NULL,
    scope_id character varying(36) NOT NULL
);


--
-- Name: user_entity; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_entity (
    id character varying(36) NOT NULL,
    email character varying(255),
    email_constraint character varying(255),
    email_verified boolean DEFAULT false NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    federation_link character varying(255),
    first_name character varying(255),
    last_name character varying(255),
    realm_id character varying(255),
    username character varying(255),
    created_timestamp bigint,
    service_account_client_link character varying(255),
    not_before integer DEFAULT 0 NOT NULL
);


--
-- Name: user_federation_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_federation_config (
    user_federation_provider_id character varying(36) NOT NULL,
    value character varying(255),
    name character varying(255) NOT NULL
);


--
-- Name: user_federation_mapper; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_federation_mapper (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    federation_provider_id character varying(36) NOT NULL,
    federation_mapper_type character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL
);


--
-- Name: user_federation_mapper_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_federation_mapper_config (
    user_federation_mapper_id character varying(36) NOT NULL,
    value character varying(255),
    name character varying(255) NOT NULL
);


--
-- Name: user_federation_provider; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_federation_provider (
    id character varying(36) NOT NULL,
    changed_sync_period integer,
    display_name character varying(255),
    full_sync_period integer,
    last_sync integer,
    priority integer,
    provider_name character varying(255),
    realm_id character varying(36)
);


--
-- Name: user_group_membership; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_group_membership (
    group_id character varying(36) NOT NULL,
    user_id character varying(36) NOT NULL
);


--
-- Name: user_required_action; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_required_action (
    user_id character varying(36) NOT NULL,
    required_action character varying(255) DEFAULT ' '::character varying NOT NULL
);


--
-- Name: user_role_mapping; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_role_mapping (
    role_id character varying(255) NOT NULL,
    user_id character varying(36) NOT NULL
);


--
-- Name: user_session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_session (
    id character varying(36) NOT NULL,
    auth_method character varying(255),
    ip_address character varying(255),
    last_session_refresh integer,
    login_username character varying(255),
    realm_id character varying(255),
    remember_me boolean DEFAULT false NOT NULL,
    started integer,
    user_id character varying(255),
    user_session_state integer,
    broker_session_id character varying(255),
    broker_user_id character varying(255)
);


--
-- Name: user_session_note; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_session_note (
    user_session character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    value character varying(2048)
);


--
-- Name: username_login_failure; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.username_login_failure (
    realm_id character varying(36) NOT NULL,
    username character varying(255) NOT NULL,
    failed_login_not_before integer,
    last_failure bigint,
    last_ip_failure character varying(255),
    num_failures integer
);


--
-- Name: web_origins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.web_origins (
    client_id character varying(36) NOT NULL,
    value character varying(255) NOT NULL
);


--
-- Data for Name: admin_event_entity; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.admin_event_entity (id, admin_event_time, realm_id, operation_type, auth_realm_id, auth_client_id, auth_user_id, ip_address, resource_path, representation, error, resource_type) FROM stdin;
\.


--
-- Data for Name: associated_policy; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.associated_policy (policy_id, associated_policy_id) FROM stdin;
\.


--
-- Data for Name: authentication_execution; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.authentication_execution (id, alias, authenticator, realm_id, flow_id, requirement, priority, authenticator_flow, auth_flow_id, auth_config) FROM stdin;
2860c03d-1c73-402d-bb8b-c72db907b585	\N	auth-cookie	9a97cd68-2f02-4213-a560-1f7696277d76	c9db7ac5-8e23-425b-a55a-3d0bf460b3ad	2	10	f	\N	\N
6897562b-0645-4ef0-9f9a-1b3d4dd3ac6e	\N	auth-spnego	9a97cd68-2f02-4213-a560-1f7696277d76	c9db7ac5-8e23-425b-a55a-3d0bf460b3ad	3	20	f	\N	\N
985f4c84-28da-4656-bd68-39c4ba973c6d	\N	identity-provider-redirector	9a97cd68-2f02-4213-a560-1f7696277d76	c9db7ac5-8e23-425b-a55a-3d0bf460b3ad	2	25	f	\N	\N
8955dd43-7ab2-41b9-9e46-c771175e33fd	\N	\N	9a97cd68-2f02-4213-a560-1f7696277d76	c9db7ac5-8e23-425b-a55a-3d0bf460b3ad	2	30	t	3ca68707-0ca6-4ed4-94bb-8b0ada7703a2	\N
a3e761a2-3bde-4411-b0a0-c99cbc80f278	\N	auth-username-password-form	9a97cd68-2f02-4213-a560-1f7696277d76	3ca68707-0ca6-4ed4-94bb-8b0ada7703a2	0	10	f	\N	\N
cba78062-68de-4670-92c1-2afc7e54316e	\N	\N	9a97cd68-2f02-4213-a560-1f7696277d76	3ca68707-0ca6-4ed4-94bb-8b0ada7703a2	1	20	t	25bf56f1-c086-4f27-aeaf-c38169881d5a	\N
ca1d7527-292b-4648-8778-4dfd60e6e2e9	\N	conditional-user-configured	9a97cd68-2f02-4213-a560-1f7696277d76	25bf56f1-c086-4f27-aeaf-c38169881d5a	0	10	f	\N	\N
0e32bab3-1d71-4785-8173-37f9ec117bb0	\N	auth-otp-form	9a97cd68-2f02-4213-a560-1f7696277d76	25bf56f1-c086-4f27-aeaf-c38169881d5a	0	20	f	\N	\N
6043094f-34ac-408a-a6a9-261635f3b11e	\N	direct-grant-validate-username	9a97cd68-2f02-4213-a560-1f7696277d76	b947041e-0624-4b0e-be6b-06f201514be2	0	10	f	\N	\N
6231cb75-7b16-436e-919e-93f8c646d386	\N	direct-grant-validate-password	9a97cd68-2f02-4213-a560-1f7696277d76	b947041e-0624-4b0e-be6b-06f201514be2	0	20	f	\N	\N
48ace62a-b811-4a1a-beeb-cb552d1cf5cd	\N	\N	9a97cd68-2f02-4213-a560-1f7696277d76	b947041e-0624-4b0e-be6b-06f201514be2	1	30	t	d881b5db-4ca5-4911-9908-0b3a15a1174a	\N
d214ba25-0bd4-4f78-bc43-708aacf1a1ce	\N	conditional-user-configured	9a97cd68-2f02-4213-a560-1f7696277d76	d881b5db-4ca5-4911-9908-0b3a15a1174a	0	10	f	\N	\N
df4b8f85-05be-482e-b394-a7000f1de6d9	\N	direct-grant-validate-otp	9a97cd68-2f02-4213-a560-1f7696277d76	d881b5db-4ca5-4911-9908-0b3a15a1174a	0	20	f	\N	\N
4d35de56-ec9e-447a-8c1c-b0bd7006e5e4	\N	registration-page-form	9a97cd68-2f02-4213-a560-1f7696277d76	2aa4d441-b508-410b-be13-e26c0ade4f60	0	10	t	89965a4a-3694-4169-8920-6c9e8eb2dd0f	\N
fc335297-3df6-4fae-b6a9-5f1e62015c45	\N	registration-user-creation	9a97cd68-2f02-4213-a560-1f7696277d76	89965a4a-3694-4169-8920-6c9e8eb2dd0f	0	20	f	\N	\N
3ee1f1bd-0989-48b4-991e-7feda5c6a02d	\N	registration-password-action	9a97cd68-2f02-4213-a560-1f7696277d76	89965a4a-3694-4169-8920-6c9e8eb2dd0f	0	50	f	\N	\N
1964afae-2e52-41a8-b683-d4d635327724	\N	registration-recaptcha-action	9a97cd68-2f02-4213-a560-1f7696277d76	89965a4a-3694-4169-8920-6c9e8eb2dd0f	3	60	f	\N	\N
a7ffb6b5-3eb1-42b4-9be3-c7b121939581	\N	registration-terms-and-conditions	9a97cd68-2f02-4213-a560-1f7696277d76	89965a4a-3694-4169-8920-6c9e8eb2dd0f	3	70	f	\N	\N
f1e7c3a6-5295-447a-bada-2865158ddb03	\N	reset-credentials-choose-user	9a97cd68-2f02-4213-a560-1f7696277d76	07f050df-5146-4da5-8bb7-02cc5f27a351	0	10	f	\N	\N
e2584edd-3d30-4eb6-8329-1e179d30e0f7	\N	reset-credential-email	9a97cd68-2f02-4213-a560-1f7696277d76	07f050df-5146-4da5-8bb7-02cc5f27a351	0	20	f	\N	\N
3b64e777-edac-4f27-8a87-7a7eb5f26433	\N	reset-password	9a97cd68-2f02-4213-a560-1f7696277d76	07f050df-5146-4da5-8bb7-02cc5f27a351	0	30	f	\N	\N
95e24d7f-faee-413c-ba2f-59e311f296c9	\N	\N	9a97cd68-2f02-4213-a560-1f7696277d76	07f050df-5146-4da5-8bb7-02cc5f27a351	1	40	t	b294d6d6-6209-4d98-8596-1417c76e0b38	\N
395cc241-2f0b-4c2e-9810-cc7a0ecb92a4	\N	conditional-user-configured	9a97cd68-2f02-4213-a560-1f7696277d76	b294d6d6-6209-4d98-8596-1417c76e0b38	0	10	f	\N	\N
7f724e91-223e-41e9-bdc3-7652f56281a5	\N	reset-otp	9a97cd68-2f02-4213-a560-1f7696277d76	b294d6d6-6209-4d98-8596-1417c76e0b38	0	20	f	\N	\N
7d74b9c2-3ea0-46d7-8acb-7b3033b70a0b	\N	client-secret	9a97cd68-2f02-4213-a560-1f7696277d76	81408586-fc64-4594-bdcc-6d71b69ba207	2	10	f	\N	\N
befdede1-9648-4e95-a2f1-c95aecd6f656	\N	client-jwt	9a97cd68-2f02-4213-a560-1f7696277d76	81408586-fc64-4594-bdcc-6d71b69ba207	2	20	f	\N	\N
dd90a3d4-e888-45f3-86bc-56773c6290d4	\N	client-secret-jwt	9a97cd68-2f02-4213-a560-1f7696277d76	81408586-fc64-4594-bdcc-6d71b69ba207	2	30	f	\N	\N
3f35b46e-15ad-4029-bd8c-9d5c80e1edc4	\N	client-x509	9a97cd68-2f02-4213-a560-1f7696277d76	81408586-fc64-4594-bdcc-6d71b69ba207	2	40	f	\N	\N
a0bb9793-1d2a-4ded-a068-0f8a952e62b1	\N	idp-review-profile	9a97cd68-2f02-4213-a560-1f7696277d76	8b9a5127-b255-44a7-bf23-189eb189d4a3	0	10	f	\N	14110b50-4df6-4f5a-8532-27d1a54aef5f
21991752-2fc7-4f4c-8bf4-c09383651088	\N	\N	9a97cd68-2f02-4213-a560-1f7696277d76	8b9a5127-b255-44a7-bf23-189eb189d4a3	0	20	t	2469d2c8-6e63-4ee6-9111-83ea04a3d2ff	\N
7c18c80c-196b-4aee-be74-14e46a8929de	\N	idp-create-user-if-unique	9a97cd68-2f02-4213-a560-1f7696277d76	2469d2c8-6e63-4ee6-9111-83ea04a3d2ff	2	10	f	\N	34ef232e-ee77-4f00-82ff-3a71aff47f1a
978c8193-420b-4e99-a5da-6c8eb137a963	\N	\N	9a97cd68-2f02-4213-a560-1f7696277d76	2469d2c8-6e63-4ee6-9111-83ea04a3d2ff	2	20	t	c051316a-879b-45a0-a263-6988889f28d1	\N
ec8e59ed-361e-4326-8a17-53e899884e88	\N	idp-confirm-link	9a97cd68-2f02-4213-a560-1f7696277d76	c051316a-879b-45a0-a263-6988889f28d1	0	10	f	\N	\N
98bda2e2-ce21-4ea2-b2c7-2a8699731d4d	\N	\N	9a97cd68-2f02-4213-a560-1f7696277d76	c051316a-879b-45a0-a263-6988889f28d1	0	20	t	79b8f464-7840-4048-b71b-bd324b01cf0c	\N
b896ee83-c3a2-49e5-aca4-9b919fe4e00d	\N	idp-email-verification	9a97cd68-2f02-4213-a560-1f7696277d76	79b8f464-7840-4048-b71b-bd324b01cf0c	2	10	f	\N	\N
54aaf4c0-6886-46c1-9255-db275a31f2a1	\N	\N	9a97cd68-2f02-4213-a560-1f7696277d76	79b8f464-7840-4048-b71b-bd324b01cf0c	2	20	t	7432d8ff-0b00-4644-825c-01b95560bb8a	\N
7f6d46b5-b165-44d2-83a1-8883df34eb1b	\N	idp-username-password-form	9a97cd68-2f02-4213-a560-1f7696277d76	7432d8ff-0b00-4644-825c-01b95560bb8a	0	10	f	\N	\N
d6c7e6df-53cf-49c1-91b4-ba31904b0748	\N	\N	9a97cd68-2f02-4213-a560-1f7696277d76	7432d8ff-0b00-4644-825c-01b95560bb8a	1	20	t	d3490235-f2db-4408-a8ca-4bf6798017ee	\N
810ed6e6-5970-4a26-a049-12a6ccbea781	\N	conditional-user-configured	9a97cd68-2f02-4213-a560-1f7696277d76	d3490235-f2db-4408-a8ca-4bf6798017ee	0	10	f	\N	\N
658506e5-991e-4f6a-99ac-b5cd421b3a6e	\N	auth-otp-form	9a97cd68-2f02-4213-a560-1f7696277d76	d3490235-f2db-4408-a8ca-4bf6798017ee	0	20	f	\N	\N
6b683b32-4518-46d2-860c-f5745ae973e5	\N	http-basic-authenticator	9a97cd68-2f02-4213-a560-1f7696277d76	6aed36f0-21ac-4b29-b648-0f37cf927bf7	0	10	f	\N	\N
7df43bee-53f9-4d49-aaac-7eca39afc90d	\N	docker-http-basic-authenticator	9a97cd68-2f02-4213-a560-1f7696277d76	f024cf75-885b-455b-98fb-1f2b762696d1	0	10	f	\N	\N
8c255afe-d403-4db0-84fe-25b1e2035547	\N	auth-cookie	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	051eb8c7-cefd-4c04-94b5-c22cb47e6cb3	2	10	f	\N	\N
ec31fa4e-b341-49d2-810b-7a180108d4cd	\N	auth-spnego	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	051eb8c7-cefd-4c04-94b5-c22cb47e6cb3	3	20	f	\N	\N
4af76489-24c0-431d-9e29-03523609bfa2	\N	identity-provider-redirector	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	051eb8c7-cefd-4c04-94b5-c22cb47e6cb3	2	25	f	\N	\N
3f5a7540-4a15-4fa3-a84d-425aa84f9a30	\N	\N	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	051eb8c7-cefd-4c04-94b5-c22cb47e6cb3	2	30	t	656d37cb-803d-47fc-86b8-8691f7ce223d	\N
4dde77f5-fb3e-44ae-87a4-e752108695a9	\N	auth-username-password-form	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	656d37cb-803d-47fc-86b8-8691f7ce223d	0	10	f	\N	\N
82fcc0dc-8885-4239-97b0-4a3b38e34916	\N	\N	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	656d37cb-803d-47fc-86b8-8691f7ce223d	1	20	t	ab18da27-aa1c-4ea4-b3b5-672d7e389129	\N
43ba840b-6cf9-4653-a881-873333a8b221	\N	conditional-user-configured	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	ab18da27-aa1c-4ea4-b3b5-672d7e389129	0	10	f	\N	\N
c27a0f6e-a714-4ccd-8ef3-78dec0a5d868	\N	auth-otp-form	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	ab18da27-aa1c-4ea4-b3b5-672d7e389129	0	20	f	\N	\N
db241cd7-838d-4fc1-b3c1-cfa91e321a97	\N	direct-grant-validate-username	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	e6ee66b7-68aa-491a-8b0d-5380806df792	0	10	f	\N	\N
6ae37fb4-d1ef-48fa-aa5a-dd38b1fe9b35	\N	direct-grant-validate-password	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	e6ee66b7-68aa-491a-8b0d-5380806df792	0	20	f	\N	\N
004ff529-7b44-4855-a7dd-06610c69fad8	\N	\N	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	e6ee66b7-68aa-491a-8b0d-5380806df792	1	30	t	3a67b41a-0279-4036-a2f8-712e38a575a5	\N
26a29182-a820-4788-b4c5-54b05b940d2e	\N	conditional-user-configured	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	3a67b41a-0279-4036-a2f8-712e38a575a5	0	10	f	\N	\N
fe604cd0-c0bc-4495-bfe6-620e08c1e1f4	\N	direct-grant-validate-otp	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	3a67b41a-0279-4036-a2f8-712e38a575a5	0	20	f	\N	\N
c97beba6-3724-430b-8a0a-47a953882075	\N	registration-page-form	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	e8351c96-a835-4fe7-b0d7-414d73b242f1	0	10	t	36bb04f7-1c10-442c-a1ea-fbc7b4c227b8	\N
fd264971-2f80-4eff-bc8a-6faf3b5e948a	\N	registration-user-creation	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	36bb04f7-1c10-442c-a1ea-fbc7b4c227b8	0	20	f	\N	\N
754d1263-34fe-4796-b0c4-18bab43edf6c	\N	registration-password-action	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	36bb04f7-1c10-442c-a1ea-fbc7b4c227b8	0	50	f	\N	\N
eef06944-247e-400f-aa47-22543115e4c4	\N	registration-recaptcha-action	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	36bb04f7-1c10-442c-a1ea-fbc7b4c227b8	3	60	f	\N	\N
c806d4f7-e073-4bf5-8931-951e582cdb3d	\N	registration-terms-and-conditions	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	36bb04f7-1c10-442c-a1ea-fbc7b4c227b8	3	70	f	\N	\N
45aae2ee-a286-4630-9b51-f2386e43c868	\N	reset-credentials-choose-user	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	b470a57e-acb7-41a7-80e0-5c53db54ae17	0	10	f	\N	\N
b906b729-3ac8-45d4-a649-70e71529ace0	\N	reset-credential-email	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	b470a57e-acb7-41a7-80e0-5c53db54ae17	0	20	f	\N	\N
0af7f3d5-d943-4e08-8b34-a85e30ace558	\N	reset-password	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	b470a57e-acb7-41a7-80e0-5c53db54ae17	0	30	f	\N	\N
fca97db1-bf5a-4c6e-86af-33712ce46c1a	\N	\N	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	b470a57e-acb7-41a7-80e0-5c53db54ae17	1	40	t	5a6a2ba6-1a7a-467c-8b3a-2528292771e2	\N
d2feb76f-b8f3-4c8e-a81e-dbbbdbd9dab0	\N	conditional-user-configured	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	5a6a2ba6-1a7a-467c-8b3a-2528292771e2	0	10	f	\N	\N
09d2a6aa-31bc-4fca-84b3-8d2318d21ce3	\N	reset-otp	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	5a6a2ba6-1a7a-467c-8b3a-2528292771e2	0	20	f	\N	\N
1b92f156-dbf3-4596-82ca-a3f261685fa2	\N	client-secret	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	935cebea-7b40-4e60-9270-5fa0f99d15db	2	10	f	\N	\N
ddf80597-8026-4fdd-9f28-0e3d6f644748	\N	client-jwt	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	935cebea-7b40-4e60-9270-5fa0f99d15db	2	20	f	\N	\N
530f7f3b-24d2-4dc9-8438-05a086ff454a	\N	client-secret-jwt	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	935cebea-7b40-4e60-9270-5fa0f99d15db	2	30	f	\N	\N
f64acf3f-4ef8-4f26-bcbf-f5e4d8e88849	\N	client-x509	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	935cebea-7b40-4e60-9270-5fa0f99d15db	2	40	f	\N	\N
aaa021ac-6a70-4ba3-b0d4-46dd1a54cc75	\N	idp-review-profile	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	bc0672c0-be72-4af8-adfe-faebe5c49b98	0	10	f	\N	48727847-28a6-4a19-89c7-63c233495f45
b347c553-ced2-4b92-bffb-e86b27434f50	\N	\N	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	bc0672c0-be72-4af8-adfe-faebe5c49b98	0	20	t	706f688d-4103-47d6-bd95-c901f41c27eb	\N
1a601f14-85e4-4626-9dc6-d26ffe5429e5	\N	idp-create-user-if-unique	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	706f688d-4103-47d6-bd95-c901f41c27eb	2	10	f	\N	52645ac7-1928-4845-a33f-82c9a1d714a6
0fc34863-94f8-478e-a13f-8a25d5e6c453	\N	\N	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	706f688d-4103-47d6-bd95-c901f41c27eb	2	20	t	da851145-71e3-46c4-aadd-0ad4876ef8ad	\N
4e1e6a53-1db6-490e-9078-0804b6613e90	\N	idp-confirm-link	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	da851145-71e3-46c4-aadd-0ad4876ef8ad	0	10	f	\N	\N
ca1b557f-3c64-4d83-a3e9-ffbee6b4660b	\N	\N	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	da851145-71e3-46c4-aadd-0ad4876ef8ad	0	20	t	e153244f-8f6b-417a-afb1-425ac13e7929	\N
772f51dc-8eb5-479e-b49d-c85537a20097	\N	idp-email-verification	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	e153244f-8f6b-417a-afb1-425ac13e7929	2	10	f	\N	\N
05a5657a-eb0e-4a8e-a301-20519c65c64c	\N	\N	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	e153244f-8f6b-417a-afb1-425ac13e7929	2	20	t	cea2eac3-45ff-47f7-8fce-855c7911d29f	\N
8c680034-3763-4afb-a745-f80bd13cc331	\N	idp-username-password-form	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	cea2eac3-45ff-47f7-8fce-855c7911d29f	0	10	f	\N	\N
929120b5-eae2-4e88-a38e-5625b03e6c19	\N	\N	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	cea2eac3-45ff-47f7-8fce-855c7911d29f	1	20	t	fe645394-b28a-4abe-bef4-8deef8dd2d1f	\N
f1a48f51-b1ff-4251-bfa4-87ff0523697c	\N	conditional-user-configured	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	fe645394-b28a-4abe-bef4-8deef8dd2d1f	0	10	f	\N	\N
e7b1fcdf-9dc9-4d9a-bab0-7948338dbbbf	\N	auth-otp-form	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	fe645394-b28a-4abe-bef4-8deef8dd2d1f	0	20	f	\N	\N
5261f8b6-c8ca-4dec-bb5b-bb636ed9db3d	\N	http-basic-authenticator	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	b9e49412-5089-49cb-9268-9ec10417eaa8	0	10	f	\N	\N
c29d4c45-cf0a-4bcb-9bf7-3cb52b654d9e	\N	docker-http-basic-authenticator	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	bb36f69e-2ab1-4da5-9fec-d7a3e8cdec80	0	10	f	\N	\N
\.


--
-- Data for Name: authentication_flow; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.authentication_flow (id, alias, description, realm_id, provider_id, top_level, built_in) FROM stdin;
c9db7ac5-8e23-425b-a55a-3d0bf460b3ad	browser	browser based authentication	9a97cd68-2f02-4213-a560-1f7696277d76	basic-flow	t	t
3ca68707-0ca6-4ed4-94bb-8b0ada7703a2	forms	Username, password, otp and other auth forms.	9a97cd68-2f02-4213-a560-1f7696277d76	basic-flow	f	t
25bf56f1-c086-4f27-aeaf-c38169881d5a	Browser - Conditional OTP	Flow to determine if the OTP is required for the authentication	9a97cd68-2f02-4213-a560-1f7696277d76	basic-flow	f	t
b947041e-0624-4b0e-be6b-06f201514be2	direct grant	OpenID Connect Resource Owner Grant	9a97cd68-2f02-4213-a560-1f7696277d76	basic-flow	t	t
d881b5db-4ca5-4911-9908-0b3a15a1174a	Direct Grant - Conditional OTP	Flow to determine if the OTP is required for the authentication	9a97cd68-2f02-4213-a560-1f7696277d76	basic-flow	f	t
2aa4d441-b508-410b-be13-e26c0ade4f60	registration	registration flow	9a97cd68-2f02-4213-a560-1f7696277d76	basic-flow	t	t
89965a4a-3694-4169-8920-6c9e8eb2dd0f	registration form	registration form	9a97cd68-2f02-4213-a560-1f7696277d76	form-flow	f	t
07f050df-5146-4da5-8bb7-02cc5f27a351	reset credentials	Reset credentials for a user if they forgot their password or something	9a97cd68-2f02-4213-a560-1f7696277d76	basic-flow	t	t
b294d6d6-6209-4d98-8596-1417c76e0b38	Reset - Conditional OTP	Flow to determine if the OTP should be reset or not. Set to REQUIRED to force.	9a97cd68-2f02-4213-a560-1f7696277d76	basic-flow	f	t
81408586-fc64-4594-bdcc-6d71b69ba207	clients	Base authentication for clients	9a97cd68-2f02-4213-a560-1f7696277d76	client-flow	t	t
8b9a5127-b255-44a7-bf23-189eb189d4a3	first broker login	Actions taken after first broker login with identity provider account, which is not yet linked to any Keycloak account	9a97cd68-2f02-4213-a560-1f7696277d76	basic-flow	t	t
2469d2c8-6e63-4ee6-9111-83ea04a3d2ff	User creation or linking	Flow for the existing/non-existing user alternatives	9a97cd68-2f02-4213-a560-1f7696277d76	basic-flow	f	t
c051316a-879b-45a0-a263-6988889f28d1	Handle Existing Account	Handle what to do if there is existing account with same email/username like authenticated identity provider	9a97cd68-2f02-4213-a560-1f7696277d76	basic-flow	f	t
79b8f464-7840-4048-b71b-bd324b01cf0c	Account verification options	Method with which to verity the existing account	9a97cd68-2f02-4213-a560-1f7696277d76	basic-flow	f	t
7432d8ff-0b00-4644-825c-01b95560bb8a	Verify Existing Account by Re-authentication	Reauthentication of existing account	9a97cd68-2f02-4213-a560-1f7696277d76	basic-flow	f	t
d3490235-f2db-4408-a8ca-4bf6798017ee	First broker login - Conditional OTP	Flow to determine if the OTP is required for the authentication	9a97cd68-2f02-4213-a560-1f7696277d76	basic-flow	f	t
6aed36f0-21ac-4b29-b648-0f37cf927bf7	saml ecp	SAML ECP Profile Authentication Flow	9a97cd68-2f02-4213-a560-1f7696277d76	basic-flow	t	t
f024cf75-885b-455b-98fb-1f2b762696d1	docker auth	Used by Docker clients to authenticate against the IDP	9a97cd68-2f02-4213-a560-1f7696277d76	basic-flow	t	t
051eb8c7-cefd-4c04-94b5-c22cb47e6cb3	browser	browser based authentication	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	basic-flow	t	t
656d37cb-803d-47fc-86b8-8691f7ce223d	forms	Username, password, otp and other auth forms.	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	basic-flow	f	t
ab18da27-aa1c-4ea4-b3b5-672d7e389129	Browser - Conditional OTP	Flow to determine if the OTP is required for the authentication	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	basic-flow	f	t
e6ee66b7-68aa-491a-8b0d-5380806df792	direct grant	OpenID Connect Resource Owner Grant	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	basic-flow	t	t
3a67b41a-0279-4036-a2f8-712e38a575a5	Direct Grant - Conditional OTP	Flow to determine if the OTP is required for the authentication	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	basic-flow	f	t
e8351c96-a835-4fe7-b0d7-414d73b242f1	registration	registration flow	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	basic-flow	t	t
36bb04f7-1c10-442c-a1ea-fbc7b4c227b8	registration form	registration form	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	form-flow	f	t
b470a57e-acb7-41a7-80e0-5c53db54ae17	reset credentials	Reset credentials for a user if they forgot their password or something	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	basic-flow	t	t
5a6a2ba6-1a7a-467c-8b3a-2528292771e2	Reset - Conditional OTP	Flow to determine if the OTP should be reset or not. Set to REQUIRED to force.	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	basic-flow	f	t
935cebea-7b40-4e60-9270-5fa0f99d15db	clients	Base authentication for clients	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	client-flow	t	t
bc0672c0-be72-4af8-adfe-faebe5c49b98	first broker login	Actions taken after first broker login with identity provider account, which is not yet linked to any Keycloak account	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	basic-flow	t	t
706f688d-4103-47d6-bd95-c901f41c27eb	User creation or linking	Flow for the existing/non-existing user alternatives	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	basic-flow	f	t
da851145-71e3-46c4-aadd-0ad4876ef8ad	Handle Existing Account	Handle what to do if there is existing account with same email/username like authenticated identity provider	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	basic-flow	f	t
e153244f-8f6b-417a-afb1-425ac13e7929	Account verification options	Method with which to verity the existing account	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	basic-flow	f	t
cea2eac3-45ff-47f7-8fce-855c7911d29f	Verify Existing Account by Re-authentication	Reauthentication of existing account	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	basic-flow	f	t
fe645394-b28a-4abe-bef4-8deef8dd2d1f	First broker login - Conditional OTP	Flow to determine if the OTP is required for the authentication	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	basic-flow	f	t
b9e49412-5089-49cb-9268-9ec10417eaa8	saml ecp	SAML ECP Profile Authentication Flow	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	basic-flow	t	t
bb36f69e-2ab1-4da5-9fec-d7a3e8cdec80	docker auth	Used by Docker clients to authenticate against the IDP	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	basic-flow	t	t
\.


--
-- Data for Name: authenticator_config; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.authenticator_config (id, alias, realm_id) FROM stdin;
14110b50-4df6-4f5a-8532-27d1a54aef5f	review profile config	9a97cd68-2f02-4213-a560-1f7696277d76
34ef232e-ee77-4f00-82ff-3a71aff47f1a	create unique user config	9a97cd68-2f02-4213-a560-1f7696277d76
48727847-28a6-4a19-89c7-63c233495f45	review profile config	1f8b22bb-145f-4eaa-83e4-79fc73e6564f
52645ac7-1928-4845-a33f-82c9a1d714a6	create unique user config	1f8b22bb-145f-4eaa-83e4-79fc73e6564f
\.


--
-- Data for Name: authenticator_config_entry; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.authenticator_config_entry (authenticator_id, value, name) FROM stdin;
14110b50-4df6-4f5a-8532-27d1a54aef5f	missing	update.profile.on.first.login
34ef232e-ee77-4f00-82ff-3a71aff47f1a	false	require.password.update.after.registration
48727847-28a6-4a19-89c7-63c233495f45	missing	update.profile.on.first.login
52645ac7-1928-4845-a33f-82c9a1d714a6	false	require.password.update.after.registration
\.


--
-- Data for Name: broker_link; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.broker_link (identity_provider, storage_provider_id, realm_id, broker_user_id, broker_username, token, user_id) FROM stdin;
\.


--
-- Data for Name: client; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.client (id, enabled, full_scope_allowed, client_id, not_before, public_client, secret, base_url, bearer_only, management_url, surrogate_auth_required, realm_id, protocol, node_rereg_timeout, frontchannel_logout, consent_required, name, service_accounts_enabled, client_authenticator_type, root_url, description, registration_token, standard_flow_enabled, implicit_flow_enabled, direct_access_grants_enabled, always_display_in_console) FROM stdin;
2c5fd935-c489-41f4-be87-eda2243aebfb	t	f	master-realm	0	f	\N	\N	t	\N	f	9a97cd68-2f02-4213-a560-1f7696277d76	\N	0	f	f	master Realm	f	client-secret	\N	\N	\N	t	f	f	f
98f32754-80e4-4835-9a83-e9a8a40cebad	t	f	account	0	t	\N	/realms/master/account/	f	\N	f	9a97cd68-2f02-4213-a560-1f7696277d76	openid-connect	0	f	f	${client_account}	f	client-secret	${authBaseUrl}	\N	\N	t	f	f	f
ca7ffbf1-c30a-4a29-90f3-86c70d437ed1	t	f	account-console	0	t	\N	/realms/master/account/	f	\N	f	9a97cd68-2f02-4213-a560-1f7696277d76	openid-connect	0	f	f	${client_account-console}	f	client-secret	${authBaseUrl}	\N	\N	t	f	f	f
c7c13253-98e4-4b5e-9b7f-634298c5e8a5	t	f	broker	0	f	\N	\N	t	\N	f	9a97cd68-2f02-4213-a560-1f7696277d76	openid-connect	0	f	f	${client_broker}	f	client-secret	\N	\N	\N	t	f	f	f
a68e7ff4-fbc6-4374-a503-802a347de6ac	t	f	security-admin-console	0	t	\N	/admin/master/console/	f	\N	f	9a97cd68-2f02-4213-a560-1f7696277d76	openid-connect	0	f	f	${client_security-admin-console}	f	client-secret	${authAdminUrl}	\N	\N	t	f	f	f
4a8e1c9b-61d0-42b6-845d-e0858ed07ab6	t	f	admin-cli	0	t	\N	\N	f	\N	f	9a97cd68-2f02-4213-a560-1f7696277d76	openid-connect	0	f	f	${client_admin-cli}	f	client-secret	\N	\N	\N	f	f	t	f
bb1f96ce-d16a-43eb-885b-8a43e65bda94	t	f	inventory-realm	0	f	\N	\N	t	\N	f	9a97cd68-2f02-4213-a560-1f7696277d76	\N	0	f	f	inventory Realm	f	client-secret	\N	\N	\N	t	f	f	f
812e1083-38a9-403b-a664-ca02cced092e	t	f	realm-management	0	f	\N	\N	t	\N	f	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	openid-connect	0	f	f	${client_realm-management}	f	client-secret	\N	\N	\N	t	f	f	f
08070c05-e13c-4eb2-8afd-b4d4b5b58691	t	f	account	0	t	\N	/realms/inventory/account/	f	\N	f	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	openid-connect	0	f	f	${client_account}	f	client-secret	${authBaseUrl}	\N	\N	t	f	f	f
f5bec733-cf3b-4eb3-a759-9dcd218c0b9e	t	f	account-console	0	t	\N	/realms/inventory/account/	f	\N	f	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	openid-connect	0	f	f	${client_account-console}	f	client-secret	${authBaseUrl}	\N	\N	t	f	f	f
5289f5f1-e9d3-4593-8ab8-8bb40aed188e	t	f	broker	0	f	\N	\N	t	\N	f	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	openid-connect	0	f	f	${client_broker}	f	client-secret	\N	\N	\N	t	f	f	f
24136744-c2d9-4a78-b09f-a93579a78455	t	f	security-admin-console	0	t	\N	/admin/inventory/console/	f	\N	f	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	openid-connect	0	f	f	${client_security-admin-console}	f	client-secret	${authAdminUrl}	\N	\N	t	f	f	f
37f7a8aa-9e66-44c4-8655-d53224c917c7	t	f	admin-cli	0	t	\N	\N	f	\N	f	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	openid-connect	0	f	f	${client_admin-cli}	f	client-secret	\N	\N	\N	f	f	t	f
7e5c8c81-ae15-4638-8a35-cf3dc8e8f77c	t	t	inventory-app	0	t	\N	/	f	\N	f	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	openid-connect	-1	f	f	Inventory App	f	client-secret	http://localhost	Sistema de Inventario - Frontend SPA	\N	t	f	t	f
\.


--
-- Data for Name: client_attributes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.client_attributes (client_id, name, value) FROM stdin;
98f32754-80e4-4835-9a83-e9a8a40cebad	post.logout.redirect.uris	+
ca7ffbf1-c30a-4a29-90f3-86c70d437ed1	post.logout.redirect.uris	+
ca7ffbf1-c30a-4a29-90f3-86c70d437ed1	pkce.code.challenge.method	S256
a68e7ff4-fbc6-4374-a503-802a347de6ac	post.logout.redirect.uris	+
a68e7ff4-fbc6-4374-a503-802a347de6ac	pkce.code.challenge.method	S256
08070c05-e13c-4eb2-8afd-b4d4b5b58691	post.logout.redirect.uris	+
f5bec733-cf3b-4eb3-a759-9dcd218c0b9e	post.logout.redirect.uris	+
f5bec733-cf3b-4eb3-a759-9dcd218c0b9e	pkce.code.challenge.method	S256
24136744-c2d9-4a78-b09f-a93579a78455	post.logout.redirect.uris	+
24136744-c2d9-4a78-b09f-a93579a78455	pkce.code.challenge.method	S256
7e5c8c81-ae15-4638-8a35-cf3dc8e8f77c	post.logout.redirect.uris	+
\.


--
-- Data for Name: client_auth_flow_bindings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.client_auth_flow_bindings (client_id, flow_id, binding_name) FROM stdin;
\.


--
-- Data for Name: client_initial_access; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.client_initial_access (id, realm_id, "timestamp", expiration, count, remaining_count) FROM stdin;
\.


--
-- Data for Name: client_node_registrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.client_node_registrations (client_id, value, name) FROM stdin;
\.


--
-- Data for Name: client_scope; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.client_scope (id, name, realm_id, description, protocol) FROM stdin;
063f8be9-26c1-4e3b-94dc-2bb1816d760c	offline_access	9a97cd68-2f02-4213-a560-1f7696277d76	OpenID Connect built-in scope: offline_access	openid-connect
26ff69ff-a806-4230-8bac-7e6d098b2904	role_list	9a97cd68-2f02-4213-a560-1f7696277d76	SAML role list	saml
11a2da8a-20e6-4b1e-bcaf-8462982dd828	profile	9a97cd68-2f02-4213-a560-1f7696277d76	OpenID Connect built-in scope: profile	openid-connect
da2b9ae6-97e4-4242-9cdf-e88fdc2575e1	email	9a97cd68-2f02-4213-a560-1f7696277d76	OpenID Connect built-in scope: email	openid-connect
ce197625-f7b0-41f2-b8e1-09ab8ca56489	address	9a97cd68-2f02-4213-a560-1f7696277d76	OpenID Connect built-in scope: address	openid-connect
764d3a1f-f825-45e2-bddc-606de70b90b0	phone	9a97cd68-2f02-4213-a560-1f7696277d76	OpenID Connect built-in scope: phone	openid-connect
dec2dada-bcd5-453a-a45c-43c7e6964497	roles	9a97cd68-2f02-4213-a560-1f7696277d76	OpenID Connect scope for add user roles to the access token	openid-connect
caaf5764-484b-44f0-b64f-7062584ceec6	web-origins	9a97cd68-2f02-4213-a560-1f7696277d76	OpenID Connect scope for add allowed web origins to the access token	openid-connect
ca339a4d-498e-4b02-96cc-d5c0170808da	microprofile-jwt	9a97cd68-2f02-4213-a560-1f7696277d76	Microprofile - JWT built-in scope	openid-connect
78b18b42-4294-486f-860e-65bc75620250	acr	9a97cd68-2f02-4213-a560-1f7696277d76	OpenID Connect scope for add acr (authentication context class reference) to the token	openid-connect
cb7af951-ab7f-43e9-b85e-61d295a8c2c8	basic	9a97cd68-2f02-4213-a560-1f7696277d76	OpenID Connect scope for add all basic claims to the token	openid-connect
474ef808-8e0b-4255-8a69-d5bed150cb21	offline_access	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	OpenID Connect built-in scope: offline_access	openid-connect
d6ac81dc-9f4d-4792-b3d6-5a58d61449ec	role_list	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	SAML role list	saml
0ffbd751-1a8f-4206-bde0-09d0b944ef3a	profile	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	OpenID Connect built-in scope: profile	openid-connect
bb7dbd7f-2b09-4922-938e-5d99fab04021	email	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	OpenID Connect built-in scope: email	openid-connect
754bca75-7c68-44c1-9f53-4fd6cb5e05f1	address	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	OpenID Connect built-in scope: address	openid-connect
50445a82-b24e-4c9a-8336-5cea7d2ae817	phone	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	OpenID Connect built-in scope: phone	openid-connect
d927e25c-aab0-4793-a247-bb2ed7fcfdfb	roles	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	OpenID Connect scope for add user roles to the access token	openid-connect
ab825560-c7fa-49a7-8c72-626787c363bc	web-origins	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	OpenID Connect scope for add allowed web origins to the access token	openid-connect
e41a2773-48b0-4ae0-a929-87bfca1274c8	microprofile-jwt	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	Microprofile - JWT built-in scope	openid-connect
c79051b5-e811-40c2-beb8-e22a52ac9894	acr	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	OpenID Connect scope for add acr (authentication context class reference) to the token	openid-connect
5100f0ae-22ec-4175-aa7b-c7953eb64db4	basic	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	OpenID Connect scope for add all basic claims to the token	openid-connect
\.


--
-- Data for Name: client_scope_attributes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.client_scope_attributes (scope_id, value, name) FROM stdin;
063f8be9-26c1-4e3b-94dc-2bb1816d760c	true	display.on.consent.screen
063f8be9-26c1-4e3b-94dc-2bb1816d760c	${offlineAccessScopeConsentText}	consent.screen.text
26ff69ff-a806-4230-8bac-7e6d098b2904	true	display.on.consent.screen
26ff69ff-a806-4230-8bac-7e6d098b2904	${samlRoleListScopeConsentText}	consent.screen.text
11a2da8a-20e6-4b1e-bcaf-8462982dd828	true	display.on.consent.screen
11a2da8a-20e6-4b1e-bcaf-8462982dd828	${profileScopeConsentText}	consent.screen.text
11a2da8a-20e6-4b1e-bcaf-8462982dd828	true	include.in.token.scope
da2b9ae6-97e4-4242-9cdf-e88fdc2575e1	true	display.on.consent.screen
da2b9ae6-97e4-4242-9cdf-e88fdc2575e1	${emailScopeConsentText}	consent.screen.text
da2b9ae6-97e4-4242-9cdf-e88fdc2575e1	true	include.in.token.scope
ce197625-f7b0-41f2-b8e1-09ab8ca56489	true	display.on.consent.screen
ce197625-f7b0-41f2-b8e1-09ab8ca56489	${addressScopeConsentText}	consent.screen.text
ce197625-f7b0-41f2-b8e1-09ab8ca56489	true	include.in.token.scope
764d3a1f-f825-45e2-bddc-606de70b90b0	true	display.on.consent.screen
764d3a1f-f825-45e2-bddc-606de70b90b0	${phoneScopeConsentText}	consent.screen.text
764d3a1f-f825-45e2-bddc-606de70b90b0	true	include.in.token.scope
dec2dada-bcd5-453a-a45c-43c7e6964497	true	display.on.consent.screen
dec2dada-bcd5-453a-a45c-43c7e6964497	${rolesScopeConsentText}	consent.screen.text
dec2dada-bcd5-453a-a45c-43c7e6964497	false	include.in.token.scope
caaf5764-484b-44f0-b64f-7062584ceec6	false	display.on.consent.screen
caaf5764-484b-44f0-b64f-7062584ceec6		consent.screen.text
caaf5764-484b-44f0-b64f-7062584ceec6	false	include.in.token.scope
ca339a4d-498e-4b02-96cc-d5c0170808da	false	display.on.consent.screen
ca339a4d-498e-4b02-96cc-d5c0170808da	true	include.in.token.scope
78b18b42-4294-486f-860e-65bc75620250	false	display.on.consent.screen
78b18b42-4294-486f-860e-65bc75620250	false	include.in.token.scope
cb7af951-ab7f-43e9-b85e-61d295a8c2c8	false	display.on.consent.screen
cb7af951-ab7f-43e9-b85e-61d295a8c2c8	false	include.in.token.scope
474ef808-8e0b-4255-8a69-d5bed150cb21	true	display.on.consent.screen
474ef808-8e0b-4255-8a69-d5bed150cb21	${offlineAccessScopeConsentText}	consent.screen.text
d6ac81dc-9f4d-4792-b3d6-5a58d61449ec	true	display.on.consent.screen
d6ac81dc-9f4d-4792-b3d6-5a58d61449ec	${samlRoleListScopeConsentText}	consent.screen.text
0ffbd751-1a8f-4206-bde0-09d0b944ef3a	true	display.on.consent.screen
0ffbd751-1a8f-4206-bde0-09d0b944ef3a	${profileScopeConsentText}	consent.screen.text
0ffbd751-1a8f-4206-bde0-09d0b944ef3a	true	include.in.token.scope
bb7dbd7f-2b09-4922-938e-5d99fab04021	true	display.on.consent.screen
bb7dbd7f-2b09-4922-938e-5d99fab04021	${emailScopeConsentText}	consent.screen.text
bb7dbd7f-2b09-4922-938e-5d99fab04021	true	include.in.token.scope
754bca75-7c68-44c1-9f53-4fd6cb5e05f1	true	display.on.consent.screen
754bca75-7c68-44c1-9f53-4fd6cb5e05f1	${addressScopeConsentText}	consent.screen.text
754bca75-7c68-44c1-9f53-4fd6cb5e05f1	true	include.in.token.scope
50445a82-b24e-4c9a-8336-5cea7d2ae817	true	display.on.consent.screen
50445a82-b24e-4c9a-8336-5cea7d2ae817	${phoneScopeConsentText}	consent.screen.text
50445a82-b24e-4c9a-8336-5cea7d2ae817	true	include.in.token.scope
d927e25c-aab0-4793-a247-bb2ed7fcfdfb	true	display.on.consent.screen
d927e25c-aab0-4793-a247-bb2ed7fcfdfb	${rolesScopeConsentText}	consent.screen.text
d927e25c-aab0-4793-a247-bb2ed7fcfdfb	false	include.in.token.scope
ab825560-c7fa-49a7-8c72-626787c363bc	false	display.on.consent.screen
ab825560-c7fa-49a7-8c72-626787c363bc		consent.screen.text
ab825560-c7fa-49a7-8c72-626787c363bc	false	include.in.token.scope
e41a2773-48b0-4ae0-a929-87bfca1274c8	false	display.on.consent.screen
e41a2773-48b0-4ae0-a929-87bfca1274c8	true	include.in.token.scope
c79051b5-e811-40c2-beb8-e22a52ac9894	false	display.on.consent.screen
c79051b5-e811-40c2-beb8-e22a52ac9894	false	include.in.token.scope
5100f0ae-22ec-4175-aa7b-c7953eb64db4	false	display.on.consent.screen
5100f0ae-22ec-4175-aa7b-c7953eb64db4	false	include.in.token.scope
\.


--
-- Data for Name: client_scope_client; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.client_scope_client (client_id, scope_id, default_scope) FROM stdin;
98f32754-80e4-4835-9a83-e9a8a40cebad	caaf5764-484b-44f0-b64f-7062584ceec6	t
98f32754-80e4-4835-9a83-e9a8a40cebad	da2b9ae6-97e4-4242-9cdf-e88fdc2575e1	t
98f32754-80e4-4835-9a83-e9a8a40cebad	78b18b42-4294-486f-860e-65bc75620250	t
98f32754-80e4-4835-9a83-e9a8a40cebad	11a2da8a-20e6-4b1e-bcaf-8462982dd828	t
98f32754-80e4-4835-9a83-e9a8a40cebad	dec2dada-bcd5-453a-a45c-43c7e6964497	t
98f32754-80e4-4835-9a83-e9a8a40cebad	cb7af951-ab7f-43e9-b85e-61d295a8c2c8	t
98f32754-80e4-4835-9a83-e9a8a40cebad	764d3a1f-f825-45e2-bddc-606de70b90b0	f
98f32754-80e4-4835-9a83-e9a8a40cebad	063f8be9-26c1-4e3b-94dc-2bb1816d760c	f
98f32754-80e4-4835-9a83-e9a8a40cebad	ce197625-f7b0-41f2-b8e1-09ab8ca56489	f
98f32754-80e4-4835-9a83-e9a8a40cebad	ca339a4d-498e-4b02-96cc-d5c0170808da	f
ca7ffbf1-c30a-4a29-90f3-86c70d437ed1	caaf5764-484b-44f0-b64f-7062584ceec6	t
ca7ffbf1-c30a-4a29-90f3-86c70d437ed1	da2b9ae6-97e4-4242-9cdf-e88fdc2575e1	t
ca7ffbf1-c30a-4a29-90f3-86c70d437ed1	78b18b42-4294-486f-860e-65bc75620250	t
ca7ffbf1-c30a-4a29-90f3-86c70d437ed1	11a2da8a-20e6-4b1e-bcaf-8462982dd828	t
ca7ffbf1-c30a-4a29-90f3-86c70d437ed1	dec2dada-bcd5-453a-a45c-43c7e6964497	t
ca7ffbf1-c30a-4a29-90f3-86c70d437ed1	cb7af951-ab7f-43e9-b85e-61d295a8c2c8	t
ca7ffbf1-c30a-4a29-90f3-86c70d437ed1	764d3a1f-f825-45e2-bddc-606de70b90b0	f
ca7ffbf1-c30a-4a29-90f3-86c70d437ed1	063f8be9-26c1-4e3b-94dc-2bb1816d760c	f
ca7ffbf1-c30a-4a29-90f3-86c70d437ed1	ce197625-f7b0-41f2-b8e1-09ab8ca56489	f
ca7ffbf1-c30a-4a29-90f3-86c70d437ed1	ca339a4d-498e-4b02-96cc-d5c0170808da	f
4a8e1c9b-61d0-42b6-845d-e0858ed07ab6	caaf5764-484b-44f0-b64f-7062584ceec6	t
4a8e1c9b-61d0-42b6-845d-e0858ed07ab6	da2b9ae6-97e4-4242-9cdf-e88fdc2575e1	t
4a8e1c9b-61d0-42b6-845d-e0858ed07ab6	78b18b42-4294-486f-860e-65bc75620250	t
4a8e1c9b-61d0-42b6-845d-e0858ed07ab6	11a2da8a-20e6-4b1e-bcaf-8462982dd828	t
4a8e1c9b-61d0-42b6-845d-e0858ed07ab6	dec2dada-bcd5-453a-a45c-43c7e6964497	t
4a8e1c9b-61d0-42b6-845d-e0858ed07ab6	cb7af951-ab7f-43e9-b85e-61d295a8c2c8	t
4a8e1c9b-61d0-42b6-845d-e0858ed07ab6	764d3a1f-f825-45e2-bddc-606de70b90b0	f
4a8e1c9b-61d0-42b6-845d-e0858ed07ab6	063f8be9-26c1-4e3b-94dc-2bb1816d760c	f
4a8e1c9b-61d0-42b6-845d-e0858ed07ab6	ce197625-f7b0-41f2-b8e1-09ab8ca56489	f
4a8e1c9b-61d0-42b6-845d-e0858ed07ab6	ca339a4d-498e-4b02-96cc-d5c0170808da	f
c7c13253-98e4-4b5e-9b7f-634298c5e8a5	caaf5764-484b-44f0-b64f-7062584ceec6	t
c7c13253-98e4-4b5e-9b7f-634298c5e8a5	da2b9ae6-97e4-4242-9cdf-e88fdc2575e1	t
c7c13253-98e4-4b5e-9b7f-634298c5e8a5	78b18b42-4294-486f-860e-65bc75620250	t
c7c13253-98e4-4b5e-9b7f-634298c5e8a5	11a2da8a-20e6-4b1e-bcaf-8462982dd828	t
c7c13253-98e4-4b5e-9b7f-634298c5e8a5	dec2dada-bcd5-453a-a45c-43c7e6964497	t
c7c13253-98e4-4b5e-9b7f-634298c5e8a5	cb7af951-ab7f-43e9-b85e-61d295a8c2c8	t
c7c13253-98e4-4b5e-9b7f-634298c5e8a5	764d3a1f-f825-45e2-bddc-606de70b90b0	f
c7c13253-98e4-4b5e-9b7f-634298c5e8a5	063f8be9-26c1-4e3b-94dc-2bb1816d760c	f
c7c13253-98e4-4b5e-9b7f-634298c5e8a5	ce197625-f7b0-41f2-b8e1-09ab8ca56489	f
c7c13253-98e4-4b5e-9b7f-634298c5e8a5	ca339a4d-498e-4b02-96cc-d5c0170808da	f
2c5fd935-c489-41f4-be87-eda2243aebfb	caaf5764-484b-44f0-b64f-7062584ceec6	t
2c5fd935-c489-41f4-be87-eda2243aebfb	da2b9ae6-97e4-4242-9cdf-e88fdc2575e1	t
2c5fd935-c489-41f4-be87-eda2243aebfb	78b18b42-4294-486f-860e-65bc75620250	t
2c5fd935-c489-41f4-be87-eda2243aebfb	11a2da8a-20e6-4b1e-bcaf-8462982dd828	t
2c5fd935-c489-41f4-be87-eda2243aebfb	dec2dada-bcd5-453a-a45c-43c7e6964497	t
2c5fd935-c489-41f4-be87-eda2243aebfb	cb7af951-ab7f-43e9-b85e-61d295a8c2c8	t
2c5fd935-c489-41f4-be87-eda2243aebfb	764d3a1f-f825-45e2-bddc-606de70b90b0	f
2c5fd935-c489-41f4-be87-eda2243aebfb	063f8be9-26c1-4e3b-94dc-2bb1816d760c	f
2c5fd935-c489-41f4-be87-eda2243aebfb	ce197625-f7b0-41f2-b8e1-09ab8ca56489	f
2c5fd935-c489-41f4-be87-eda2243aebfb	ca339a4d-498e-4b02-96cc-d5c0170808da	f
a68e7ff4-fbc6-4374-a503-802a347de6ac	caaf5764-484b-44f0-b64f-7062584ceec6	t
a68e7ff4-fbc6-4374-a503-802a347de6ac	da2b9ae6-97e4-4242-9cdf-e88fdc2575e1	t
a68e7ff4-fbc6-4374-a503-802a347de6ac	78b18b42-4294-486f-860e-65bc75620250	t
a68e7ff4-fbc6-4374-a503-802a347de6ac	11a2da8a-20e6-4b1e-bcaf-8462982dd828	t
a68e7ff4-fbc6-4374-a503-802a347de6ac	dec2dada-bcd5-453a-a45c-43c7e6964497	t
a68e7ff4-fbc6-4374-a503-802a347de6ac	cb7af951-ab7f-43e9-b85e-61d295a8c2c8	t
a68e7ff4-fbc6-4374-a503-802a347de6ac	764d3a1f-f825-45e2-bddc-606de70b90b0	f
a68e7ff4-fbc6-4374-a503-802a347de6ac	063f8be9-26c1-4e3b-94dc-2bb1816d760c	f
a68e7ff4-fbc6-4374-a503-802a347de6ac	ce197625-f7b0-41f2-b8e1-09ab8ca56489	f
a68e7ff4-fbc6-4374-a503-802a347de6ac	ca339a4d-498e-4b02-96cc-d5c0170808da	f
08070c05-e13c-4eb2-8afd-b4d4b5b58691	0ffbd751-1a8f-4206-bde0-09d0b944ef3a	t
08070c05-e13c-4eb2-8afd-b4d4b5b58691	d927e25c-aab0-4793-a247-bb2ed7fcfdfb	t
08070c05-e13c-4eb2-8afd-b4d4b5b58691	5100f0ae-22ec-4175-aa7b-c7953eb64db4	t
08070c05-e13c-4eb2-8afd-b4d4b5b58691	c79051b5-e811-40c2-beb8-e22a52ac9894	t
08070c05-e13c-4eb2-8afd-b4d4b5b58691	ab825560-c7fa-49a7-8c72-626787c363bc	t
08070c05-e13c-4eb2-8afd-b4d4b5b58691	bb7dbd7f-2b09-4922-938e-5d99fab04021	t
08070c05-e13c-4eb2-8afd-b4d4b5b58691	474ef808-8e0b-4255-8a69-d5bed150cb21	f
08070c05-e13c-4eb2-8afd-b4d4b5b58691	e41a2773-48b0-4ae0-a929-87bfca1274c8	f
08070c05-e13c-4eb2-8afd-b4d4b5b58691	50445a82-b24e-4c9a-8336-5cea7d2ae817	f
08070c05-e13c-4eb2-8afd-b4d4b5b58691	754bca75-7c68-44c1-9f53-4fd6cb5e05f1	f
f5bec733-cf3b-4eb3-a759-9dcd218c0b9e	0ffbd751-1a8f-4206-bde0-09d0b944ef3a	t
f5bec733-cf3b-4eb3-a759-9dcd218c0b9e	d927e25c-aab0-4793-a247-bb2ed7fcfdfb	t
f5bec733-cf3b-4eb3-a759-9dcd218c0b9e	5100f0ae-22ec-4175-aa7b-c7953eb64db4	t
f5bec733-cf3b-4eb3-a759-9dcd218c0b9e	c79051b5-e811-40c2-beb8-e22a52ac9894	t
f5bec733-cf3b-4eb3-a759-9dcd218c0b9e	ab825560-c7fa-49a7-8c72-626787c363bc	t
f5bec733-cf3b-4eb3-a759-9dcd218c0b9e	bb7dbd7f-2b09-4922-938e-5d99fab04021	t
f5bec733-cf3b-4eb3-a759-9dcd218c0b9e	474ef808-8e0b-4255-8a69-d5bed150cb21	f
f5bec733-cf3b-4eb3-a759-9dcd218c0b9e	e41a2773-48b0-4ae0-a929-87bfca1274c8	f
f5bec733-cf3b-4eb3-a759-9dcd218c0b9e	50445a82-b24e-4c9a-8336-5cea7d2ae817	f
f5bec733-cf3b-4eb3-a759-9dcd218c0b9e	754bca75-7c68-44c1-9f53-4fd6cb5e05f1	f
37f7a8aa-9e66-44c4-8655-d53224c917c7	0ffbd751-1a8f-4206-bde0-09d0b944ef3a	t
37f7a8aa-9e66-44c4-8655-d53224c917c7	d927e25c-aab0-4793-a247-bb2ed7fcfdfb	t
37f7a8aa-9e66-44c4-8655-d53224c917c7	5100f0ae-22ec-4175-aa7b-c7953eb64db4	t
37f7a8aa-9e66-44c4-8655-d53224c917c7	c79051b5-e811-40c2-beb8-e22a52ac9894	t
37f7a8aa-9e66-44c4-8655-d53224c917c7	ab825560-c7fa-49a7-8c72-626787c363bc	t
37f7a8aa-9e66-44c4-8655-d53224c917c7	bb7dbd7f-2b09-4922-938e-5d99fab04021	t
37f7a8aa-9e66-44c4-8655-d53224c917c7	474ef808-8e0b-4255-8a69-d5bed150cb21	f
37f7a8aa-9e66-44c4-8655-d53224c917c7	e41a2773-48b0-4ae0-a929-87bfca1274c8	f
37f7a8aa-9e66-44c4-8655-d53224c917c7	50445a82-b24e-4c9a-8336-5cea7d2ae817	f
37f7a8aa-9e66-44c4-8655-d53224c917c7	754bca75-7c68-44c1-9f53-4fd6cb5e05f1	f
5289f5f1-e9d3-4593-8ab8-8bb40aed188e	0ffbd751-1a8f-4206-bde0-09d0b944ef3a	t
5289f5f1-e9d3-4593-8ab8-8bb40aed188e	d927e25c-aab0-4793-a247-bb2ed7fcfdfb	t
5289f5f1-e9d3-4593-8ab8-8bb40aed188e	5100f0ae-22ec-4175-aa7b-c7953eb64db4	t
5289f5f1-e9d3-4593-8ab8-8bb40aed188e	c79051b5-e811-40c2-beb8-e22a52ac9894	t
5289f5f1-e9d3-4593-8ab8-8bb40aed188e	ab825560-c7fa-49a7-8c72-626787c363bc	t
5289f5f1-e9d3-4593-8ab8-8bb40aed188e	bb7dbd7f-2b09-4922-938e-5d99fab04021	t
5289f5f1-e9d3-4593-8ab8-8bb40aed188e	474ef808-8e0b-4255-8a69-d5bed150cb21	f
5289f5f1-e9d3-4593-8ab8-8bb40aed188e	e41a2773-48b0-4ae0-a929-87bfca1274c8	f
5289f5f1-e9d3-4593-8ab8-8bb40aed188e	50445a82-b24e-4c9a-8336-5cea7d2ae817	f
5289f5f1-e9d3-4593-8ab8-8bb40aed188e	754bca75-7c68-44c1-9f53-4fd6cb5e05f1	f
812e1083-38a9-403b-a664-ca02cced092e	0ffbd751-1a8f-4206-bde0-09d0b944ef3a	t
812e1083-38a9-403b-a664-ca02cced092e	d927e25c-aab0-4793-a247-bb2ed7fcfdfb	t
812e1083-38a9-403b-a664-ca02cced092e	5100f0ae-22ec-4175-aa7b-c7953eb64db4	t
812e1083-38a9-403b-a664-ca02cced092e	c79051b5-e811-40c2-beb8-e22a52ac9894	t
812e1083-38a9-403b-a664-ca02cced092e	ab825560-c7fa-49a7-8c72-626787c363bc	t
812e1083-38a9-403b-a664-ca02cced092e	bb7dbd7f-2b09-4922-938e-5d99fab04021	t
812e1083-38a9-403b-a664-ca02cced092e	474ef808-8e0b-4255-8a69-d5bed150cb21	f
812e1083-38a9-403b-a664-ca02cced092e	e41a2773-48b0-4ae0-a929-87bfca1274c8	f
812e1083-38a9-403b-a664-ca02cced092e	50445a82-b24e-4c9a-8336-5cea7d2ae817	f
812e1083-38a9-403b-a664-ca02cced092e	754bca75-7c68-44c1-9f53-4fd6cb5e05f1	f
24136744-c2d9-4a78-b09f-a93579a78455	0ffbd751-1a8f-4206-bde0-09d0b944ef3a	t
24136744-c2d9-4a78-b09f-a93579a78455	d927e25c-aab0-4793-a247-bb2ed7fcfdfb	t
24136744-c2d9-4a78-b09f-a93579a78455	5100f0ae-22ec-4175-aa7b-c7953eb64db4	t
24136744-c2d9-4a78-b09f-a93579a78455	c79051b5-e811-40c2-beb8-e22a52ac9894	t
24136744-c2d9-4a78-b09f-a93579a78455	ab825560-c7fa-49a7-8c72-626787c363bc	t
24136744-c2d9-4a78-b09f-a93579a78455	bb7dbd7f-2b09-4922-938e-5d99fab04021	t
24136744-c2d9-4a78-b09f-a93579a78455	474ef808-8e0b-4255-8a69-d5bed150cb21	f
24136744-c2d9-4a78-b09f-a93579a78455	e41a2773-48b0-4ae0-a929-87bfca1274c8	f
24136744-c2d9-4a78-b09f-a93579a78455	50445a82-b24e-4c9a-8336-5cea7d2ae817	f
24136744-c2d9-4a78-b09f-a93579a78455	754bca75-7c68-44c1-9f53-4fd6cb5e05f1	f
7e5c8c81-ae15-4638-8a35-cf3dc8e8f77c	ab825560-c7fa-49a7-8c72-626787c363bc	t
7e5c8c81-ae15-4638-8a35-cf3dc8e8f77c	c79051b5-e811-40c2-beb8-e22a52ac9894	t
7e5c8c81-ae15-4638-8a35-cf3dc8e8f77c	0ffbd751-1a8f-4206-bde0-09d0b944ef3a	t
7e5c8c81-ae15-4638-8a35-cf3dc8e8f77c	d927e25c-aab0-4793-a247-bb2ed7fcfdfb	t
7e5c8c81-ae15-4638-8a35-cf3dc8e8f77c	bb7dbd7f-2b09-4922-938e-5d99fab04021	t
\.


--
-- Data for Name: client_scope_role_mapping; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.client_scope_role_mapping (scope_id, role_id) FROM stdin;
063f8be9-26c1-4e3b-94dc-2bb1816d760c	d737b4b1-a6bd-4e9c-aaf7-4041ec0082b9
474ef808-8e0b-4255-8a69-d5bed150cb21	276c902b-cc02-4db0-87be-ea9876a02ac7
\.


--
-- Data for Name: client_session; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.client_session (id, client_id, redirect_uri, state, "timestamp", session_id, auth_method, realm_id, auth_user_id, current_action) FROM stdin;
\.


--
-- Data for Name: client_session_auth_status; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.client_session_auth_status (authenticator, status, client_session) FROM stdin;
\.


--
-- Data for Name: client_session_note; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.client_session_note (name, value, client_session) FROM stdin;
\.


--
-- Data for Name: client_session_prot_mapper; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.client_session_prot_mapper (protocol_mapper_id, client_session) FROM stdin;
\.


--
-- Data for Name: client_session_role; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.client_session_role (role_id, client_session) FROM stdin;
\.


--
-- Data for Name: client_user_session_note; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.client_user_session_note (name, value, client_session) FROM stdin;
\.


--
-- Data for Name: component; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.component (id, name, parent_id, provider_id, provider_type, realm_id, sub_type) FROM stdin;
6e564624-b1dc-443c-824b-3388c7a2a052	Trusted Hosts	9a97cd68-2f02-4213-a560-1f7696277d76	trusted-hosts	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	9a97cd68-2f02-4213-a560-1f7696277d76	anonymous
b9f3e60a-f742-4437-8875-7022bcb97ef8	Consent Required	9a97cd68-2f02-4213-a560-1f7696277d76	consent-required	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	9a97cd68-2f02-4213-a560-1f7696277d76	anonymous
619a9490-3eb1-42b4-b9b3-3f5b13216f65	Full Scope Disabled	9a97cd68-2f02-4213-a560-1f7696277d76	scope	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	9a97cd68-2f02-4213-a560-1f7696277d76	anonymous
f461c236-bfa6-4240-84c5-9dfe461b4d95	Max Clients Limit	9a97cd68-2f02-4213-a560-1f7696277d76	max-clients	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	9a97cd68-2f02-4213-a560-1f7696277d76	anonymous
d4a39984-6253-498a-8f8d-138e204b7364	Allowed Protocol Mapper Types	9a97cd68-2f02-4213-a560-1f7696277d76	allowed-protocol-mappers	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	9a97cd68-2f02-4213-a560-1f7696277d76	anonymous
47158c1d-81d5-460a-a0c9-d0fc52f577d9	Allowed Client Scopes	9a97cd68-2f02-4213-a560-1f7696277d76	allowed-client-templates	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	9a97cd68-2f02-4213-a560-1f7696277d76	anonymous
a74def7a-afe5-49d1-8b91-1a962907b871	Allowed Protocol Mapper Types	9a97cd68-2f02-4213-a560-1f7696277d76	allowed-protocol-mappers	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	9a97cd68-2f02-4213-a560-1f7696277d76	authenticated
a854544e-964a-4aaa-a58b-fff479704c7e	Allowed Client Scopes	9a97cd68-2f02-4213-a560-1f7696277d76	allowed-client-templates	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	9a97cd68-2f02-4213-a560-1f7696277d76	authenticated
a6f2ccf3-0426-4acc-a6e6-a1f5cd242658	rsa-generated	9a97cd68-2f02-4213-a560-1f7696277d76	rsa-generated	org.keycloak.keys.KeyProvider	9a97cd68-2f02-4213-a560-1f7696277d76	\N
d04e6b57-9119-4e28-a0b8-079178dbb25c	rsa-enc-generated	9a97cd68-2f02-4213-a560-1f7696277d76	rsa-enc-generated	org.keycloak.keys.KeyProvider	9a97cd68-2f02-4213-a560-1f7696277d76	\N
ef891e3e-1afa-4920-a6c8-5e140ee3e073	hmac-generated-hs512	9a97cd68-2f02-4213-a560-1f7696277d76	hmac-generated	org.keycloak.keys.KeyProvider	9a97cd68-2f02-4213-a560-1f7696277d76	\N
e9b166de-8b2e-4b7b-bf67-5d3224b42dc5	aes-generated	9a97cd68-2f02-4213-a560-1f7696277d76	aes-generated	org.keycloak.keys.KeyProvider	9a97cd68-2f02-4213-a560-1f7696277d76	\N
3eb66c4e-956a-4d1d-a4b2-3d66c926e3df	\N	9a97cd68-2f02-4213-a560-1f7696277d76	declarative-user-profile	org.keycloak.userprofile.UserProfileProvider	9a97cd68-2f02-4213-a560-1f7696277d76	\N
557955df-963c-47e7-b845-8a29d2f793ef	rsa-generated	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	rsa-generated	org.keycloak.keys.KeyProvider	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	\N
9e2b4074-5571-48aa-8907-27cbd8dc977c	rsa-enc-generated	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	rsa-enc-generated	org.keycloak.keys.KeyProvider	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	\N
610a97f8-d64b-4a62-a696-1c1a2c8924f9	hmac-generated-hs512	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	hmac-generated	org.keycloak.keys.KeyProvider	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	\N
06f5d376-101a-4324-9358-7a16970f21a6	aes-generated	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	aes-generated	org.keycloak.keys.KeyProvider	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	\N
fb56805d-e56b-476a-9517-fbcf01aaf292	Trusted Hosts	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	trusted-hosts	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	anonymous
f94227b2-f65b-4c59-97a5-92cf42d1a2d4	Consent Required	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	consent-required	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	anonymous
0bcd104b-fddf-43df-b388-e6e16531118b	Full Scope Disabled	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	scope	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	anonymous
a79ed3a7-1ea0-464c-9082-5ffe9c66643d	Max Clients Limit	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	max-clients	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	anonymous
a7f4d525-d178-4753-a52e-991f2442e40a	Allowed Protocol Mapper Types	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	allowed-protocol-mappers	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	anonymous
dc783e3b-bb09-4449-9957-bf5ebadd5c6d	Allowed Client Scopes	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	allowed-client-templates	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	anonymous
d7b7e9c2-7cfc-4534-99ec-8f0076591a5a	Allowed Protocol Mapper Types	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	allowed-protocol-mappers	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	authenticated
87b0bd94-c935-4284-95ba-a1c6702c94bd	Allowed Client Scopes	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	allowed-client-templates	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	authenticated
\.


--
-- Data for Name: component_config; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.component_config (id, component_id, name, value) FROM stdin;
e98d8037-3815-46f9-a282-c5e1eade1ef6	6e564624-b1dc-443c-824b-3388c7a2a052	client-uris-must-match	true
1b262db7-8364-4f7c-a276-db7d097f8bda	6e564624-b1dc-443c-824b-3388c7a2a052	host-sending-registration-request-must-match	true
3ba3c5ee-3790-49ac-93d1-47b3da18ad2b	a854544e-964a-4aaa-a58b-fff479704c7e	allow-default-scopes	true
61a21256-cb7b-4a77-9729-1cf143851012	f461c236-bfa6-4240-84c5-9dfe461b4d95	max-clients	200
2f4712ac-09f4-493e-acb7-f5cd7bae810d	47158c1d-81d5-460a-a0c9-d0fc52f577d9	allow-default-scopes	true
8f276683-9934-4da9-8f2d-704a5accc9e3	a74def7a-afe5-49d1-8b91-1a962907b871	allowed-protocol-mapper-types	oidc-full-name-mapper
b2e69543-0fd7-4d8f-9416-8227894d7d17	a74def7a-afe5-49d1-8b91-1a962907b871	allowed-protocol-mapper-types	oidc-usermodel-property-mapper
1c5c5b31-06e5-462f-93b4-cf6931f53e1e	a74def7a-afe5-49d1-8b91-1a962907b871	allowed-protocol-mapper-types	oidc-sha256-pairwise-sub-mapper
46883cf1-3bd9-40da-87f6-285dc4397410	a74def7a-afe5-49d1-8b91-1a962907b871	allowed-protocol-mapper-types	oidc-usermodel-attribute-mapper
d583fdce-e4a4-4173-b785-dd8bdc20ff33	a74def7a-afe5-49d1-8b91-1a962907b871	allowed-protocol-mapper-types	saml-user-property-mapper
9864ec2a-9db8-4348-b497-ef03b48d1308	a74def7a-afe5-49d1-8b91-1a962907b871	allowed-protocol-mapper-types	saml-user-attribute-mapper
35e1ad5f-2fa0-46d9-8ad8-854b6528e054	a74def7a-afe5-49d1-8b91-1a962907b871	allowed-protocol-mapper-types	oidc-address-mapper
7034aeb5-9c7c-4dd9-bc2b-a3aa9acd4158	a74def7a-afe5-49d1-8b91-1a962907b871	allowed-protocol-mapper-types	saml-role-list-mapper
4a935088-eebb-48b5-9f17-360228c5b59b	d4a39984-6253-498a-8f8d-138e204b7364	allowed-protocol-mapper-types	oidc-address-mapper
712d02c3-0404-4e7b-b267-7a181ddf417a	d4a39984-6253-498a-8f8d-138e204b7364	allowed-protocol-mapper-types	saml-user-attribute-mapper
1984d014-0cc4-4ecf-9696-acab4054c31f	d4a39984-6253-498a-8f8d-138e204b7364	allowed-protocol-mapper-types	oidc-usermodel-property-mapper
0d65dd04-3bf6-472e-a1e8-65801deca362	d4a39984-6253-498a-8f8d-138e204b7364	allowed-protocol-mapper-types	saml-role-list-mapper
c3d84f55-eb55-451d-8a6b-8a974e14501d	d4a39984-6253-498a-8f8d-138e204b7364	allowed-protocol-mapper-types	saml-user-property-mapper
c96c0d4d-a952-47b0-b8c9-06fbb4b15e88	d4a39984-6253-498a-8f8d-138e204b7364	allowed-protocol-mapper-types	oidc-full-name-mapper
1e2138e9-4748-42cb-b36b-c89a56f0f94c	d4a39984-6253-498a-8f8d-138e204b7364	allowed-protocol-mapper-types	oidc-usermodel-attribute-mapper
0c8ca5f1-7bea-4199-a02b-502579392155	d4a39984-6253-498a-8f8d-138e204b7364	allowed-protocol-mapper-types	oidc-sha256-pairwise-sub-mapper
872e2697-73f4-4e1b-9b60-e1bc59c33953	3eb66c4e-956a-4d1d-a4b2-3d66c926e3df	kc.user.profile.config	{"attributes":[{"name":"username","displayName":"${username}","validations":{"length":{"min":3,"max":255},"username-prohibited-characters":{},"up-username-not-idn-homograph":{}},"permissions":{"view":["admin","user"],"edit":["admin","user"]},"multivalued":false},{"name":"email","displayName":"${email}","validations":{"email":{},"length":{"max":255}},"permissions":{"view":["admin","user"],"edit":["admin","user"]},"multivalued":false},{"name":"firstName","displayName":"${firstName}","validations":{"length":{"max":255},"person-name-prohibited-characters":{}},"permissions":{"view":["admin","user"],"edit":["admin","user"]},"multivalued":false},{"name":"lastName","displayName":"${lastName}","validations":{"length":{"max":255},"person-name-prohibited-characters":{}},"permissions":{"view":["admin","user"],"edit":["admin","user"]},"multivalued":false}],"groups":[{"name":"user-metadata","displayHeader":"User metadata","displayDescription":"Attributes, which refer to user metadata"}]}
bd8496a5-5d04-491b-a2bc-e706dd6d3237	d04e6b57-9119-4e28-a0b8-079178dbb25c	algorithm	RSA-OAEP
00dee09c-8250-4bbc-b1ff-039bb640fe31	d04e6b57-9119-4e28-a0b8-079178dbb25c	certificate	MIICmzCCAYMCBgGeO7xXyjANBgkqhkiG9w0BAQsFADARMQ8wDQYDVQQDDAZtYXN0ZXIwHhcNMjYwNTE4MTUzNTU5WhcNMzYwNTE4MTUzNzM5WjARMQ8wDQYDVQQDDAZtYXN0ZXIwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC9Eo7ctxjxocVehAoG7+86lTnCDz4DtHZMUdBVQ1MGXIf4QGE/xCBgKl8rJ3fTE2szEulgr0Xg8zM7MdNVh6skgJJZv18RNW2dnRwzoFAnTcrTP8FiN0ILiNYlX1orlcE6Tm6f22NnosK3bLmW6vceROw1yjYtcRYBDKEW4SI1M4hFKlcprddoQeXUYI/IK0Hz4iRHLB3iZWaW3qIpoq3pZlUhaufikvPtx8UX8Uw/IMbDuk7U6xr/YhfGLKukFKNVfsF1EPI+VUeQiy7/0ReA3X9U15dxKIg2XW6LWcByeB3vtbCmXLVysYlYK4dp6Bb3o40r9SxkDReh6/T47J3TAgMBAAEwDQYJKoZIhvcNAQELBQADggEBAJkka9DpB3xLLiDxyLM6Zco28ts8yeIli6ilea2ZlFXUk/BWFB3VWQT9CRZVd06QHsrqASvmcRBnwP0WoYG787iLYWlzKJKAur83WqDCYUZI7dZ+re77LSqTshCdeBYlQJJph0LIpaiI0choPqs2J8zxJsCqRLOgcgyfhQZ9uV/cZPOIQw8XmfkgVfe5/5ORcMZ7WAcIdG+Vh+hQNDhRZ1gjHbzJcJdhjpVHVjrfylFdMjdH31oaDBv/FSdKTO9/+S8X8MwBqeBGQEoSeYGKRSEFixlJbOCF3nG/IWFTdzNLxJJ5KAZlvNguaqAC8NluNpcmw8oXWvUDw9OGwUmzvPw=
6439e8ff-5fb4-4795-847d-96ce74b327e0	d04e6b57-9119-4e28-a0b8-079178dbb25c	priority	100
06ef5514-88c8-4073-adf5-005541182f66	d04e6b57-9119-4e28-a0b8-079178dbb25c	privateKey	MIIEpAIBAAKCAQEAvRKO3LcY8aHFXoQKBu/vOpU5wg8+A7R2TFHQVUNTBlyH+EBhP8QgYCpfKyd30xNrMxLpYK9F4PMzOzHTVYerJICSWb9fETVtnZ0cM6BQJ03K0z/BYjdCC4jWJV9aK5XBOk5un9tjZ6LCt2y5lur3HkTsNco2LXEWAQyhFuEiNTOIRSpXKa3XaEHl1GCPyCtB8+IkRywd4mVmlt6iKaKt6WZVIWrn4pLz7cfFF/FMPyDGw7pO1Osa/2IXxiyrpBSjVX7BdRDyPlVHkIsu/9EXgN1/VNeXcSiINl1ui1nAcngd77Wwply1crGJWCuHaegW96ONK/UsZA0Xoev0+Oyd0wIDAQABAoIBAFFG44Ps77ubk5ksQJU32kqAMJqD6+Ay2PG478pfTRb8evTUVBnRySsdu9h0uHVTsS7877cA0ZTAZyMIqbToQ8FGxeLvucHPimYJTkDBJwOmVMzX6N08LNeBhLD/GueGklBqu/JbIJHB7VtlUSiXrBBmh3YeDYkeRlvAHpWTxR1B4wPThlY0rYqRGeZP/qBgJspemZA5/9VPb4c6dbS/1vt89nXX9TGdLe2CE57rk/BpwxnxEuAxWfvNoR539eXgZSGm2hxhodQ5r7ND8m3rXtYcoRZouAT9iTJuWK/OPzgwkj/AL5Y/qNo6XepYrUieYdr0ye0nNRxsnIdOAJvg06kCgYEA5NLogriXfrvL3UcBIryhznFZK54mqhZ3qAld7/ijnDYer93IJR9MFpHIpw2wyo/Zt3ck1x5NgMPnvY4bS2UQtDK1cJd34xhHIgrFb7gWAwVQJuPfuzS49H7i9G7rz8rhd2oxsKCDIkjTmD0ztTzTk3R1Egi14q4bVS3dp68Aw/sCgYEA04cPqg3N0AzfHBukc06eRbPo2iOVohwN533+/sFou9gzSXFuCdSiRzzpCiPLGv1LsHweyR2eKzZHevHLNn5SKuG00pVLw6klnTX0398aDb/Zcj0TJ0O2xDWJJGN9SsdipsE/sOPwouz98vPcocNZKSds76jCbDsGMR00BuAqDgkCgYEA12RYjUQpBpjL67y8qvAY93Tm1RIHny+K7tfyXsMTbyXaeP0xOxBc1RnhYK6YbfQ+ol46hWv21HCUIXA07SFzOcxJ0nQh29isjLTK6MDFp45GxnTV0yhruWn/RMtsmaqF1ZxWrcZJ6enXk4R4ue9J0ZFb6d/dJkVxYRrNfNxUwiUCgYEAp17m9heWElkc8JCuvs4mTeDdDj252Ft6ZQE9EzbWOEwJyMMH3p9xCA0aF/vaabCigzKy6U+WJ3r7dDx+HtA1E9kjyrx3BoqASLS43asaYma7F7lbvmXF59q0eSZ/rPu3A1tFmiHB9iivh92NZjG8CuQ3Piq6LAlIDPSehhI5NIECgYBSUBaKoONEBy+V7atV/qgi6at2glVGetSdYeKQDmW480pU62x6Pqh31NMzDiFKChKp6oRSWLqcKuXinD2La4rkTqRvvmz2dxQ7RlYYxRtq3ZBYZqsqPkgASXnevXf3m1KwL+8SuLiO4FTiT7voA/NSOrCUgjCcz5wbwoLGshfOTQ==
bb22b25e-c3d7-4445-8e6d-2d64e03942ea	d04e6b57-9119-4e28-a0b8-079178dbb25c	keyUse	ENC
13f85d5a-a057-49a5-89c4-192663af7a97	a6f2ccf3-0426-4acc-a6e6-a1f5cd242658	keyUse	SIG
02cb7af6-0dcd-41ca-95c4-d0a4046555ed	a6f2ccf3-0426-4acc-a6e6-a1f5cd242658	privateKey	MIIEogIBAAKCAQEA0foxrIqRGom4sgxh0lPS73X14A4hqPJq4/dA30TlUfw2P7zVw2AZEiw9M3uS7M2tm8ZBlLBi60l3JMxf+oGtldR8VjHSeR6XiP9nTMOyCbL2OTsoeavO62K3gznxzlGDX19ltWdJ9rwH4QUtkCFOvvJMU0tpnFDowQymmTtcjXhPsSvdoSxwplP8yKqXmMLQj5nRTk5s2G7JA/BGLk/zwe4J9jneP4Y3202XsXJVKKf8cZ+f4Hae4ifZoRB2sPAepKZ8swvrvi+QgMFI7e9yqkSQB0p+JhIm6xP+Fc0VWa1x4vRz1753nGn0Pizhoc5ZKsGOQdUOF0BbuYtCTLhXFQIDAQABAoIBAAZK/H7LZ+NuDW8Zfzuv6Iweq3b7qsV4qfyLQpJZFa+qG36NTFwXnt4Qq8uMo/4O1jDO2Q1rZvuJGcfI4ZN+8W8wqdfz6aGuFEDEgIt9o0dS6dZperCBB/7aLYitKgDS0wPiYUFnhyvVhMvR9j2AIESXnw+GqvN/k3v2ihj9Uo/FAfLcqj/JmG4ntgy85HxXmxgeq4dWezl3tz2T2AmRYWi93RzdACKsC0V8UNb53DyxgycYWICvOE1gDCoqbnvuaVaJMB2ibubY5Mr/FVB5Xun4gxQbiSA1cIWt9f3W/6jf0VIpn8YWeKDtNgPqZRFr9Oimxhf41vPCPe+4InQKgz0CgYEA7poOz5jMxtNXtDfwJuK8NZB7OdNMlMs81kfFkCdg6mU6I0SRG3v0YtJXh1xco3dVNlYuSfY+GbbqjQS8J4TT1zZALWUYlTa7R4HwpGyLzOaw18D/sb9YVy7lF359iL8B4phMFc5V4XS8PYQE2n1L/zHcdvqwtw4jn2ybs0QWc2MCgYEA4UnOx3IoHFK6ZGY7GVp4+LtCFvchxq3/YsJeYBvr+CfsYsTKL4YR3HtwImlTjF9fc4YGHoCjlorRswd6H8wqbAFh3aDywuBmpX4Kt/+C6/Um0pDS6gk2slmR0BjtQIgkrVDKcADNnyPVL2AgKo+Ov51/DemCaTvnlSGrIyXvIScCgYBBoodoe/P4zbJWlPyu9bgoU/JR2do7JB08JMon+W0jjW0MvpPcJ6D2fj4tsi6ZmP4L0HEzT1WN5U9oM2E+zb8oeHf3BNRaV4/0/72evW1HlD4ZW7H6x1QZx4Clkdoef8yY9KQZa4UcW+xcT7C2GbmKHcEzyYpLEMyj0lCSY6x5WQKBgA0R1Rco/j62Ze3RKHiOERqM8oaWi7UU/w3hrMvykrvwxPvt4rTjGEIsPxMf/SLVnZn8GnrGh7cCEqxKMMGLfKKLafwLjEnV7t6G82Q9RIEf1cK9eB7vream35is+YaW31nWqAfbZBJpZ8K51uPhNCzVnDtYYqJsQUEblOwTFU5dAoGAUUgdQmhpmeqMRJGEl/F4jr2IVtbVS3TLb/gPiqBeC+kkLAlVcArx+TNxNK5aqs21IM3HIil3Wmn72mZ4mOymWLcVseZ9PerxskoZlPqu9E0IeyAhQ+yYe2Wrqs37aVPU3bosaw0fRWkIlJ59bat/8M7qNjsaU06plbB8we0aWFo=
0e1a8c38-533d-49c3-8b48-5b6da2ae523e	a6f2ccf3-0426-4acc-a6e6-a1f5cd242658	priority	100
23a568aa-1b96-47e2-9d39-6f3abc7fc356	a6f2ccf3-0426-4acc-a6e6-a1f5cd242658	certificate	MIICmzCCAYMCBgGeO7xXcjANBgkqhkiG9w0BAQsFADARMQ8wDQYDVQQDDAZtYXN0ZXIwHhcNMjYwNTE4MTUzNTU5WhcNMzYwNTE4MTUzNzM5WjARMQ8wDQYDVQQDDAZtYXN0ZXIwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDR+jGsipEaibiyDGHSU9LvdfXgDiGo8mrj90DfROVR/DY/vNXDYBkSLD0ze5Lsza2bxkGUsGLrSXckzF/6ga2V1HxWMdJ5HpeI/2dMw7IJsvY5Oyh5q87rYreDOfHOUYNfX2W1Z0n2vAfhBS2QIU6+8kxTS2mcUOjBDKaZO1yNeE+xK92hLHCmU/zIqpeYwtCPmdFOTmzYbskD8EYuT/PB7gn2Od4/hjfbTZexclUop/xxn5/gdp7iJ9mhEHaw8B6kpnyzC+u+L5CAwUjt73KqRJAHSn4mEibrE/4VzRVZrXHi9HPXvnecafQ+LOGhzlkqwY5B1Q4XQFu5i0JMuFcVAgMBAAEwDQYJKoZIhvcNAQELBQADggEBAFDqwgnxgsz9gy8oJYOwzXr+e5lWsmvq9BKlZJ0/TwMTzNVIzswOlylKQgcK/ZVVFIWdJfs74Cl/URlvsDuCq6WuK/eGVYPdCSQqlCxCWl82DUZW7OGY9WDo9Sk2ByypJc52XS/j+8V2i8ryAp42IXi+10+FxnRK4gccrPPiyKiUwkABp3ViTHpK9PMRt3MKWFSJqpzIkemE2VnaudtAdkwYkL7eb6eZXT3P239iENZkE1NhGePZgBqKy3zMWCSJtaVmjz8wbPvgUlJ4648TJuvxfXAxkcXLY0PNLNfxziS78lanV0I4uzLUGR1vs9bq6SpZWMRdL5++ilbJvQkb70w=
dd6253e1-430f-4b74-b9d0-4e973b0bc577	ef891e3e-1afa-4920-a6c8-5e140ee3e073	algorithm	HS512
f57924a6-4f7a-4644-9da5-f73eb5d3c872	ef891e3e-1afa-4920-a6c8-5e140ee3e073	secret	sHn-t3AYzflbbCQ-s05LCbCg2uzkdi5aMXykgN8BOxaabCUrlfceEdHvCaEE55Pn9hfX1351yKthbp3kF3qbb-7gMDLTktzIrcH7HOaJqAwtxm8AVMmRFHr8I6AtLzc5efRHlwUYpWcRKA1VECHd-XO3t5PCCD18plBBXq3KJqg
acfeffe3-1a45-43a6-9c1d-bc1faa491445	ef891e3e-1afa-4920-a6c8-5e140ee3e073	kid	566945bf-1172-410d-9ceb-b7e0e48f95d8
4ab65f30-7466-47d6-acdb-982fe4b2ba7d	ef891e3e-1afa-4920-a6c8-5e140ee3e073	priority	100
834dbf55-431e-4e53-8abc-d1c206803696	e9b166de-8b2e-4b7b-bf67-5d3224b42dc5	secret	Hn3q1G-qsBpQgY_vNN27vQ
940becb9-13bf-4330-9216-de6732e051e0	e9b166de-8b2e-4b7b-bf67-5d3224b42dc5	priority	100
24060ce5-6559-4974-9f73-8da1c95a3f0e	e9b166de-8b2e-4b7b-bf67-5d3224b42dc5	kid	1bf29b5a-56b1-4bc6-96e2-15421fba7d78
0fc82b7d-62e4-47a0-80e8-b6a51c381417	9e2b4074-5571-48aa-8907-27cbd8dc977c	certificate	MIICoTCCAYkCBgGeO7xeQjANBgkqhkiG9w0BAQsFADAUMRIwEAYDVQQDDAlpbnZlbnRvcnkwHhcNMjYwNTE4MTUzNjAxWhcNMzYwNTE4MTUzNzQxWjAUMRIwEAYDVQQDDAlpbnZlbnRvcnkwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDohVsTsFpBvOdgM+vDANba3MthhEsHyCWoHoHbO7HVd5b0G1xqb/YOHPDdkpWt54dFGqAr7zd3UBhO4f+SZ+zcgyfalzIpbzvIqGGB71UbzWH7eXYWwb53WOSGpRTbImlQE9hN6iOFq+d6D2HtZZohtL7Wj81I7p42LYml7whSTEi9gwkYQKZSTTAxwxCM9iy87qCS5J1qD6Kr++ZljtyX5kWUP4cjZp09EKaouMvIAcF5K05vhPhXcEXT9omAbVHCmEooliK2rIsZnTzNFTbSkNbroqWiupGVXo1cIzFdWIGGAsz8WQnS/v1aPPSjbszhvfqphKOtnR9RjmDOdpzjAgMBAAEwDQYJKoZIhvcNAQELBQADggEBAMpmv2nr2wg18ktlMg1CEExRfPTgFZnAVJCpjGGe5utWzLpfzIvEqoYS/nHgBnRAUCsJl90/Oei/N9I8goPloCBnkeFelfNbEBU/TqxTfPr+my7WDtj+Rb9r2/YcLspZz5xuEgYWDLBurWnANCro3t/LSxg0QXxgkKowmoWNN4D5QYzQAkUzM76Kf5kDPdx8D2AgYcinjcMVD9mAGvi0CG+GkS8HL4dDCo+S+xPwBnTMxZlUr8n9RIZ6ndUhh+fAPeL56d4kNE396YN9dJGDHfycj8xwdBgySUfUSHRMiqiDzSMPFb4/5aQhZxJdUZ2zZ6gBWXiOC3CPfWAnZulhuq0=
f0cff1f3-e1ea-4d38-90a8-8c474dfe6bac	9e2b4074-5571-48aa-8907-27cbd8dc977c	keyUse	ENC
387b03f0-9bf4-4c67-be38-3e4acde5ea55	9e2b4074-5571-48aa-8907-27cbd8dc977c	priority	100
71091425-f33e-4655-90ac-2b13f4823ca2	9e2b4074-5571-48aa-8907-27cbd8dc977c	algorithm	RSA-OAEP
41bf938d-4bc2-41c5-bbd3-cf89553183de	9e2b4074-5571-48aa-8907-27cbd8dc977c	privateKey	MIIEowIBAAKCAQEA6IVbE7BaQbznYDPrwwDW2tzLYYRLB8glqB6B2zux1XeW9Btcam/2Dhzw3ZKVreeHRRqgK+83d1AYTuH/kmfs3IMn2pcyKW87yKhhge9VG81h+3l2FsG+d1jkhqUU2yJpUBPYTeojhavneg9h7WWaIbS+1o/NSO6eNi2Jpe8IUkxIvYMJGECmUk0wMcMQjPYsvO6gkuSdag+iq/vmZY7cl+ZFlD+HI2adPRCmqLjLyAHBeStOb4T4V3BF0/aJgG1RwphKKJYitqyLGZ08zRU20pDW66KlorqRlV6NXCMxXViBhgLM/FkJ0v79Wjz0o27M4b36qYSjrZ0fUY5gznac4wIDAQABAoIBABSMjd8rE4bswBFPSrN/SahU9qplwSXCaUWMJf4Z2UkGxRyfUGcIVwP/SHAkf2g7kRz+fI+gF/704U5osv1ILvV7/SktzzKR5dmBZqtPhe4rk/sKocY4FXJBtQyLM/vRH40tUSKYTHmzQVqXAm4IWntGbc5+Le5snCcolhodNQHkwzGtE1h4Va5WW0bCXYqLsyym10AjKticIvJT3PhQwiy3pqZySkxKRkK7SP7OA7akVQD8tBFsSAE3ZvsXGZVxJNlveIyjLVD2mWCyOQJAIg6cDtqUmdkqdpjFYXNIR1pAh0SegfZC9T5XBk3mEIxgiZdB69aJuAdv41RexszPrm0CgYEA9ZKv4gktej0Z5c8AtUBXo3JNkwbU99xstMDySlTBUu+fdLa++mCVDsgnjVX1fjAQ9eauTkDiNSwL7clfbQ8JlKNehPREYZHqWLTcONiLcGSc00iZmVBn0nQx7bJZHeDv7EZRfmAiUHqtl9CUUgSQbowrw1swBnV2c3Vc9kQJjnUCgYEA8mTL0HvFFf9KRukz1avf7ZaYAszRZ/4GBCrIV6Dmal1bkPv8+EoCStKijYOiFBjPwaol99hIXm4YGObZ0tVDuZb+dFIV5Q6xE4lCRRAxoFrl16Ek49gy+ifqdCBRFF5dc3dKpgp9Rk0HFvuRf7C23qRE3m+cWRmZAWBEC9/0QvcCgYEA6B4AtYyrOdGrOvcQ2kG5FLsj7AcXIjltXuTJn8zA9x2cAPwDRDIqclBqYkOPyfiw711eAIV/y3aYx+gBlNoT2jUZUF56jCcZ9ULuraSxGElhmqwS00GXAOvnjZ94cK9+2DwXJ3bCuINcthTnPScnRfakHwGAQXqhvbx/ZB8nUUkCgYBTJ7cwH7XeNQVzTD+HFv6sUFR36XIRffjsZwzx2vYRGVP3ais/towQxTAU4kqxIE3tv4RlAWLaWmST7mZdyOICAkXq+9odCaw/6n+8l7CetXBSSCsSqzHZ1eW9zvRhy3m9yffm/IQ7oONExCsHJkWmHa6urJVzj6+I5FCTzlHKwwKBgA81LEzE43WD3ts4rvDg5KTmcQd/KJtFWbWT9xf/NkkBFlS51mv5y+jEoCY8EZbNuXCVTOfa5tdV0a5qzReGsq9Gp8bLsPLKeW6dqL3TL+bbYBM25dBpxCiaHOxpq8Pd2TtJmlvaVhELjpifSDtVW6rEvYWhcb1VXCChWNFsEpfE
fe6bd0c7-06fa-415f-be11-d2311a94217a	557955df-963c-47e7-b845-8a29d2f793ef	priority	100
7a8b0827-0e4f-497b-93b7-a6add2080aa3	557955df-963c-47e7-b845-8a29d2f793ef	keyUse	SIG
480b917e-256f-421a-b822-32acc8a832d6	557955df-963c-47e7-b845-8a29d2f793ef	privateKey	MIIEpAIBAAKCAQEA8E1vjvnqtbaL9j2VDWHzTAgDsih7cPXRhorczHFKPKI6sNFTBLrhL6uTIBH+sbq+6W7Ukjwbpr7LBD3hWCvwSTzS3cE/nYv6lnghb0/IrCFEk9U+tndmIKLho8vSFCSFKDtNic8Q321Fh7HWxFjND7tX0WYdQFzriy8HebFqsnJXr42lQZ4tShHNincv9G98JpOfSx9j0EgTwGI8AJG0oHweUZ2XYJM/a5INiGNucwI7cUtpoc5rA1TxITBCXQr/DsQfK7ykqJc75w3PeTTIs9/CkwAGPvQNrU+T9fSc4yCFV/uIrwgrpACAySRlI62VnT7KFm4BMdHbXC77+59wXQIDAQABAoIBACOJF/u5OnvHtHfkEHQrrXprXvyMHwEL4QG37EHxaOyBgxNdyRyUdDOD+FxQPO1Uc+H6SUYczGwCn+wPKJFM4ho6e+ZeKwWlyxdQSYV383F88/K2oLEEBB7EZ4C85eKjqetSpbtA2zpnItaXtm5PwXdXmXt2UdIQS6bH/B+DXIdptvFvVaxv4G+WIemwjaM3nUwO4Tg/PhLaIAQf+4HzehBzf4OLjVUIlOkbV7qPbP+xO0jf6bnwLAd8qH9zwtyBFMiYyL194c8yhtJD9uWm6LVu21HXFlk70XUxiQGBu1dQxkwurf0RjOe1ucXl0oNn29a4MGQeJOmYJm21I5ItL7MCgYEA+LqdDRNeVESxfi+M9qGXViVy+G9QdMH6bCi9Cw2qV0l/yp+jE6L3TLhaGGtkZp1HeScy8X23mXo4dEsWCAcw/iz4IgrBH8w4AvDDlkrgkEvYxrYD/tgfdx7JtedYW1fmteFK3+rpTOov+t/MfeZ83QIPNxeXhnyxHF3h81fz0T8CgYEA91PDEMVNOvEnX2gptBfJg6QCpnxHpDTuDKYvzMWny/egT8IdyCBnNlE2bgROskYebEebfAqFrsT2ZdN3osk7voKHmtuuBd59Tv9h36UEKROhRD+AVg6IwlNu13BkXbowPsbzzSjGBjIvDJxrsL0zRuNS/mCLq+mFLMcGpNXkO2MCgYEA5exr3Xh4DGHryX/fSOWbZfD8VJdhwmzGN1F5X0xkmIfC7+Wd9DsDbBJGhqhPiWP+fAo2V3IlVGTc5vO6C/XJ3kxnm+BhIim/5Uf3JWlWKU1TuGztSJk0jQMS52pSDS42gQ8gDdmzjHw3mitjd0anSg3rTrwqQBHoDxbiFfbJ1jUCgYEA8J79WIOb74xO0fN1H1FFLF2UdoTS7l7Qel30gzSJW1c/EFm6v8lGoQHCAqcOKUMutgm0q6lRBgd58PcbnbRJ+77iTzcKx4r+Pq0Xe43/zjba3pspMJBTXTvuyor+GnHaHjlRWHgisESCobJM01Y/XOgtBm7HdCls93Nqc1PlCCECgYBNhIl8dhM5onKSqqnOCevNl6RM2QyYtA07m4H2O7Il0JqTNMiEUsrRuiCQOPN9etsjKp7Asv9s8UueCTy0ir+4ivjyul2l+coobePIbrWsBk6NHCzNqTdWwmIvzih/2dAlk3xHxqOWVKJGvaLyXLf6rsExlDTIWme6NIW3dtqHEg==
efc7237b-2cfd-4f8b-95fe-e455ef797180	557955df-963c-47e7-b845-8a29d2f793ef	certificate	MIICoTCCAYkCBgGeO7xdtTANBgkqhkiG9w0BAQsFADAUMRIwEAYDVQQDDAlpbnZlbnRvcnkwHhcNMjYwNTE4MTUzNjAxWhcNMzYwNTE4MTUzNzQxWjAUMRIwEAYDVQQDDAlpbnZlbnRvcnkwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDwTW+O+eq1tov2PZUNYfNMCAOyKHtw9dGGitzMcUo8ojqw0VMEuuEvq5MgEf6xur7pbtSSPBumvssEPeFYK/BJPNLdwT+di/qWeCFvT8isIUST1T62d2YgouGjy9IUJIUoO02JzxDfbUWHsdbEWM0Pu1fRZh1AXOuLLwd5sWqyclevjaVBni1KEc2Kdy/0b3wmk59LH2PQSBPAYjwAkbSgfB5RnZdgkz9rkg2IY25zAjtxS2mhzmsDVPEhMEJdCv8OxB8rvKSolzvnDc95NMiz38KTAAY+9A2tT5P19JzjIIVX+4ivCCukAIDJJGUjrZWdPsoWbgEx0dtcLvv7n3BdAgMBAAEwDQYJKoZIhvcNAQELBQADggEBABmLj6/SUqqzYHcyTDAQ0LAwY4LBPcijjQTlsDZIUT2+X6Xs60F+0LxAo0W4/e0MIZKy/CqykssP6txz3fZklvvzGgE5SPvHMkRxe3LWNozwq98SDwn7jx3n6ElGZS3dFM6/tF5g890CkK8XAEQNes1YE7tEgWs/brYU8dy+FKjSt6CoLZ9/AXASe2J2uzSkV+YMo8TtZ4+qhOFiJfBS/CJU4ITp0ma1/hQCDZLpH6jKc6JNQv3l9vOeQpbSvP/MTiRk1L6Wz/o1tX8HNVpb15wDNLEh0azVuYiQy0pIvM9DsiHvGQSUuPjcriucSt6P8BJpIXnTeuXgotWTs+PYOKU=
712f92b8-08e6-4001-8848-bd3f811716e5	610a97f8-d64b-4a62-a696-1c1a2c8924f9	kid	b9e00607-2507-4d06-9f6f-4075fc7a2d37
52ec96dc-1535-4f4e-92f0-906dc66f79aa	610a97f8-d64b-4a62-a696-1c1a2c8924f9	secret	CxRDnFvlhcqCsY6C7ZKsNTc0Kz2_nKfhZkPom_lAY1L144icVlEwcYrjr9Yi9Aw71DFQE1flFTBCGfjEac5nVXE9UFAhO3bBwP68KWQynBD4jXvkypU3V7gPjAclUiLkngQHii79U0qKsEiUpc-NJ13MWDHF5QN68NONHo_egqU
25b6837a-2a27-4e28-abb8-935e393a0dfc	610a97f8-d64b-4a62-a696-1c1a2c8924f9	algorithm	HS512
b2657aeb-7b73-47b7-8c7d-ed66b4396135	610a97f8-d64b-4a62-a696-1c1a2c8924f9	priority	100
19ee2f6d-84d2-4e07-a205-6421139c4c5b	06f5d376-101a-4324-9358-7a16970f21a6	secret	yEYhXTwqQPV6s5wbWHOQsA
5301366e-4958-48c9-a4f4-eb273e01efa6	06f5d376-101a-4324-9358-7a16970f21a6	priority	100
8a8dba8d-e14c-43aa-87f9-df162c0b5492	06f5d376-101a-4324-9358-7a16970f21a6	kid	ce14ad56-fa1a-41a5-87f9-180d268bfc18
fbca124b-0d06-41e9-8ef4-0e58dfb9baa1	a79ed3a7-1ea0-464c-9082-5ffe9c66643d	max-clients	200
34a1d9c5-0b4d-463a-bfd0-c5d42a3e9f12	dc783e3b-bb09-4449-9957-bf5ebadd5c6d	allow-default-scopes	true
05026257-ef8c-46b8-9d03-e8dd1a88b1a3	87b0bd94-c935-4284-95ba-a1c6702c94bd	allow-default-scopes	true
8a88f596-45be-4371-8af5-a79c5d1e06af	d7b7e9c2-7cfc-4534-99ec-8f0076591a5a	allowed-protocol-mapper-types	saml-user-property-mapper
679905f8-63cc-45cf-94bd-9689f90f3d3a	d7b7e9c2-7cfc-4534-99ec-8f0076591a5a	allowed-protocol-mapper-types	saml-user-attribute-mapper
c982f790-6864-4f85-84fc-e96306109d7d	d7b7e9c2-7cfc-4534-99ec-8f0076591a5a	allowed-protocol-mapper-types	oidc-full-name-mapper
2b70579b-59ae-4385-919f-1502851a4e81	d7b7e9c2-7cfc-4534-99ec-8f0076591a5a	allowed-protocol-mapper-types	oidc-usermodel-property-mapper
b432f2a3-9429-429a-af1a-681f372403df	d7b7e9c2-7cfc-4534-99ec-8f0076591a5a	allowed-protocol-mapper-types	saml-role-list-mapper
ecb0e12e-4c2e-44ea-a2a9-0db4057975aa	d7b7e9c2-7cfc-4534-99ec-8f0076591a5a	allowed-protocol-mapper-types	oidc-address-mapper
35f8cf93-6c3e-4b07-af80-fa222b08d127	d7b7e9c2-7cfc-4534-99ec-8f0076591a5a	allowed-protocol-mapper-types	oidc-sha256-pairwise-sub-mapper
8df75574-1551-417a-84c1-0d07cb16eab6	d7b7e9c2-7cfc-4534-99ec-8f0076591a5a	allowed-protocol-mapper-types	oidc-usermodel-attribute-mapper
9d16afca-e02e-4f52-93e9-ddff034945f0	a7f4d525-d178-4753-a52e-991f2442e40a	allowed-protocol-mapper-types	oidc-usermodel-property-mapper
9ca1df71-9946-436f-8cea-d0b1da8378f4	a7f4d525-d178-4753-a52e-991f2442e40a	allowed-protocol-mapper-types	oidc-full-name-mapper
7236a995-3295-4401-a58d-8e5d06fe355c	a7f4d525-d178-4753-a52e-991f2442e40a	allowed-protocol-mapper-types	saml-role-list-mapper
5919d752-7187-4a17-ae46-5e59defb156d	a7f4d525-d178-4753-a52e-991f2442e40a	allowed-protocol-mapper-types	oidc-usermodel-attribute-mapper
c916197b-28d5-453c-b2a5-bc0554cebee9	a7f4d525-d178-4753-a52e-991f2442e40a	allowed-protocol-mapper-types	oidc-address-mapper
69face52-3ce1-49dd-a6cb-2d7b7b079adb	a7f4d525-d178-4753-a52e-991f2442e40a	allowed-protocol-mapper-types	oidc-sha256-pairwise-sub-mapper
44ba2b27-1bc1-4fd0-9dee-3be1adee7495	a7f4d525-d178-4753-a52e-991f2442e40a	allowed-protocol-mapper-types	saml-user-attribute-mapper
d05f1b5f-ad3d-4db6-8222-a3290f6416d3	a7f4d525-d178-4753-a52e-991f2442e40a	allowed-protocol-mapper-types	saml-user-property-mapper
4140f3bc-7a2a-4a50-bcd3-3c7dabe5f645	fb56805d-e56b-476a-9517-fbcf01aaf292	host-sending-registration-request-must-match	true
58039ff6-2afe-4365-b621-4c6cfd9766c5	fb56805d-e56b-476a-9517-fbcf01aaf292	client-uris-must-match	true
\.


--
-- Data for Name: composite_role; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.composite_role (composite, child_role) FROM stdin;
22e059c4-7274-4727-83e7-39668b9d6116	97c1b682-ef01-4069-81e6-a9b9481cba0e
22e059c4-7274-4727-83e7-39668b9d6116	489d7b83-4467-43d4-8a78-f889e8bbf782
22e059c4-7274-4727-83e7-39668b9d6116	317031bc-caae-4919-87fc-5c8ba1145d5e
22e059c4-7274-4727-83e7-39668b9d6116	b2c09e84-7fb0-4fb4-9fe0-219a91531554
22e059c4-7274-4727-83e7-39668b9d6116	f9e73488-fc78-42e5-ad4a-9a4b17778909
22e059c4-7274-4727-83e7-39668b9d6116	83b250c1-5723-49dc-961d-461035290f06
22e059c4-7274-4727-83e7-39668b9d6116	6d8e55a1-c72e-48c8-bf8c-58d3e476fad1
22e059c4-7274-4727-83e7-39668b9d6116	3222d960-d083-4315-ba7a-f4946ccc2f77
22e059c4-7274-4727-83e7-39668b9d6116	6cad8eab-7c93-42f1-9802-8f422f429899
22e059c4-7274-4727-83e7-39668b9d6116	45329bda-d7e2-44de-82a7-91115e6bcd9b
22e059c4-7274-4727-83e7-39668b9d6116	5eb57921-276c-4835-8bb0-0583e46850d3
22e059c4-7274-4727-83e7-39668b9d6116	6ca8f6e6-1ebd-44a4-a4c7-0f1a7d586777
22e059c4-7274-4727-83e7-39668b9d6116	fda81a04-5c96-4153-af21-cc99c91fb006
22e059c4-7274-4727-83e7-39668b9d6116	2ab539f5-c4ff-4d20-9cc5-11eb4517b8da
22e059c4-7274-4727-83e7-39668b9d6116	4084cb54-df5e-44aa-abaf-5e3042cd339f
22e059c4-7274-4727-83e7-39668b9d6116	15a98445-c7ea-406f-ae72-b01b093a3e85
22e059c4-7274-4727-83e7-39668b9d6116	006a0fb2-a269-4ff0-8442-355b49e42276
22e059c4-7274-4727-83e7-39668b9d6116	9d601442-3b71-425e-a29d-bcf8f3dc6519
b2c09e84-7fb0-4fb4-9fe0-219a91531554	9d601442-3b71-425e-a29d-bcf8f3dc6519
b2c09e84-7fb0-4fb4-9fe0-219a91531554	4084cb54-df5e-44aa-abaf-5e3042cd339f
f9e73488-fc78-42e5-ad4a-9a4b17778909	15a98445-c7ea-406f-ae72-b01b093a3e85
fa7c5b60-9c57-4078-9005-5d917953aac8	47eb67fc-ae78-444b-ab5d-6141636b54a8
fa7c5b60-9c57-4078-9005-5d917953aac8	706f5a97-24be-434c-b7ed-f36cbfc9c011
706f5a97-24be-434c-b7ed-f36cbfc9c011	00853ab2-a5d4-433a-a72d-51f65fedfa9d
8c6d8001-ffdc-4361-91cc-51e760c6ed97	4be6b85d-e7fb-4a82-9d91-1a16298ec308
22e059c4-7274-4727-83e7-39668b9d6116	66f9c1c2-cde8-434f-9fa2-c88b1342e52c
fa7c5b60-9c57-4078-9005-5d917953aac8	d737b4b1-a6bd-4e9c-aaf7-4041ec0082b9
fa7c5b60-9c57-4078-9005-5d917953aac8	7c012943-0b3d-4314-a2de-2149939df504
22e059c4-7274-4727-83e7-39668b9d6116	2ed72307-17f4-4ed1-8edd-52a8835654ef
22e059c4-7274-4727-83e7-39668b9d6116	1ed7b518-a9f5-4bfd-83ff-bcdc6427d239
22e059c4-7274-4727-83e7-39668b9d6116	2002605b-6da0-4a63-918a-d8448313cff7
22e059c4-7274-4727-83e7-39668b9d6116	ff8e3756-2b6b-401a-8fdf-f7f493f1c566
22e059c4-7274-4727-83e7-39668b9d6116	3583eabb-791f-4771-9b7e-43714dad6b45
22e059c4-7274-4727-83e7-39668b9d6116	d2598ca7-3992-42be-9761-622e022618da
22e059c4-7274-4727-83e7-39668b9d6116	0fc9ec6a-8ec8-4569-a0b7-42d57e918c83
22e059c4-7274-4727-83e7-39668b9d6116	dab18e0a-d6b1-4d09-961b-6ec32b77cf03
22e059c4-7274-4727-83e7-39668b9d6116	d3178e1f-f0ab-4196-aae6-6f8d4fe091fc
22e059c4-7274-4727-83e7-39668b9d6116	c9def11c-e71f-4b43-a7e5-5462f72741a9
22e059c4-7274-4727-83e7-39668b9d6116	85d6e6bb-785f-4068-8491-daaa6b07d593
22e059c4-7274-4727-83e7-39668b9d6116	af7bc791-530a-4f82-a9a2-6edf074f9601
22e059c4-7274-4727-83e7-39668b9d6116	46c85d95-b071-465b-a830-1e005c62834e
22e059c4-7274-4727-83e7-39668b9d6116	d7062474-2755-415a-82a9-6b6535d9714d
22e059c4-7274-4727-83e7-39668b9d6116	db51de87-f3a6-474e-bae2-2c9c328d5ffb
22e059c4-7274-4727-83e7-39668b9d6116	ef745fb3-100a-4c1d-a4ee-bdf9a346fdc4
22e059c4-7274-4727-83e7-39668b9d6116	84df03d6-c73e-4b96-9a0f-276f1ee3ff78
2002605b-6da0-4a63-918a-d8448313cff7	d7062474-2755-415a-82a9-6b6535d9714d
2002605b-6da0-4a63-918a-d8448313cff7	84df03d6-c73e-4b96-9a0f-276f1ee3ff78
ff8e3756-2b6b-401a-8fdf-f7f493f1c566	db51de87-f3a6-474e-bae2-2c9c328d5ffb
dbad86a3-354e-47dd-bc04-191ea51598c4	5ce68e24-3df8-4c69-9041-f55884053691
dbad86a3-354e-47dd-bc04-191ea51598c4	4cdca85c-394c-471b-8e10-27c57252bf7b
dbad86a3-354e-47dd-bc04-191ea51598c4	75e7b6a4-5938-433d-a26b-58f393a6b2eb
dbad86a3-354e-47dd-bc04-191ea51598c4	6089c606-bc83-4a4d-9018-9512951fd516
dbad86a3-354e-47dd-bc04-191ea51598c4	c87be5c2-2489-4984-b12b-7d8007538dcd
dbad86a3-354e-47dd-bc04-191ea51598c4	5fc08bb7-fb12-470a-97f8-3f27c1adb0bd
dbad86a3-354e-47dd-bc04-191ea51598c4	4520ec7f-72d1-4860-b2f4-6e0db13c907c
dbad86a3-354e-47dd-bc04-191ea51598c4	675acd12-1884-468d-aed8-5220e8cba60e
dbad86a3-354e-47dd-bc04-191ea51598c4	5f45979b-0d24-4680-90d1-58ce9cb0917b
dbad86a3-354e-47dd-bc04-191ea51598c4	d6d98e00-f7ba-4925-ba1c-327b45de279d
dbad86a3-354e-47dd-bc04-191ea51598c4	a3ac365f-8814-40d6-8c4f-82f06d860a43
dbad86a3-354e-47dd-bc04-191ea51598c4	a9888621-dc08-4400-81ba-27bd16a4b1b9
dbad86a3-354e-47dd-bc04-191ea51598c4	c81c1eac-eb05-4524-8acd-cd03cc701f3e
dbad86a3-354e-47dd-bc04-191ea51598c4	c937b333-932b-4bbe-9a4d-0da3ca48c983
dbad86a3-354e-47dd-bc04-191ea51598c4	f5c2899d-6f8b-45f4-96b6-024f75ca2586
dbad86a3-354e-47dd-bc04-191ea51598c4	a8d1b454-ab2a-4726-8d6e-cccdedf8930f
dbad86a3-354e-47dd-bc04-191ea51598c4	40a40f54-d08e-4f25-83e4-1c9f33d70a33
57259c62-3a25-49de-8783-6266b70da763	dec0c118-2ab8-4795-9c41-9dd641064125
6089c606-bc83-4a4d-9018-9512951fd516	f5c2899d-6f8b-45f4-96b6-024f75ca2586
75e7b6a4-5938-433d-a26b-58f393a6b2eb	40a40f54-d08e-4f25-83e4-1c9f33d70a33
75e7b6a4-5938-433d-a26b-58f393a6b2eb	c937b333-932b-4bbe-9a4d-0da3ca48c983
57259c62-3a25-49de-8783-6266b70da763	b483f57e-3b13-4eb3-be6e-4afd09933af0
b483f57e-3b13-4eb3-be6e-4afd09933af0	7fa4c3b2-a2ba-4f2c-aeba-cf1d1cf7ca52
15e06fff-36f5-47d8-a6ea-9e41384933f3	fdab071a-b892-4324-bccf-db91adb14883
22e059c4-7274-4727-83e7-39668b9d6116	55d89044-e68b-4707-a2e3-51cd0d9896d9
dbad86a3-354e-47dd-bc04-191ea51598c4	71feae85-acca-40ce-a7c9-3b39128f5389
57259c62-3a25-49de-8783-6266b70da763	276c902b-cc02-4db0-87be-ea9876a02ac7
57259c62-3a25-49de-8783-6266b70da763	a457f4bf-0cad-48d3-9560-5e057d2ecb74
\.


--
-- Data for Name: credential; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.credential (id, salt, type, user_id, created_date, user_label, secret_data, credential_data, priority) FROM stdin;
41cf9c60-2e0a-43ff-95f0-b126bfb25b26	\N	password	544a8207-60cb-49fc-abc2-5931698254f3	1779118660743	\N	{"value":"8XFXr77R5LB5mxqIwSbAgQKIFkw2k3LZh6sko+9bnrY=","salt":"hx1bpLivKdfTrplZNz9TPw==","additionalParameters":{}}	{"hashIterations":5,"algorithm":"argon2","additionalParameters":{"hashLength":["32"],"memory":["7168"],"type":["id"],"version":["1.3"],"parallelism":["1"]}}	10
ac8777f4-a290-45a8-adeb-b2214f095d74	\N	password	b3faedcf-50a2-44d4-80b8-9453e0e6d7dc	1779118660787	\N	{"value":"OKdxbvdeovrKHSongYMioOciV57YGqayeonNxDfAR6k=","salt":"yqOkMoSPFBOXVydQUQ/acA==","additionalParameters":{}}	{"hashIterations":5,"algorithm":"argon2","additionalParameters":{"hashLength":["32"],"memory":["7168"],"type":["id"],"version":["1.3"],"parallelism":["1"]}}	10
1d3ac8d0-ce9e-46b6-87a5-7be88db2ef15	\N	password	568a5798-7e06-40b8-b3cf-be6983c00ee9	1779118660821	\N	{"value":"VSWDgZCoDzywNjh7EmyJxBP8tNvOtvhnBVS44ONY3/s=","salt":"Kxd7xEPhDYexvO9dMOu/CQ==","additionalParameters":{}}	{"hashIterations":5,"algorithm":"argon2","additionalParameters":{"hashLength":["32"],"memory":["7168"],"type":["id"],"version":["1.3"],"parallelism":["1"]}}	10
988cd759-1077-4df0-b929-934d6d6187b9	\N	password	223e0276-43e7-40d2-92d6-f85d0f93291a	1779118661384	\N	{"value":"TmDD5tcgLUn4aobEqrtSY8Q1Trv1ekBDgxB5py+/hoU=","salt":"zZu1kjulMFSBjq6EAUsiTQ==","additionalParameters":{}}	{"hashIterations":5,"algorithm":"argon2","additionalParameters":{"hashLength":["32"],"memory":["7168"],"type":["id"],"version":["1.3"],"parallelism":["1"]}}	10
e528b121-17a3-41b3-8807-0c47c1afcee9	\N	password	43f03a98-d9e1-4bb1-a690-f1cef899f982	1779137417326	\N	{"value":"PihLUh5uWZdmdyY2q58zHnily3OvRb8t6fYh8GkA7xY=","salt":"Y5Wf1Peh+pVu7m45Kyyhqg==","additionalParameters":{}}	{"hashIterations":5,"algorithm":"argon2","additionalParameters":{"hashLength":["32"],"memory":["7168"],"type":["id"],"version":["1.3"],"parallelism":["1"]}}	10
62bfe19d-b88d-4312-93fb-4dd020c600a6	\N	password	ecd2616f-6d85-4591-b516-71039f42aa07	1779137890033	\N	{"value":"jg3mEffq+JdygAZ22ROOhG7dhZX1jdr/ajK2NV5aBio=","salt":"puzouCKiHnE/K5szKu0p+A==","additionalParameters":{}}	{"hashIterations":5,"algorithm":"argon2","additionalParameters":{"hashLength":["32"],"memory":["7168"],"type":["id"],"version":["1.3"],"parallelism":["1"]}}	10
\.


--
-- Data for Name: databasechangelog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.databasechangelog (id, author, filename, dateexecuted, orderexecuted, exectype, md5sum, description, comments, tag, liquibase, contexts, labels, deployment_id) FROM stdin;
1.0.0.Final-KEYCLOAK-5461	sthorger@redhat.com	META-INF/jpa-changelog-1.0.0.Final.xml	2026-05-18 15:37:36.497612	1	EXECUTED	9:6f1016664e21e16d26517a4418f5e3df	createTable tableName=APPLICATION_DEFAULT_ROLES; createTable tableName=CLIENT; createTable tableName=CLIENT_SESSION; createTable tableName=CLIENT_SESSION_ROLE; createTable tableName=COMPOSITE_ROLE; createTable tableName=CREDENTIAL; createTable tab...		\N	4.25.1	\N	\N	9118656144
1.0.0.Final-KEYCLOAK-5461	sthorger@redhat.com	META-INF/db2-jpa-changelog-1.0.0.Final.xml	2026-05-18 15:37:36.512022	2	MARK_RAN	9:828775b1596a07d1200ba1d49e5e3941	createTable tableName=APPLICATION_DEFAULT_ROLES; createTable tableName=CLIENT; createTable tableName=CLIENT_SESSION; createTable tableName=CLIENT_SESSION_ROLE; createTable tableName=COMPOSITE_ROLE; createTable tableName=CREDENTIAL; createTable tab...		\N	4.25.1	\N	\N	9118656144
1.1.0.Beta1	sthorger@redhat.com	META-INF/jpa-changelog-1.1.0.Beta1.xml	2026-05-18 15:37:36.561702	3	EXECUTED	9:5f090e44a7d595883c1fb61f4b41fd38	delete tableName=CLIENT_SESSION_ROLE; delete tableName=CLIENT_SESSION; delete tableName=USER_SESSION; createTable tableName=CLIENT_ATTRIBUTES; createTable tableName=CLIENT_SESSION_NOTE; createTable tableName=APP_NODE_REGISTRATIONS; addColumn table...		\N	4.25.1	\N	\N	9118656144
1.1.0.Final	sthorger@redhat.com	META-INF/jpa-changelog-1.1.0.Final.xml	2026-05-18 15:37:36.565941	4	EXECUTED	9:c07e577387a3d2c04d1adc9aaad8730e	renameColumn newColumnName=EVENT_TIME, oldColumnName=TIME, tableName=EVENT_ENTITY		\N	4.25.1	\N	\N	9118656144
1.2.0.Beta1	psilva@redhat.com	META-INF/jpa-changelog-1.2.0.Beta1.xml	2026-05-18 15:37:36.662662	5	EXECUTED	9:b68ce996c655922dbcd2fe6b6ae72686	delete tableName=CLIENT_SESSION_ROLE; delete tableName=CLIENT_SESSION_NOTE; delete tableName=CLIENT_SESSION; delete tableName=USER_SESSION; createTable tableName=PROTOCOL_MAPPER; createTable tableName=PROTOCOL_MAPPER_CONFIG; createTable tableName=...		\N	4.25.1	\N	\N	9118656144
1.2.0.Beta1	psilva@redhat.com	META-INF/db2-jpa-changelog-1.2.0.Beta1.xml	2026-05-18 15:37:36.666125	6	MARK_RAN	9:543b5c9989f024fe35c6f6c5a97de88e	delete tableName=CLIENT_SESSION_ROLE; delete tableName=CLIENT_SESSION_NOTE; delete tableName=CLIENT_SESSION; delete tableName=USER_SESSION; createTable tableName=PROTOCOL_MAPPER; createTable tableName=PROTOCOL_MAPPER_CONFIG; createTable tableName=...		\N	4.25.1	\N	\N	9118656144
1.2.0.RC1	bburke@redhat.com	META-INF/jpa-changelog-1.2.0.CR1.xml	2026-05-18 15:37:36.742777	7	EXECUTED	9:765afebbe21cf5bbca048e632df38336	delete tableName=CLIENT_SESSION_ROLE; delete tableName=CLIENT_SESSION_NOTE; delete tableName=CLIENT_SESSION; delete tableName=USER_SESSION_NOTE; delete tableName=USER_SESSION; createTable tableName=MIGRATION_MODEL; createTable tableName=IDENTITY_P...		\N	4.25.1	\N	\N	9118656144
1.2.0.RC1	bburke@redhat.com	META-INF/db2-jpa-changelog-1.2.0.CR1.xml	2026-05-18 15:37:36.746876	8	MARK_RAN	9:db4a145ba11a6fdaefb397f6dbf829a1	delete tableName=CLIENT_SESSION_ROLE; delete tableName=CLIENT_SESSION_NOTE; delete tableName=CLIENT_SESSION; delete tableName=USER_SESSION_NOTE; delete tableName=USER_SESSION; createTable tableName=MIGRATION_MODEL; createTable tableName=IDENTITY_P...		\N	4.25.1	\N	\N	9118656144
1.2.0.Final	keycloak	META-INF/jpa-changelog-1.2.0.Final.xml	2026-05-18 15:37:36.752909	9	EXECUTED	9:9d05c7be10cdb873f8bcb41bc3a8ab23	update tableName=CLIENT; update tableName=CLIENT; update tableName=CLIENT		\N	4.25.1	\N	\N	9118656144
1.3.0	bburke@redhat.com	META-INF/jpa-changelog-1.3.0.xml	2026-05-18 15:37:36.843248	10	EXECUTED	9:18593702353128d53111f9b1ff0b82b8	delete tableName=CLIENT_SESSION_ROLE; delete tableName=CLIENT_SESSION_PROT_MAPPER; delete tableName=CLIENT_SESSION_NOTE; delete tableName=CLIENT_SESSION; delete tableName=USER_SESSION_NOTE; delete tableName=USER_SESSION; createTable tableName=ADMI...		\N	4.25.1	\N	\N	9118656144
1.4.0	bburke@redhat.com	META-INF/jpa-changelog-1.4.0.xml	2026-05-18 15:37:36.889539	11	EXECUTED	9:6122efe5f090e41a85c0f1c9e52cbb62	delete tableName=CLIENT_SESSION_AUTH_STATUS; delete tableName=CLIENT_SESSION_ROLE; delete tableName=CLIENT_SESSION_PROT_MAPPER; delete tableName=CLIENT_SESSION_NOTE; delete tableName=CLIENT_SESSION; delete tableName=USER_SESSION_NOTE; delete table...		\N	4.25.1	\N	\N	9118656144
1.4.0	bburke@redhat.com	META-INF/db2-jpa-changelog-1.4.0.xml	2026-05-18 15:37:36.894928	12	MARK_RAN	9:e1ff28bf7568451453f844c5d54bb0b5	delete tableName=CLIENT_SESSION_AUTH_STATUS; delete tableName=CLIENT_SESSION_ROLE; delete tableName=CLIENT_SESSION_PROT_MAPPER; delete tableName=CLIENT_SESSION_NOTE; delete tableName=CLIENT_SESSION; delete tableName=USER_SESSION_NOTE; delete table...		\N	4.25.1	\N	\N	9118656144
1.5.0	bburke@redhat.com	META-INF/jpa-changelog-1.5.0.xml	2026-05-18 15:37:36.923917	13	EXECUTED	9:7af32cd8957fbc069f796b61217483fd	delete tableName=CLIENT_SESSION_AUTH_STATUS; delete tableName=CLIENT_SESSION_ROLE; delete tableName=CLIENT_SESSION_PROT_MAPPER; delete tableName=CLIENT_SESSION_NOTE; delete tableName=CLIENT_SESSION; delete tableName=USER_SESSION_NOTE; delete table...		\N	4.25.1	\N	\N	9118656144
1.6.1_from15	mposolda@redhat.com	META-INF/jpa-changelog-1.6.1.xml	2026-05-18 15:37:36.939521	14	EXECUTED	9:6005e15e84714cd83226bf7879f54190	addColumn tableName=REALM; addColumn tableName=KEYCLOAK_ROLE; addColumn tableName=CLIENT; createTable tableName=OFFLINE_USER_SESSION; createTable tableName=OFFLINE_CLIENT_SESSION; addPrimaryKey constraintName=CONSTRAINT_OFFL_US_SES_PK2, tableName=...		\N	4.25.1	\N	\N	9118656144
1.6.1_from16-pre	mposolda@redhat.com	META-INF/jpa-changelog-1.6.1.xml	2026-05-18 15:37:36.941872	15	MARK_RAN	9:bf656f5a2b055d07f314431cae76f06c	delete tableName=OFFLINE_CLIENT_SESSION; delete tableName=OFFLINE_USER_SESSION		\N	4.25.1	\N	\N	9118656144
1.6.1_from16	mposolda@redhat.com	META-INF/jpa-changelog-1.6.1.xml	2026-05-18 15:37:36.944372	16	MARK_RAN	9:f8dadc9284440469dcf71e25ca6ab99b	dropPrimaryKey constraintName=CONSTRAINT_OFFLINE_US_SES_PK, tableName=OFFLINE_USER_SESSION; dropPrimaryKey constraintName=CONSTRAINT_OFFLINE_CL_SES_PK, tableName=OFFLINE_CLIENT_SESSION; addColumn tableName=OFFLINE_USER_SESSION; update tableName=OF...		\N	4.25.1	\N	\N	9118656144
1.6.1	mposolda@redhat.com	META-INF/jpa-changelog-1.6.1.xml	2026-05-18 15:37:36.9467	17	EXECUTED	9:d41d8cd98f00b204e9800998ecf8427e	empty		\N	4.25.1	\N	\N	9118656144
1.7.0	bburke@redhat.com	META-INF/jpa-changelog-1.7.0.xml	2026-05-18 15:37:36.998883	18	EXECUTED	9:3368ff0be4c2855ee2dd9ca813b38d8e	createTable tableName=KEYCLOAK_GROUP; createTable tableName=GROUP_ROLE_MAPPING; createTable tableName=GROUP_ATTRIBUTE; createTable tableName=USER_GROUP_MEMBERSHIP; createTable tableName=REALM_DEFAULT_GROUPS; addColumn tableName=IDENTITY_PROVIDER; ...		\N	4.25.1	\N	\N	9118656144
1.8.0	mposolda@redhat.com	META-INF/jpa-changelog-1.8.0.xml	2026-05-18 15:37:37.048154	19	EXECUTED	9:8ac2fb5dd030b24c0570a763ed75ed20	addColumn tableName=IDENTITY_PROVIDER; createTable tableName=CLIENT_TEMPLATE; createTable tableName=CLIENT_TEMPLATE_ATTRIBUTES; createTable tableName=TEMPLATE_SCOPE_MAPPING; dropNotNullConstraint columnName=CLIENT_ID, tableName=PROTOCOL_MAPPER; ad...		\N	4.25.1	\N	\N	9118656144
1.8.0-2	keycloak	META-INF/jpa-changelog-1.8.0.xml	2026-05-18 15:37:37.054511	20	EXECUTED	9:f91ddca9b19743db60e3057679810e6c	dropDefaultValue columnName=ALGORITHM, tableName=CREDENTIAL; update tableName=CREDENTIAL		\N	4.25.1	\N	\N	9118656144
1.8.0	mposolda@redhat.com	META-INF/db2-jpa-changelog-1.8.0.xml	2026-05-18 15:37:37.059616	21	MARK_RAN	9:831e82914316dc8a57dc09d755f23c51	addColumn tableName=IDENTITY_PROVIDER; createTable tableName=CLIENT_TEMPLATE; createTable tableName=CLIENT_TEMPLATE_ATTRIBUTES; createTable tableName=TEMPLATE_SCOPE_MAPPING; dropNotNullConstraint columnName=CLIENT_ID, tableName=PROTOCOL_MAPPER; ad...		\N	4.25.1	\N	\N	9118656144
1.8.0-2	keycloak	META-INF/db2-jpa-changelog-1.8.0.xml	2026-05-18 15:37:37.063826	22	MARK_RAN	9:f91ddca9b19743db60e3057679810e6c	dropDefaultValue columnName=ALGORITHM, tableName=CREDENTIAL; update tableName=CREDENTIAL		\N	4.25.1	\N	\N	9118656144
1.9.0	mposolda@redhat.com	META-INF/jpa-changelog-1.9.0.xml	2026-05-18 15:37:37.105685	23	EXECUTED	9:bc3d0f9e823a69dc21e23e94c7a94bb1	update tableName=REALM; update tableName=REALM; update tableName=REALM; update tableName=REALM; update tableName=CREDENTIAL; update tableName=CREDENTIAL; update tableName=CREDENTIAL; update tableName=REALM; update tableName=REALM; customChange; dr...		\N	4.25.1	\N	\N	9118656144
1.9.1	keycloak	META-INF/jpa-changelog-1.9.1.xml	2026-05-18 15:37:37.11388	24	EXECUTED	9:c9999da42f543575ab790e76439a2679	modifyDataType columnName=PRIVATE_KEY, tableName=REALM; modifyDataType columnName=PUBLIC_KEY, tableName=REALM; modifyDataType columnName=CERTIFICATE, tableName=REALM		\N	4.25.1	\N	\N	9118656144
1.9.1	keycloak	META-INF/db2-jpa-changelog-1.9.1.xml	2026-05-18 15:37:37.116191	25	MARK_RAN	9:0d6c65c6f58732d81569e77b10ba301d	modifyDataType columnName=PRIVATE_KEY, tableName=REALM; modifyDataType columnName=CERTIFICATE, tableName=REALM		\N	4.25.1	\N	\N	9118656144
1.9.2	keycloak	META-INF/jpa-changelog-1.9.2.xml	2026-05-18 15:37:37.137714	26	EXECUTED	9:fc576660fc016ae53d2d4778d84d86d0	createIndex indexName=IDX_USER_EMAIL, tableName=USER_ENTITY; createIndex indexName=IDX_USER_ROLE_MAPPING, tableName=USER_ROLE_MAPPING; createIndex indexName=IDX_USER_GROUP_MAPPING, tableName=USER_GROUP_MEMBERSHIP; createIndex indexName=IDX_USER_CO...		\N	4.25.1	\N	\N	9118656144
authz-2.0.0	psilva@redhat.com	META-INF/jpa-changelog-authz-2.0.0.xml	2026-05-18 15:37:37.199381	27	EXECUTED	9:43ed6b0da89ff77206289e87eaa9c024	createTable tableName=RESOURCE_SERVER; addPrimaryKey constraintName=CONSTRAINT_FARS, tableName=RESOURCE_SERVER; addUniqueConstraint constraintName=UK_AU8TT6T700S9V50BU18WS5HA6, tableName=RESOURCE_SERVER; createTable tableName=RESOURCE_SERVER_RESOU...		\N	4.25.1	\N	\N	9118656144
authz-2.5.1	psilva@redhat.com	META-INF/jpa-changelog-authz-2.5.1.xml	2026-05-18 15:37:37.202869	28	EXECUTED	9:44bae577f551b3738740281eceb4ea70	update tableName=RESOURCE_SERVER_POLICY		\N	4.25.1	\N	\N	9118656144
2.1.0-KEYCLOAK-5461	bburke@redhat.com	META-INF/jpa-changelog-2.1.0.xml	2026-05-18 15:37:37.242645	29	EXECUTED	9:bd88e1f833df0420b01e114533aee5e8	createTable tableName=BROKER_LINK; createTable tableName=FED_USER_ATTRIBUTE; createTable tableName=FED_USER_CONSENT; createTable tableName=FED_USER_CONSENT_ROLE; createTable tableName=FED_USER_CONSENT_PROT_MAPPER; createTable tableName=FED_USER_CR...		\N	4.25.1	\N	\N	9118656144
2.2.0	bburke@redhat.com	META-INF/jpa-changelog-2.2.0.xml	2026-05-18 15:37:37.2512	30	EXECUTED	9:a7022af5267f019d020edfe316ef4371	addColumn tableName=ADMIN_EVENT_ENTITY; createTable tableName=CREDENTIAL_ATTRIBUTE; createTable tableName=FED_CREDENTIAL_ATTRIBUTE; modifyDataType columnName=VALUE, tableName=CREDENTIAL; addForeignKeyConstraint baseTableName=FED_CREDENTIAL_ATTRIBU...		\N	4.25.1	\N	\N	9118656144
2.3.0	bburke@redhat.com	META-INF/jpa-changelog-2.3.0.xml	2026-05-18 15:37:37.266713	31	EXECUTED	9:fc155c394040654d6a79227e56f5e25a	createTable tableName=FEDERATED_USER; addPrimaryKey constraintName=CONSTR_FEDERATED_USER, tableName=FEDERATED_USER; dropDefaultValue columnName=TOTP, tableName=USER_ENTITY; dropColumn columnName=TOTP, tableName=USER_ENTITY; addColumn tableName=IDE...		\N	4.25.1	\N	\N	9118656144
2.4.0	bburke@redhat.com	META-INF/jpa-changelog-2.4.0.xml	2026-05-18 15:37:37.27292	32	EXECUTED	9:eac4ffb2a14795e5dc7b426063e54d88	customChange		\N	4.25.1	\N	\N	9118656144
2.5.0	bburke@redhat.com	META-INF/jpa-changelog-2.5.0.xml	2026-05-18 15:37:37.282344	33	EXECUTED	9:54937c05672568c4c64fc9524c1e9462	customChange; modifyDataType columnName=USER_ID, tableName=OFFLINE_USER_SESSION		\N	4.25.1	\N	\N	9118656144
2.5.0-unicode-oracle	hmlnarik@redhat.com	META-INF/jpa-changelog-2.5.0.xml	2026-05-18 15:37:37.285271	34	MARK_RAN	9:3a32bace77c84d7678d035a7f5a8084e	modifyDataType columnName=DESCRIPTION, tableName=AUTHENTICATION_FLOW; modifyDataType columnName=DESCRIPTION, tableName=CLIENT_TEMPLATE; modifyDataType columnName=DESCRIPTION, tableName=RESOURCE_SERVER_POLICY; modifyDataType columnName=DESCRIPTION,...		\N	4.25.1	\N	\N	9118656144
2.5.0-unicode-other-dbs	hmlnarik@redhat.com	META-INF/jpa-changelog-2.5.0.xml	2026-05-18 15:37:37.312819	35	EXECUTED	9:33d72168746f81f98ae3a1e8e0ca3554	modifyDataType columnName=DESCRIPTION, tableName=AUTHENTICATION_FLOW; modifyDataType columnName=DESCRIPTION, tableName=CLIENT_TEMPLATE; modifyDataType columnName=DESCRIPTION, tableName=RESOURCE_SERVER_POLICY; modifyDataType columnName=DESCRIPTION,...		\N	4.25.1	\N	\N	9118656144
2.5.0-duplicate-email-support	slawomir@dabek.name	META-INF/jpa-changelog-2.5.0.xml	2026-05-18 15:37:37.320126	36	EXECUTED	9:61b6d3d7a4c0e0024b0c839da283da0c	addColumn tableName=REALM		\N	4.25.1	\N	\N	9118656144
2.5.0-unique-group-names	hmlnarik@redhat.com	META-INF/jpa-changelog-2.5.0.xml	2026-05-18 15:37:37.324629	37	EXECUTED	9:8dcac7bdf7378e7d823cdfddebf72fda	addUniqueConstraint constraintName=SIBLING_NAMES, tableName=KEYCLOAK_GROUP		\N	4.25.1	\N	\N	9118656144
2.5.1	bburke@redhat.com	META-INF/jpa-changelog-2.5.1.xml	2026-05-18 15:37:37.327727	38	EXECUTED	9:a2b870802540cb3faa72098db5388af3	addColumn tableName=FED_USER_CONSENT		\N	4.25.1	\N	\N	9118656144
3.0.0	bburke@redhat.com	META-INF/jpa-changelog-3.0.0.xml	2026-05-18 15:37:37.330535	39	EXECUTED	9:132a67499ba24bcc54fb5cbdcfe7e4c0	addColumn tableName=IDENTITY_PROVIDER		\N	4.25.1	\N	\N	9118656144
3.2.0-fix	keycloak	META-INF/jpa-changelog-3.2.0.xml	2026-05-18 15:37:37.331563	40	MARK_RAN	9:938f894c032f5430f2b0fafb1a243462	addNotNullConstraint columnName=REALM_ID, tableName=CLIENT_INITIAL_ACCESS		\N	4.25.1	\N	\N	9118656144
3.2.0-fix-with-keycloak-5416	keycloak	META-INF/jpa-changelog-3.2.0.xml	2026-05-18 15:37:37.333328	41	MARK_RAN	9:845c332ff1874dc5d35974b0babf3006	dropIndex indexName=IDX_CLIENT_INIT_ACC_REALM, tableName=CLIENT_INITIAL_ACCESS; addNotNullConstraint columnName=REALM_ID, tableName=CLIENT_INITIAL_ACCESS; createIndex indexName=IDX_CLIENT_INIT_ACC_REALM, tableName=CLIENT_INITIAL_ACCESS		\N	4.25.1	\N	\N	9118656144
3.2.0-fix-offline-sessions	hmlnarik	META-INF/jpa-changelog-3.2.0.xml	2026-05-18 15:37:37.338869	42	EXECUTED	9:fc86359c079781adc577c5a217e4d04c	customChange		\N	4.25.1	\N	\N	9118656144
3.2.0-fixed	keycloak	META-INF/jpa-changelog-3.2.0.xml	2026-05-18 15:37:37.375263	43	EXECUTED	9:59a64800e3c0d09b825f8a3b444fa8f4	addColumn tableName=REALM; dropPrimaryKey constraintName=CONSTRAINT_OFFL_CL_SES_PK2, tableName=OFFLINE_CLIENT_SESSION; dropColumn columnName=CLIENT_SESSION_ID, tableName=OFFLINE_CLIENT_SESSION; addPrimaryKey constraintName=CONSTRAINT_OFFL_CL_SES_P...		\N	4.25.1	\N	\N	9118656144
3.3.0	keycloak	META-INF/jpa-changelog-3.3.0.xml	2026-05-18 15:37:37.379345	44	EXECUTED	9:d48d6da5c6ccf667807f633fe489ce88	addColumn tableName=USER_ENTITY		\N	4.25.1	\N	\N	9118656144
authz-3.4.0.CR1-resource-server-pk-change-part1	glavoie@gmail.com	META-INF/jpa-changelog-authz-3.4.0.CR1.xml	2026-05-18 15:37:37.382893	45	EXECUTED	9:dde36f7973e80d71fceee683bc5d2951	addColumn tableName=RESOURCE_SERVER_POLICY; addColumn tableName=RESOURCE_SERVER_RESOURCE; addColumn tableName=RESOURCE_SERVER_SCOPE		\N	4.25.1	\N	\N	9118656144
authz-3.4.0.CR1-resource-server-pk-change-part2-KEYCLOAK-6095	hmlnarik@redhat.com	META-INF/jpa-changelog-authz-3.4.0.CR1.xml	2026-05-18 15:37:37.387192	46	EXECUTED	9:b855e9b0a406b34fa323235a0cf4f640	customChange		\N	4.25.1	\N	\N	9118656144
authz-3.4.0.CR1-resource-server-pk-change-part3-fixed	glavoie@gmail.com	META-INF/jpa-changelog-authz-3.4.0.CR1.xml	2026-05-18 15:37:37.388155	47	MARK_RAN	9:51abbacd7b416c50c4421a8cabf7927e	dropIndex indexName=IDX_RES_SERV_POL_RES_SERV, tableName=RESOURCE_SERVER_POLICY; dropIndex indexName=IDX_RES_SRV_RES_RES_SRV, tableName=RESOURCE_SERVER_RESOURCE; dropIndex indexName=IDX_RES_SRV_SCOPE_RES_SRV, tableName=RESOURCE_SERVER_SCOPE		\N	4.25.1	\N	\N	9118656144
authz-3.4.0.CR1-resource-server-pk-change-part3-fixed-nodropindex	glavoie@gmail.com	META-INF/jpa-changelog-authz-3.4.0.CR1.xml	2026-05-18 15:37:37.402837	48	EXECUTED	9:bdc99e567b3398bac83263d375aad143	addNotNullConstraint columnName=RESOURCE_SERVER_CLIENT_ID, tableName=RESOURCE_SERVER_POLICY; addNotNullConstraint columnName=RESOURCE_SERVER_CLIENT_ID, tableName=RESOURCE_SERVER_RESOURCE; addNotNullConstraint columnName=RESOURCE_SERVER_CLIENT_ID, ...		\N	4.25.1	\N	\N	9118656144
authn-3.4.0.CR1-refresh-token-max-reuse	glavoie@gmail.com	META-INF/jpa-changelog-authz-3.4.0.CR1.xml	2026-05-18 15:37:37.405546	49	EXECUTED	9:d198654156881c46bfba39abd7769e69	addColumn tableName=REALM		\N	4.25.1	\N	\N	9118656144
3.4.0	keycloak	META-INF/jpa-changelog-3.4.0.xml	2026-05-18 15:37:37.421644	50	EXECUTED	9:cfdd8736332ccdd72c5256ccb42335db	addPrimaryKey constraintName=CONSTRAINT_REALM_DEFAULT_ROLES, tableName=REALM_DEFAULT_ROLES; addPrimaryKey constraintName=CONSTRAINT_COMPOSITE_ROLE, tableName=COMPOSITE_ROLE; addPrimaryKey constraintName=CONSTR_REALM_DEFAULT_GROUPS, tableName=REALM...		\N	4.25.1	\N	\N	9118656144
3.4.0-KEYCLOAK-5230	hmlnarik@redhat.com	META-INF/jpa-changelog-3.4.0.xml	2026-05-18 15:37:37.430409	51	EXECUTED	9:7c84de3d9bd84d7f077607c1a4dcb714	createIndex indexName=IDX_FU_ATTRIBUTE, tableName=FED_USER_ATTRIBUTE; createIndex indexName=IDX_FU_CONSENT, tableName=FED_USER_CONSENT; createIndex indexName=IDX_FU_CONSENT_RU, tableName=FED_USER_CONSENT; createIndex indexName=IDX_FU_CREDENTIAL, t...		\N	4.25.1	\N	\N	9118656144
3.4.1	psilva@redhat.com	META-INF/jpa-changelog-3.4.1.xml	2026-05-18 15:37:37.432306	52	EXECUTED	9:5a6bb36cbefb6a9d6928452c0852af2d	modifyDataType columnName=VALUE, tableName=CLIENT_ATTRIBUTES		\N	4.25.1	\N	\N	9118656144
3.4.2	keycloak	META-INF/jpa-changelog-3.4.2.xml	2026-05-18 15:37:37.434519	53	EXECUTED	9:8f23e334dbc59f82e0a328373ca6ced0	update tableName=REALM		\N	4.25.1	\N	\N	9118656144
3.4.2-KEYCLOAK-5172	mkanis@redhat.com	META-INF/jpa-changelog-3.4.2.xml	2026-05-18 15:37:37.437442	54	EXECUTED	9:9156214268f09d970cdf0e1564d866af	update tableName=CLIENT		\N	4.25.1	\N	\N	9118656144
4.0.0-KEYCLOAK-6335	bburke@redhat.com	META-INF/jpa-changelog-4.0.0.xml	2026-05-18 15:37:37.442341	55	EXECUTED	9:db806613b1ed154826c02610b7dbdf74	createTable tableName=CLIENT_AUTH_FLOW_BINDINGS; addPrimaryKey constraintName=C_CLI_FLOW_BIND, tableName=CLIENT_AUTH_FLOW_BINDINGS		\N	4.25.1	\N	\N	9118656144
4.0.0-CLEANUP-UNUSED-TABLE	bburke@redhat.com	META-INF/jpa-changelog-4.0.0.xml	2026-05-18 15:37:37.447648	56	EXECUTED	9:229a041fb72d5beac76bb94a5fa709de	dropTable tableName=CLIENT_IDENTITY_PROV_MAPPING		\N	4.25.1	\N	\N	9118656144
4.0.0-KEYCLOAK-6228	bburke@redhat.com	META-INF/jpa-changelog-4.0.0.xml	2026-05-18 15:37:37.463265	57	EXECUTED	9:079899dade9c1e683f26b2aa9ca6ff04	dropUniqueConstraint constraintName=UK_JKUWUVD56ONTGSUHOGM8UEWRT, tableName=USER_CONSENT; dropNotNullConstraint columnName=CLIENT_ID, tableName=USER_CONSENT; addColumn tableName=USER_CONSENT; addUniqueConstraint constraintName=UK_JKUWUVD56ONTGSUHO...		\N	4.25.1	\N	\N	9118656144
4.0.0-KEYCLOAK-5579-fixed	mposolda@redhat.com	META-INF/jpa-changelog-4.0.0.xml	2026-05-18 15:37:37.533424	58	EXECUTED	9:139b79bcbbfe903bb1c2d2a4dbf001d9	dropForeignKeyConstraint baseTableName=CLIENT_TEMPLATE_ATTRIBUTES, constraintName=FK_CL_TEMPL_ATTR_TEMPL; renameTable newTableName=CLIENT_SCOPE_ATTRIBUTES, oldTableName=CLIENT_TEMPLATE_ATTRIBUTES; renameColumn newColumnName=SCOPE_ID, oldColumnName...		\N	4.25.1	\N	\N	9118656144
authz-4.0.0.CR1	psilva@redhat.com	META-INF/jpa-changelog-authz-4.0.0.CR1.xml	2026-05-18 15:37:37.555303	59	EXECUTED	9:b55738ad889860c625ba2bf483495a04	createTable tableName=RESOURCE_SERVER_PERM_TICKET; addPrimaryKey constraintName=CONSTRAINT_FAPMT, tableName=RESOURCE_SERVER_PERM_TICKET; addForeignKeyConstraint baseTableName=RESOURCE_SERVER_PERM_TICKET, constraintName=FK_FRSRHO213XCX4WNKOG82SSPMT...		\N	4.25.1	\N	\N	9118656144
authz-4.0.0.Beta3	psilva@redhat.com	META-INF/jpa-changelog-authz-4.0.0.Beta3.xml	2026-05-18 15:37:37.559397	60	EXECUTED	9:e0057eac39aa8fc8e09ac6cfa4ae15fe	addColumn tableName=RESOURCE_SERVER_POLICY; addColumn tableName=RESOURCE_SERVER_PERM_TICKET; addForeignKeyConstraint baseTableName=RESOURCE_SERVER_PERM_TICKET, constraintName=FK_FRSRPO2128CX4WNKOG82SSRFY, referencedTableName=RESOURCE_SERVER_POLICY		\N	4.25.1	\N	\N	9118656144
authz-4.2.0.Final	mhajas@redhat.com	META-INF/jpa-changelog-authz-4.2.0.Final.xml	2026-05-18 15:37:37.565891	61	EXECUTED	9:42a33806f3a0443fe0e7feeec821326c	createTable tableName=RESOURCE_URIS; addForeignKeyConstraint baseTableName=RESOURCE_URIS, constraintName=FK_RESOURCE_SERVER_URIS, referencedTableName=RESOURCE_SERVER_RESOURCE; customChange; dropColumn columnName=URI, tableName=RESOURCE_SERVER_RESO...		\N	4.25.1	\N	\N	9118656144
authz-4.2.0.Final-KEYCLOAK-9944	hmlnarik@redhat.com	META-INF/jpa-changelog-authz-4.2.0.Final.xml	2026-05-18 15:37:37.568907	62	EXECUTED	9:9968206fca46eecc1f51db9c024bfe56	addPrimaryKey constraintName=CONSTRAINT_RESOUR_URIS_PK, tableName=RESOURCE_URIS		\N	4.25.1	\N	\N	9118656144
4.2.0-KEYCLOAK-6313	wadahiro@gmail.com	META-INF/jpa-changelog-4.2.0.xml	2026-05-18 15:37:37.570918	63	EXECUTED	9:92143a6daea0a3f3b8f598c97ce55c3d	addColumn tableName=REQUIRED_ACTION_PROVIDER		\N	4.25.1	\N	\N	9118656144
4.3.0-KEYCLOAK-7984	wadahiro@gmail.com	META-INF/jpa-changelog-4.3.0.xml	2026-05-18 15:37:37.572997	64	EXECUTED	9:82bab26a27195d889fb0429003b18f40	update tableName=REQUIRED_ACTION_PROVIDER		\N	4.25.1	\N	\N	9118656144
4.6.0-KEYCLOAK-7950	psilva@redhat.com	META-INF/jpa-changelog-4.6.0.xml	2026-05-18 15:37:37.575627	65	EXECUTED	9:e590c88ddc0b38b0ae4249bbfcb5abc3	update tableName=RESOURCE_SERVER_RESOURCE		\N	4.25.1	\N	\N	9118656144
4.6.0-KEYCLOAK-8377	keycloak	META-INF/jpa-changelog-4.6.0.xml	2026-05-18 15:37:37.580799	66	EXECUTED	9:5c1f475536118dbdc38d5d7977950cc0	createTable tableName=ROLE_ATTRIBUTE; addPrimaryKey constraintName=CONSTRAINT_ROLE_ATTRIBUTE_PK, tableName=ROLE_ATTRIBUTE; addForeignKeyConstraint baseTableName=ROLE_ATTRIBUTE, constraintName=FK_ROLE_ATTRIBUTE_ID, referencedTableName=KEYCLOAK_ROLE...		\N	4.25.1	\N	\N	9118656144
4.6.0-KEYCLOAK-8555	gideonray@gmail.com	META-INF/jpa-changelog-4.6.0.xml	2026-05-18 15:37:37.583677	67	EXECUTED	9:e7c9f5f9c4d67ccbbcc215440c718a17	createIndex indexName=IDX_COMPONENT_PROVIDER_TYPE, tableName=COMPONENT		\N	4.25.1	\N	\N	9118656144
4.7.0-KEYCLOAK-1267	sguilhen@redhat.com	META-INF/jpa-changelog-4.7.0.xml	2026-05-18 15:37:37.586441	68	EXECUTED	9:88e0bfdda924690d6f4e430c53447dd5	addColumn tableName=REALM		\N	4.25.1	\N	\N	9118656144
4.7.0-KEYCLOAK-7275	keycloak	META-INF/jpa-changelog-4.7.0.xml	2026-05-18 15:37:37.597885	69	EXECUTED	9:f53177f137e1c46b6a88c59ec1cb5218	renameColumn newColumnName=CREATED_ON, oldColumnName=LAST_SESSION_REFRESH, tableName=OFFLINE_USER_SESSION; addNotNullConstraint columnName=CREATED_ON, tableName=OFFLINE_USER_SESSION; addColumn tableName=OFFLINE_USER_SESSION; customChange; createIn...		\N	4.25.1	\N	\N	9118656144
4.8.0-KEYCLOAK-8835	sguilhen@redhat.com	META-INF/jpa-changelog-4.8.0.xml	2026-05-18 15:37:37.601846	70	EXECUTED	9:a74d33da4dc42a37ec27121580d1459f	addNotNullConstraint columnName=SSO_MAX_LIFESPAN_REMEMBER_ME, tableName=REALM; addNotNullConstraint columnName=SSO_IDLE_TIMEOUT_REMEMBER_ME, tableName=REALM		\N	4.25.1	\N	\N	9118656144
authz-7.0.0-KEYCLOAK-10443	psilva@redhat.com	META-INF/jpa-changelog-authz-7.0.0.xml	2026-05-18 15:37:37.604943	71	EXECUTED	9:fd4ade7b90c3b67fae0bfcfcb42dfb5f	addColumn tableName=RESOURCE_SERVER		\N	4.25.1	\N	\N	9118656144
8.0.0-adding-credential-columns	keycloak	META-INF/jpa-changelog-8.0.0.xml	2026-05-18 15:37:37.612156	72	EXECUTED	9:aa072ad090bbba210d8f18781b8cebf4	addColumn tableName=CREDENTIAL; addColumn tableName=FED_USER_CREDENTIAL		\N	4.25.1	\N	\N	9118656144
8.0.0-updating-credential-data-not-oracle-fixed	keycloak	META-INF/jpa-changelog-8.0.0.xml	2026-05-18 15:37:37.618866	73	EXECUTED	9:1ae6be29bab7c2aa376f6983b932be37	update tableName=CREDENTIAL; update tableName=CREDENTIAL; update tableName=CREDENTIAL; update tableName=FED_USER_CREDENTIAL; update tableName=FED_USER_CREDENTIAL; update tableName=FED_USER_CREDENTIAL		\N	4.25.1	\N	\N	9118656144
8.0.0-updating-credential-data-oracle-fixed	keycloak	META-INF/jpa-changelog-8.0.0.xml	2026-05-18 15:37:37.620341	74	MARK_RAN	9:14706f286953fc9a25286dbd8fb30d97	update tableName=CREDENTIAL; update tableName=CREDENTIAL; update tableName=CREDENTIAL; update tableName=FED_USER_CREDENTIAL; update tableName=FED_USER_CREDENTIAL; update tableName=FED_USER_CREDENTIAL		\N	4.25.1	\N	\N	9118656144
8.0.0-credential-cleanup-fixed	keycloak	META-INF/jpa-changelog-8.0.0.xml	2026-05-18 15:37:37.639141	75	EXECUTED	9:2b9cc12779be32c5b40e2e67711a218b	dropDefaultValue columnName=COUNTER, tableName=CREDENTIAL; dropDefaultValue columnName=DIGITS, tableName=CREDENTIAL; dropDefaultValue columnName=PERIOD, tableName=CREDENTIAL; dropDefaultValue columnName=ALGORITHM, tableName=CREDENTIAL; dropColumn ...		\N	4.25.1	\N	\N	9118656144
8.0.0-resource-tag-support	keycloak	META-INF/jpa-changelog-8.0.0.xml	2026-05-18 15:37:37.644726	76	EXECUTED	9:91fa186ce7a5af127a2d7a91ee083cc5	addColumn tableName=MIGRATION_MODEL; createIndex indexName=IDX_UPDATE_TIME, tableName=MIGRATION_MODEL		\N	4.25.1	\N	\N	9118656144
9.0.0-always-display-client	keycloak	META-INF/jpa-changelog-9.0.0.xml	2026-05-18 15:37:37.648982	77	EXECUTED	9:6335e5c94e83a2639ccd68dd24e2e5ad	addColumn tableName=CLIENT		\N	4.25.1	\N	\N	9118656144
9.0.0-drop-constraints-for-column-increase	keycloak	META-INF/jpa-changelog-9.0.0.xml	2026-05-18 15:37:37.650955	78	MARK_RAN	9:6bdb5658951e028bfe16fa0a8228b530	dropUniqueConstraint constraintName=UK_FRSR6T700S9V50BU18WS5PMT, tableName=RESOURCE_SERVER_PERM_TICKET; dropUniqueConstraint constraintName=UK_FRSR6T700S9V50BU18WS5HA6, tableName=RESOURCE_SERVER_RESOURCE; dropPrimaryKey constraintName=CONSTRAINT_O...		\N	4.25.1	\N	\N	9118656144
9.0.0-increase-column-size-federated-fk	keycloak	META-INF/jpa-changelog-9.0.0.xml	2026-05-18 15:37:37.667781	79	EXECUTED	9:d5bc15a64117ccad481ce8792d4c608f	modifyDataType columnName=CLIENT_ID, tableName=FED_USER_CONSENT; modifyDataType columnName=CLIENT_REALM_CONSTRAINT, tableName=KEYCLOAK_ROLE; modifyDataType columnName=OWNER, tableName=RESOURCE_SERVER_POLICY; modifyDataType columnName=CLIENT_ID, ta...		\N	4.25.1	\N	\N	9118656144
9.0.0-recreate-constraints-after-column-increase	keycloak	META-INF/jpa-changelog-9.0.0.xml	2026-05-18 15:37:37.669795	80	MARK_RAN	9:077cba51999515f4d3e7ad5619ab592c	addNotNullConstraint columnName=CLIENT_ID, tableName=OFFLINE_CLIENT_SESSION; addNotNullConstraint columnName=OWNER, tableName=RESOURCE_SERVER_PERM_TICKET; addNotNullConstraint columnName=REQUESTER, tableName=RESOURCE_SERVER_PERM_TICKET; addNotNull...		\N	4.25.1	\N	\N	9118656144
9.0.1-add-index-to-client.client_id	keycloak	META-INF/jpa-changelog-9.0.1.xml	2026-05-18 15:37:37.674856	81	EXECUTED	9:be969f08a163bf47c6b9e9ead8ac2afb	createIndex indexName=IDX_CLIENT_ID, tableName=CLIENT		\N	4.25.1	\N	\N	9118656144
9.0.1-KEYCLOAK-12579-drop-constraints	keycloak	META-INF/jpa-changelog-9.0.1.xml	2026-05-18 15:37:37.676224	82	MARK_RAN	9:6d3bb4408ba5a72f39bd8a0b301ec6e3	dropUniqueConstraint constraintName=SIBLING_NAMES, tableName=KEYCLOAK_GROUP		\N	4.25.1	\N	\N	9118656144
9.0.1-KEYCLOAK-12579-add-not-null-constraint	keycloak	META-INF/jpa-changelog-9.0.1.xml	2026-05-18 15:37:37.680034	83	EXECUTED	9:966bda61e46bebf3cc39518fbed52fa7	addNotNullConstraint columnName=PARENT_GROUP, tableName=KEYCLOAK_GROUP		\N	4.25.1	\N	\N	9118656144
9.0.1-KEYCLOAK-12579-recreate-constraints	keycloak	META-INF/jpa-changelog-9.0.1.xml	2026-05-18 15:37:37.681627	84	MARK_RAN	9:8dcac7bdf7378e7d823cdfddebf72fda	addUniqueConstraint constraintName=SIBLING_NAMES, tableName=KEYCLOAK_GROUP		\N	4.25.1	\N	\N	9118656144
9.0.1-add-index-to-events	keycloak	META-INF/jpa-changelog-9.0.1.xml	2026-05-18 15:37:37.686276	85	EXECUTED	9:7d93d602352a30c0c317e6a609b56599	createIndex indexName=IDX_EVENT_TIME, tableName=EVENT_ENTITY		\N	4.25.1	\N	\N	9118656144
map-remove-ri	keycloak	META-INF/jpa-changelog-11.0.0.xml	2026-05-18 15:37:37.692238	86	EXECUTED	9:71c5969e6cdd8d7b6f47cebc86d37627	dropForeignKeyConstraint baseTableName=REALM, constraintName=FK_TRAF444KK6QRKMS7N56AIWQ5Y; dropForeignKeyConstraint baseTableName=KEYCLOAK_ROLE, constraintName=FK_KJHO5LE2C0RAL09FL8CM9WFW9		\N	4.25.1	\N	\N	9118656144
map-remove-ri	keycloak	META-INF/jpa-changelog-12.0.0.xml	2026-05-18 15:37:37.699165	87	EXECUTED	9:a9ba7d47f065f041b7da856a81762021	dropForeignKeyConstraint baseTableName=REALM_DEFAULT_GROUPS, constraintName=FK_DEF_GROUPS_GROUP; dropForeignKeyConstraint baseTableName=REALM_DEFAULT_ROLES, constraintName=FK_H4WPD7W4HSOOLNI3H0SW7BTJE; dropForeignKeyConstraint baseTableName=CLIENT...		\N	4.25.1	\N	\N	9118656144
12.1.0-add-realm-localization-table	keycloak	META-INF/jpa-changelog-12.0.0.xml	2026-05-18 15:37:37.703581	88	EXECUTED	9:fffabce2bc01e1a8f5110d5278500065	createTable tableName=REALM_LOCALIZATIONS; addPrimaryKey tableName=REALM_LOCALIZATIONS		\N	4.25.1	\N	\N	9118656144
default-roles	keycloak	META-INF/jpa-changelog-13.0.0.xml	2026-05-18 15:37:37.710407	89	EXECUTED	9:fa8a5b5445e3857f4b010bafb5009957	addColumn tableName=REALM; customChange		\N	4.25.1	\N	\N	9118656144
default-roles-cleanup	keycloak	META-INF/jpa-changelog-13.0.0.xml	2026-05-18 15:37:37.715822	90	EXECUTED	9:67ac3241df9a8582d591c5ed87125f39	dropTable tableName=REALM_DEFAULT_ROLES; dropTable tableName=CLIENT_DEFAULT_ROLES		\N	4.25.1	\N	\N	9118656144
13.0.0-KEYCLOAK-16844	keycloak	META-INF/jpa-changelog-13.0.0.xml	2026-05-18 15:37:37.718385	91	EXECUTED	9:ad1194d66c937e3ffc82386c050ba089	createIndex indexName=IDX_OFFLINE_USS_PRELOAD, tableName=OFFLINE_USER_SESSION		\N	4.25.1	\N	\N	9118656144
map-remove-ri-13.0.0	keycloak	META-INF/jpa-changelog-13.0.0.xml	2026-05-18 15:37:37.728148	92	EXECUTED	9:d9be619d94af5a2f5d07b9f003543b91	dropForeignKeyConstraint baseTableName=DEFAULT_CLIENT_SCOPE, constraintName=FK_R_DEF_CLI_SCOPE_SCOPE; dropForeignKeyConstraint baseTableName=CLIENT_SCOPE_CLIENT, constraintName=FK_C_CLI_SCOPE_SCOPE; dropForeignKeyConstraint baseTableName=CLIENT_SC...		\N	4.25.1	\N	\N	9118656144
13.0.0-KEYCLOAK-17992-drop-constraints	keycloak	META-INF/jpa-changelog-13.0.0.xml	2026-05-18 15:37:37.729318	93	MARK_RAN	9:544d201116a0fcc5a5da0925fbbc3bde	dropPrimaryKey constraintName=C_CLI_SCOPE_BIND, tableName=CLIENT_SCOPE_CLIENT; dropIndex indexName=IDX_CLSCOPE_CL, tableName=CLIENT_SCOPE_CLIENT; dropIndex indexName=IDX_CL_CLSCOPE, tableName=CLIENT_SCOPE_CLIENT		\N	4.25.1	\N	\N	9118656144
13.0.0-increase-column-size-federated	keycloak	META-INF/jpa-changelog-13.0.0.xml	2026-05-18 15:37:37.734145	94	EXECUTED	9:43c0c1055b6761b4b3e89de76d612ccf	modifyDataType columnName=CLIENT_ID, tableName=CLIENT_SCOPE_CLIENT; modifyDataType columnName=SCOPE_ID, tableName=CLIENT_SCOPE_CLIENT		\N	4.25.1	\N	\N	9118656144
13.0.0-KEYCLOAK-17992-recreate-constraints	keycloak	META-INF/jpa-changelog-13.0.0.xml	2026-05-18 15:37:37.735319	95	MARK_RAN	9:8bd711fd0330f4fe980494ca43ab1139	addNotNullConstraint columnName=CLIENT_ID, tableName=CLIENT_SCOPE_CLIENT; addNotNullConstraint columnName=SCOPE_ID, tableName=CLIENT_SCOPE_CLIENT; addPrimaryKey constraintName=C_CLI_SCOPE_BIND, tableName=CLIENT_SCOPE_CLIENT; createIndex indexName=...		\N	4.25.1	\N	\N	9118656144
json-string-accomodation-fixed	keycloak	META-INF/jpa-changelog-13.0.0.xml	2026-05-18 15:37:37.738464	96	EXECUTED	9:e07d2bc0970c348bb06fb63b1f82ddbf	addColumn tableName=REALM_ATTRIBUTE; update tableName=REALM_ATTRIBUTE; dropColumn columnName=VALUE, tableName=REALM_ATTRIBUTE; renameColumn newColumnName=VALUE, oldColumnName=VALUE_NEW, tableName=REALM_ATTRIBUTE		\N	4.25.1	\N	\N	9118656144
14.0.0-KEYCLOAK-11019	keycloak	META-INF/jpa-changelog-14.0.0.xml	2026-05-18 15:37:37.742367	97	EXECUTED	9:24fb8611e97f29989bea412aa38d12b7	createIndex indexName=IDX_OFFLINE_CSS_PRELOAD, tableName=OFFLINE_CLIENT_SESSION; createIndex indexName=IDX_OFFLINE_USS_BY_USER, tableName=OFFLINE_USER_SESSION; createIndex indexName=IDX_OFFLINE_USS_BY_USERSESS, tableName=OFFLINE_USER_SESSION		\N	4.25.1	\N	\N	9118656144
14.0.0-KEYCLOAK-18286	keycloak	META-INF/jpa-changelog-14.0.0.xml	2026-05-18 15:37:37.743539	98	MARK_RAN	9:259f89014ce2506ee84740cbf7163aa7	createIndex indexName=IDX_CLIENT_ATT_BY_NAME_VALUE, tableName=CLIENT_ATTRIBUTES		\N	4.25.1	\N	\N	9118656144
14.0.0-KEYCLOAK-18286-revert	keycloak	META-INF/jpa-changelog-14.0.0.xml	2026-05-18 15:37:37.750473	99	MARK_RAN	9:04baaf56c116ed19951cbc2cca584022	dropIndex indexName=IDX_CLIENT_ATT_BY_NAME_VALUE, tableName=CLIENT_ATTRIBUTES		\N	4.25.1	\N	\N	9118656144
14.0.0-KEYCLOAK-18286-supported-dbs	keycloak	META-INF/jpa-changelog-14.0.0.xml	2026-05-18 15:37:37.753543	100	EXECUTED	9:60ca84a0f8c94ec8c3504a5a3bc88ee8	createIndex indexName=IDX_CLIENT_ATT_BY_NAME_VALUE, tableName=CLIENT_ATTRIBUTES		\N	4.25.1	\N	\N	9118656144
14.0.0-KEYCLOAK-18286-unsupported-dbs	keycloak	META-INF/jpa-changelog-14.0.0.xml	2026-05-18 15:37:37.754906	101	MARK_RAN	9:d3d977031d431db16e2c181ce49d73e9	createIndex indexName=IDX_CLIENT_ATT_BY_NAME_VALUE, tableName=CLIENT_ATTRIBUTES		\N	4.25.1	\N	\N	9118656144
KEYCLOAK-17267-add-index-to-user-attributes	keycloak	META-INF/jpa-changelog-14.0.0.xml	2026-05-18 15:37:37.758002	102	EXECUTED	9:0b305d8d1277f3a89a0a53a659ad274c	createIndex indexName=IDX_USER_ATTRIBUTE_NAME, tableName=USER_ATTRIBUTE		\N	4.25.1	\N	\N	9118656144
KEYCLOAK-18146-add-saml-art-binding-identifier	keycloak	META-INF/jpa-changelog-14.0.0.xml	2026-05-18 15:37:37.763195	103	EXECUTED	9:2c374ad2cdfe20e2905a84c8fac48460	customChange		\N	4.25.1	\N	\N	9118656144
15.0.0-KEYCLOAK-18467	keycloak	META-INF/jpa-changelog-15.0.0.xml	2026-05-18 15:37:37.766921	104	EXECUTED	9:47a760639ac597360a8219f5b768b4de	addColumn tableName=REALM_LOCALIZATIONS; update tableName=REALM_LOCALIZATIONS; dropColumn columnName=TEXTS, tableName=REALM_LOCALIZATIONS; renameColumn newColumnName=TEXTS, oldColumnName=TEXTS_NEW, tableName=REALM_LOCALIZATIONS; addNotNullConstrai...		\N	4.25.1	\N	\N	9118656144
17.0.0-9562	keycloak	META-INF/jpa-changelog-17.0.0.xml	2026-05-18 15:37:37.771094	105	EXECUTED	9:a6272f0576727dd8cad2522335f5d99e	createIndex indexName=IDX_USER_SERVICE_ACCOUNT, tableName=USER_ENTITY		\N	4.25.1	\N	\N	9118656144
18.0.0-10625-IDX_ADMIN_EVENT_TIME	keycloak	META-INF/jpa-changelog-18.0.0.xml	2026-05-18 15:37:37.774539	106	EXECUTED	9:015479dbd691d9cc8669282f4828c41d	createIndex indexName=IDX_ADMIN_EVENT_TIME, tableName=ADMIN_EVENT_ENTITY		\N	4.25.1	\N	\N	9118656144
18.0.15-30992-index-consent	keycloak	META-INF/jpa-changelog-18.0.15.xml	2026-05-18 15:37:37.779813	107	EXECUTED	9:80071ede7a05604b1f4906f3bf3b00f0	createIndex indexName=IDX_USCONSENT_SCOPE_ID, tableName=USER_CONSENT_CLIENT_SCOPE		\N	4.25.1	\N	\N	9118656144
19.0.0-10135	keycloak	META-INF/jpa-changelog-19.0.0.xml	2026-05-18 15:37:37.784549	108	EXECUTED	9:9518e495fdd22f78ad6425cc30630221	customChange		\N	4.25.1	\N	\N	9118656144
20.0.0-12964-supported-dbs	keycloak	META-INF/jpa-changelog-20.0.0.xml	2026-05-18 15:37:37.787199	109	EXECUTED	9:e5f243877199fd96bcc842f27a1656ac	createIndex indexName=IDX_GROUP_ATT_BY_NAME_VALUE, tableName=GROUP_ATTRIBUTE		\N	4.25.1	\N	\N	9118656144
20.0.0-12964-unsupported-dbs	keycloak	META-INF/jpa-changelog-20.0.0.xml	2026-05-18 15:37:37.788137	110	MARK_RAN	9:1a6fcaa85e20bdeae0a9ce49b41946a5	createIndex indexName=IDX_GROUP_ATT_BY_NAME_VALUE, tableName=GROUP_ATTRIBUTE		\N	4.25.1	\N	\N	9118656144
client-attributes-string-accomodation-fixed	keycloak	META-INF/jpa-changelog-20.0.0.xml	2026-05-18 15:37:37.792633	111	EXECUTED	9:3f332e13e90739ed0c35b0b25b7822ca	addColumn tableName=CLIENT_ATTRIBUTES; update tableName=CLIENT_ATTRIBUTES; dropColumn columnName=VALUE, tableName=CLIENT_ATTRIBUTES; renameColumn newColumnName=VALUE, oldColumnName=VALUE_NEW, tableName=CLIENT_ATTRIBUTES		\N	4.25.1	\N	\N	9118656144
21.0.2-17277	keycloak	META-INF/jpa-changelog-21.0.2.xml	2026-05-18 15:37:37.796425	112	EXECUTED	9:7ee1f7a3fb8f5588f171fb9a6ab623c0	customChange		\N	4.25.1	\N	\N	9118656144
21.1.0-19404	keycloak	META-INF/jpa-changelog-21.1.0.xml	2026-05-18 15:37:37.803109	113	EXECUTED	9:3d7e830b52f33676b9d64f7f2b2ea634	modifyDataType columnName=DECISION_STRATEGY, tableName=RESOURCE_SERVER_POLICY; modifyDataType columnName=LOGIC, tableName=RESOURCE_SERVER_POLICY; modifyDataType columnName=POLICY_ENFORCE_MODE, tableName=RESOURCE_SERVER		\N	4.25.1	\N	\N	9118656144
21.1.0-19404-2	keycloak	META-INF/jpa-changelog-21.1.0.xml	2026-05-18 15:37:37.805056	114	MARK_RAN	9:627d032e3ef2c06c0e1f73d2ae25c26c	addColumn tableName=RESOURCE_SERVER_POLICY; update tableName=RESOURCE_SERVER_POLICY; dropColumn columnName=DECISION_STRATEGY, tableName=RESOURCE_SERVER_POLICY; renameColumn newColumnName=DECISION_STRATEGY, oldColumnName=DECISION_STRATEGY_NEW, tabl...		\N	4.25.1	\N	\N	9118656144
22.0.0-17484-updated	keycloak	META-INF/jpa-changelog-22.0.0.xml	2026-05-18 15:37:37.809267	115	EXECUTED	9:90af0bfd30cafc17b9f4d6eccd92b8b3	customChange		\N	4.25.1	\N	\N	9118656144
22.0.5-24031	keycloak	META-INF/jpa-changelog-22.0.0.xml	2026-05-18 15:37:37.810507	116	MARK_RAN	9:a60d2d7b315ec2d3eba9e2f145f9df28	customChange		\N	4.25.1	\N	\N	9118656144
23.0.0-12062	keycloak	META-INF/jpa-changelog-23.0.0.xml	2026-05-18 15:37:37.81386	117	EXECUTED	9:2168fbe728fec46ae9baf15bf80927b8	addColumn tableName=COMPONENT_CONFIG; update tableName=COMPONENT_CONFIG; dropColumn columnName=VALUE, tableName=COMPONENT_CONFIG; renameColumn newColumnName=VALUE, oldColumnName=VALUE_NEW, tableName=COMPONENT_CONFIG		\N	4.25.1	\N	\N	9118656144
23.0.0-17258	keycloak	META-INF/jpa-changelog-23.0.0.xml	2026-05-18 15:37:37.815507	118	EXECUTED	9:36506d679a83bbfda85a27ea1864dca8	addColumn tableName=EVENT_ENTITY		\N	4.25.1	\N	\N	9118656144
24.0.0-9758	keycloak	META-INF/jpa-changelog-24.0.0.xml	2026-05-18 15:37:37.820672	119	EXECUTED	9:502c557a5189f600f0f445a9b49ebbce	addColumn tableName=USER_ATTRIBUTE; addColumn tableName=FED_USER_ATTRIBUTE; createIndex indexName=USER_ATTR_LONG_VALUES, tableName=USER_ATTRIBUTE; createIndex indexName=FED_USER_ATTR_LONG_VALUES, tableName=FED_USER_ATTRIBUTE; createIndex indexName...		\N	4.25.1	\N	\N	9118656144
24.0.0-9758-2	keycloak	META-INF/jpa-changelog-24.0.0.xml	2026-05-18 15:37:37.824524	120	EXECUTED	9:bf0fdee10afdf597a987adbf291db7b2	customChange		\N	4.25.1	\N	\N	9118656144
24.0.0-26618-drop-index-if-present	keycloak	META-INF/jpa-changelog-24.0.0.xml	2026-05-18 15:37:37.828304	121	MARK_RAN	9:04baaf56c116ed19951cbc2cca584022	dropIndex indexName=IDX_CLIENT_ATT_BY_NAME_VALUE, tableName=CLIENT_ATTRIBUTES		\N	4.25.1	\N	\N	9118656144
24.0.0-26618-reindex	keycloak	META-INF/jpa-changelog-24.0.0.xml	2026-05-18 15:37:37.832253	122	EXECUTED	9:08707c0f0db1cef6b352db03a60edc7f	createIndex indexName=IDX_CLIENT_ATT_BY_NAME_VALUE, tableName=CLIENT_ATTRIBUTES		\N	4.25.1	\N	\N	9118656144
24.0.2-27228	keycloak	META-INF/jpa-changelog-24.0.2.xml	2026-05-18 15:37:37.837334	123	EXECUTED	9:eaee11f6b8aa25d2cc6a84fb86fc6238	customChange		\N	4.25.1	\N	\N	9118656144
24.0.2-27967-drop-index-if-present	keycloak	META-INF/jpa-changelog-24.0.2.xml	2026-05-18 15:37:37.838543	124	MARK_RAN	9:04baaf56c116ed19951cbc2cca584022	dropIndex indexName=IDX_CLIENT_ATT_BY_NAME_VALUE, tableName=CLIENT_ATTRIBUTES		\N	4.25.1	\N	\N	9118656144
24.0.2-27967-reindex	keycloak	META-INF/jpa-changelog-24.0.2.xml	2026-05-18 15:37:37.839945	125	MARK_RAN	9:d3d977031d431db16e2c181ce49d73e9	createIndex indexName=IDX_CLIENT_ATT_BY_NAME_VALUE, tableName=CLIENT_ATTRIBUTES		\N	4.25.1	\N	\N	9118656144
25.0.0-28265-tables	keycloak	META-INF/jpa-changelog-25.0.0.xml	2026-05-18 15:37:37.842915	126	EXECUTED	9:deda2df035df23388af95bbd36c17cef	addColumn tableName=OFFLINE_USER_SESSION; addColumn tableName=OFFLINE_CLIENT_SESSION		\N	4.25.1	\N	\N	9118656144
25.0.0-28265-index-creation	keycloak	META-INF/jpa-changelog-25.0.0.xml	2026-05-18 15:37:37.845977	127	EXECUTED	9:3e96709818458ae49f3c679ae58d263a	createIndex indexName=IDX_OFFLINE_USS_BY_LAST_SESSION_REFRESH, tableName=OFFLINE_USER_SESSION		\N	4.25.1	\N	\N	9118656144
25.0.0-28265-index-cleanup	keycloak	META-INF/jpa-changelog-25.0.0.xml	2026-05-18 15:37:37.849241	128	EXECUTED	9:8c0cfa341a0474385b324f5c4b2dfcc1	dropIndex indexName=IDX_OFFLINE_USS_CREATEDON, tableName=OFFLINE_USER_SESSION; dropIndex indexName=IDX_OFFLINE_USS_PRELOAD, tableName=OFFLINE_USER_SESSION; dropIndex indexName=IDX_OFFLINE_USS_BY_USERSESS, tableName=OFFLINE_USER_SESSION; dropIndex ...		\N	4.25.1	\N	\N	9118656144
25.0.0-28265-index-2-mysql	keycloak	META-INF/jpa-changelog-25.0.0.xml	2026-05-18 15:37:37.850454	129	MARK_RAN	9:b7ef76036d3126bb83c2423bf4d449d6	createIndex indexName=IDX_OFFLINE_USS_BY_BROKER_SESSION_ID, tableName=OFFLINE_USER_SESSION		\N	4.25.1	\N	\N	9118656144
25.0.0-28265-index-2-not-mysql	keycloak	META-INF/jpa-changelog-25.0.0.xml	2026-05-18 15:37:37.853919	130	EXECUTED	9:23396cf51ab8bc1ae6f0cac7f9f6fcf7	createIndex indexName=IDX_OFFLINE_USS_BY_BROKER_SESSION_ID, tableName=OFFLINE_USER_SESSION		\N	4.25.1	\N	\N	9118656144
25.0.0-org	keycloak	META-INF/jpa-changelog-25.0.0.xml	2026-05-18 15:37:37.86037	131	EXECUTED	9:5c859965c2c9b9c72136c360649af157	createTable tableName=ORG; addUniqueConstraint constraintName=UK_ORG_NAME, tableName=ORG; addUniqueConstraint constraintName=UK_ORG_GROUP, tableName=ORG; createTable tableName=ORG_DOMAIN		\N	4.25.1	\N	\N	9118656144
unique-consentuser	keycloak	META-INF/jpa-changelog-25.0.0.xml	2026-05-18 15:37:37.867323	132	EXECUTED	9:5857626a2ea8767e9a6c66bf3a2cb32f	customChange; dropUniqueConstraint constraintName=UK_JKUWUVD56ONTGSUHOGM8UEWRT, tableName=USER_CONSENT; addUniqueConstraint constraintName=UK_LOCAL_CONSENT, tableName=USER_CONSENT; addUniqueConstraint constraintName=UK_EXTERNAL_CONSENT, tableName=...		\N	4.25.1	\N	\N	9118656144
unique-consentuser-mysql	keycloak	META-INF/jpa-changelog-25.0.0.xml	2026-05-18 15:37:37.868982	133	MARK_RAN	9:b79478aad5adaa1bc428e31563f55e8e	customChange; dropUniqueConstraint constraintName=UK_JKUWUVD56ONTGSUHOGM8UEWRT, tableName=USER_CONSENT; addUniqueConstraint constraintName=UK_LOCAL_CONSENT, tableName=USER_CONSENT; addUniqueConstraint constraintName=UK_EXTERNAL_CONSENT, tableName=...		\N	4.25.1	\N	\N	9118656144
25.0.0-28861-index-creation	keycloak	META-INF/jpa-changelog-25.0.0.xml	2026-05-18 15:37:37.873899	134	EXECUTED	9:b9acb58ac958d9ada0fe12a5d4794ab1	createIndex indexName=IDX_PERM_TICKET_REQUESTER, tableName=RESOURCE_SERVER_PERM_TICKET; createIndex indexName=IDX_PERM_TICKET_OWNER, tableName=RESOURCE_SERVER_PERM_TICKET		\N	4.25.1	\N	\N	9118656144
\.


--
-- Data for Name: databasechangeloglock; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.databasechangeloglock (id, locked, lockgranted, lockedby) FROM stdin;
1	f	\N	\N
1000	f	\N	\N
\.


--
-- Data for Name: default_client_scope; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.default_client_scope (realm_id, scope_id, default_scope) FROM stdin;
9a97cd68-2f02-4213-a560-1f7696277d76	063f8be9-26c1-4e3b-94dc-2bb1816d760c	f
9a97cd68-2f02-4213-a560-1f7696277d76	26ff69ff-a806-4230-8bac-7e6d098b2904	t
9a97cd68-2f02-4213-a560-1f7696277d76	11a2da8a-20e6-4b1e-bcaf-8462982dd828	t
9a97cd68-2f02-4213-a560-1f7696277d76	da2b9ae6-97e4-4242-9cdf-e88fdc2575e1	t
9a97cd68-2f02-4213-a560-1f7696277d76	ce197625-f7b0-41f2-b8e1-09ab8ca56489	f
9a97cd68-2f02-4213-a560-1f7696277d76	764d3a1f-f825-45e2-bddc-606de70b90b0	f
9a97cd68-2f02-4213-a560-1f7696277d76	dec2dada-bcd5-453a-a45c-43c7e6964497	t
9a97cd68-2f02-4213-a560-1f7696277d76	caaf5764-484b-44f0-b64f-7062584ceec6	t
9a97cd68-2f02-4213-a560-1f7696277d76	ca339a4d-498e-4b02-96cc-d5c0170808da	f
9a97cd68-2f02-4213-a560-1f7696277d76	78b18b42-4294-486f-860e-65bc75620250	t
9a97cd68-2f02-4213-a560-1f7696277d76	cb7af951-ab7f-43e9-b85e-61d295a8c2c8	t
1f8b22bb-145f-4eaa-83e4-79fc73e6564f	474ef808-8e0b-4255-8a69-d5bed150cb21	f
1f8b22bb-145f-4eaa-83e4-79fc73e6564f	d6ac81dc-9f4d-4792-b3d6-5a58d61449ec	t
1f8b22bb-145f-4eaa-83e4-79fc73e6564f	0ffbd751-1a8f-4206-bde0-09d0b944ef3a	t
1f8b22bb-145f-4eaa-83e4-79fc73e6564f	bb7dbd7f-2b09-4922-938e-5d99fab04021	t
1f8b22bb-145f-4eaa-83e4-79fc73e6564f	754bca75-7c68-44c1-9f53-4fd6cb5e05f1	f
1f8b22bb-145f-4eaa-83e4-79fc73e6564f	50445a82-b24e-4c9a-8336-5cea7d2ae817	f
1f8b22bb-145f-4eaa-83e4-79fc73e6564f	d927e25c-aab0-4793-a247-bb2ed7fcfdfb	t
1f8b22bb-145f-4eaa-83e4-79fc73e6564f	ab825560-c7fa-49a7-8c72-626787c363bc	t
1f8b22bb-145f-4eaa-83e4-79fc73e6564f	e41a2773-48b0-4ae0-a929-87bfca1274c8	f
1f8b22bb-145f-4eaa-83e4-79fc73e6564f	c79051b5-e811-40c2-beb8-e22a52ac9894	t
1f8b22bb-145f-4eaa-83e4-79fc73e6564f	5100f0ae-22ec-4175-aa7b-c7953eb64db4	t
\.


--
-- Data for Name: event_entity; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.event_entity (id, client_id, details_json, error, ip_address, realm_id, session_id, event_time, type, user_id, details_json_long_value) FROM stdin;
\.


--
-- Data for Name: fed_user_attribute; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fed_user_attribute (id, name, user_id, realm_id, storage_provider_id, value, long_value_hash, long_value_hash_lower_case, long_value) FROM stdin;
\.


--
-- Data for Name: fed_user_consent; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fed_user_consent (id, client_id, user_id, realm_id, storage_provider_id, created_date, last_updated_date, client_storage_provider, external_client_id) FROM stdin;
\.


--
-- Data for Name: fed_user_consent_cl_scope; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fed_user_consent_cl_scope (user_consent_id, scope_id) FROM stdin;
\.


--
-- Data for Name: fed_user_credential; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fed_user_credential (id, salt, type, created_date, user_id, realm_id, storage_provider_id, user_label, secret_data, credential_data, priority) FROM stdin;
\.


--
-- Data for Name: fed_user_group_membership; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fed_user_group_membership (group_id, user_id, realm_id, storage_provider_id) FROM stdin;
\.


--
-- Data for Name: fed_user_required_action; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fed_user_required_action (required_action, user_id, realm_id, storage_provider_id) FROM stdin;
\.


--
-- Data for Name: fed_user_role_mapping; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fed_user_role_mapping (role_id, user_id, realm_id, storage_provider_id) FROM stdin;
\.


--
-- Data for Name: federated_identity; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.federated_identity (identity_provider, realm_id, federated_user_id, federated_username, token, user_id) FROM stdin;
\.


--
-- Data for Name: federated_user; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.federated_user (id, storage_provider_id, realm_id) FROM stdin;
\.


--
-- Data for Name: group_attribute; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.group_attribute (id, name, value, group_id) FROM stdin;
\.


--
-- Data for Name: group_role_mapping; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.group_role_mapping (role_id, group_id) FROM stdin;
\.


--
-- Data for Name: identity_provider; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.identity_provider (internal_id, enabled, provider_alias, provider_id, store_token, authenticate_by_default, realm_id, add_token_role, trust_email, first_broker_login_flow_id, post_broker_login_flow_id, provider_display_name, link_only) FROM stdin;
\.


--
-- Data for Name: identity_provider_config; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.identity_provider_config (identity_provider_id, value, name) FROM stdin;
\.


--
-- Data for Name: identity_provider_mapper; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.identity_provider_mapper (id, name, idp_alias, idp_mapper_name, realm_id) FROM stdin;
\.


--
-- Data for Name: idp_mapper_config; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.idp_mapper_config (idp_mapper_id, value, name) FROM stdin;
\.


--
-- Data for Name: keycloak_group; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.keycloak_group (id, name, parent_group, realm_id) FROM stdin;
\.


--
-- Data for Name: keycloak_role; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.keycloak_role (id, client_realm_constraint, client_role, description, name, realm_id, client, realm) FROM stdin;
fa7c5b60-9c57-4078-9005-5d917953aac8	9a97cd68-2f02-4213-a560-1f7696277d76	f	${role_default-roles}	default-roles-master	9a97cd68-2f02-4213-a560-1f7696277d76	\N	\N
22e059c4-7274-4727-83e7-39668b9d6116	9a97cd68-2f02-4213-a560-1f7696277d76	f	${role_admin}	admin	9a97cd68-2f02-4213-a560-1f7696277d76	\N	\N
97c1b682-ef01-4069-81e6-a9b9481cba0e	9a97cd68-2f02-4213-a560-1f7696277d76	f	${role_create-realm}	create-realm	9a97cd68-2f02-4213-a560-1f7696277d76	\N	\N
489d7b83-4467-43d4-8a78-f889e8bbf782	2c5fd935-c489-41f4-be87-eda2243aebfb	t	${role_create-client}	create-client	9a97cd68-2f02-4213-a560-1f7696277d76	2c5fd935-c489-41f4-be87-eda2243aebfb	\N
317031bc-caae-4919-87fc-5c8ba1145d5e	2c5fd935-c489-41f4-be87-eda2243aebfb	t	${role_view-realm}	view-realm	9a97cd68-2f02-4213-a560-1f7696277d76	2c5fd935-c489-41f4-be87-eda2243aebfb	\N
b2c09e84-7fb0-4fb4-9fe0-219a91531554	2c5fd935-c489-41f4-be87-eda2243aebfb	t	${role_view-users}	view-users	9a97cd68-2f02-4213-a560-1f7696277d76	2c5fd935-c489-41f4-be87-eda2243aebfb	\N
f9e73488-fc78-42e5-ad4a-9a4b17778909	2c5fd935-c489-41f4-be87-eda2243aebfb	t	${role_view-clients}	view-clients	9a97cd68-2f02-4213-a560-1f7696277d76	2c5fd935-c489-41f4-be87-eda2243aebfb	\N
83b250c1-5723-49dc-961d-461035290f06	2c5fd935-c489-41f4-be87-eda2243aebfb	t	${role_view-events}	view-events	9a97cd68-2f02-4213-a560-1f7696277d76	2c5fd935-c489-41f4-be87-eda2243aebfb	\N
6d8e55a1-c72e-48c8-bf8c-58d3e476fad1	2c5fd935-c489-41f4-be87-eda2243aebfb	t	${role_view-identity-providers}	view-identity-providers	9a97cd68-2f02-4213-a560-1f7696277d76	2c5fd935-c489-41f4-be87-eda2243aebfb	\N
3222d960-d083-4315-ba7a-f4946ccc2f77	2c5fd935-c489-41f4-be87-eda2243aebfb	t	${role_view-authorization}	view-authorization	9a97cd68-2f02-4213-a560-1f7696277d76	2c5fd935-c489-41f4-be87-eda2243aebfb	\N
6cad8eab-7c93-42f1-9802-8f422f429899	2c5fd935-c489-41f4-be87-eda2243aebfb	t	${role_manage-realm}	manage-realm	9a97cd68-2f02-4213-a560-1f7696277d76	2c5fd935-c489-41f4-be87-eda2243aebfb	\N
45329bda-d7e2-44de-82a7-91115e6bcd9b	2c5fd935-c489-41f4-be87-eda2243aebfb	t	${role_manage-users}	manage-users	9a97cd68-2f02-4213-a560-1f7696277d76	2c5fd935-c489-41f4-be87-eda2243aebfb	\N
5eb57921-276c-4835-8bb0-0583e46850d3	2c5fd935-c489-41f4-be87-eda2243aebfb	t	${role_manage-clients}	manage-clients	9a97cd68-2f02-4213-a560-1f7696277d76	2c5fd935-c489-41f4-be87-eda2243aebfb	\N
6ca8f6e6-1ebd-44a4-a4c7-0f1a7d586777	2c5fd935-c489-41f4-be87-eda2243aebfb	t	${role_manage-events}	manage-events	9a97cd68-2f02-4213-a560-1f7696277d76	2c5fd935-c489-41f4-be87-eda2243aebfb	\N
fda81a04-5c96-4153-af21-cc99c91fb006	2c5fd935-c489-41f4-be87-eda2243aebfb	t	${role_manage-identity-providers}	manage-identity-providers	9a97cd68-2f02-4213-a560-1f7696277d76	2c5fd935-c489-41f4-be87-eda2243aebfb	\N
2ab539f5-c4ff-4d20-9cc5-11eb4517b8da	2c5fd935-c489-41f4-be87-eda2243aebfb	t	${role_manage-authorization}	manage-authorization	9a97cd68-2f02-4213-a560-1f7696277d76	2c5fd935-c489-41f4-be87-eda2243aebfb	\N
4084cb54-df5e-44aa-abaf-5e3042cd339f	2c5fd935-c489-41f4-be87-eda2243aebfb	t	${role_query-users}	query-users	9a97cd68-2f02-4213-a560-1f7696277d76	2c5fd935-c489-41f4-be87-eda2243aebfb	\N
15a98445-c7ea-406f-ae72-b01b093a3e85	2c5fd935-c489-41f4-be87-eda2243aebfb	t	${role_query-clients}	query-clients	9a97cd68-2f02-4213-a560-1f7696277d76	2c5fd935-c489-41f4-be87-eda2243aebfb	\N
006a0fb2-a269-4ff0-8442-355b49e42276	2c5fd935-c489-41f4-be87-eda2243aebfb	t	${role_query-realms}	query-realms	9a97cd68-2f02-4213-a560-1f7696277d76	2c5fd935-c489-41f4-be87-eda2243aebfb	\N
9d601442-3b71-425e-a29d-bcf8f3dc6519	2c5fd935-c489-41f4-be87-eda2243aebfb	t	${role_query-groups}	query-groups	9a97cd68-2f02-4213-a560-1f7696277d76	2c5fd935-c489-41f4-be87-eda2243aebfb	\N
47eb67fc-ae78-444b-ab5d-6141636b54a8	98f32754-80e4-4835-9a83-e9a8a40cebad	t	${role_view-profile}	view-profile	9a97cd68-2f02-4213-a560-1f7696277d76	98f32754-80e4-4835-9a83-e9a8a40cebad	\N
706f5a97-24be-434c-b7ed-f36cbfc9c011	98f32754-80e4-4835-9a83-e9a8a40cebad	t	${role_manage-account}	manage-account	9a97cd68-2f02-4213-a560-1f7696277d76	98f32754-80e4-4835-9a83-e9a8a40cebad	\N
00853ab2-a5d4-433a-a72d-51f65fedfa9d	98f32754-80e4-4835-9a83-e9a8a40cebad	t	${role_manage-account-links}	manage-account-links	9a97cd68-2f02-4213-a560-1f7696277d76	98f32754-80e4-4835-9a83-e9a8a40cebad	\N
b60a8e1f-9473-4935-8056-7351991030fe	98f32754-80e4-4835-9a83-e9a8a40cebad	t	${role_view-applications}	view-applications	9a97cd68-2f02-4213-a560-1f7696277d76	98f32754-80e4-4835-9a83-e9a8a40cebad	\N
4be6b85d-e7fb-4a82-9d91-1a16298ec308	98f32754-80e4-4835-9a83-e9a8a40cebad	t	${role_view-consent}	view-consent	9a97cd68-2f02-4213-a560-1f7696277d76	98f32754-80e4-4835-9a83-e9a8a40cebad	\N
8c6d8001-ffdc-4361-91cc-51e760c6ed97	98f32754-80e4-4835-9a83-e9a8a40cebad	t	${role_manage-consent}	manage-consent	9a97cd68-2f02-4213-a560-1f7696277d76	98f32754-80e4-4835-9a83-e9a8a40cebad	\N
d5b48abf-7451-4f9d-8251-7ff9616103ca	98f32754-80e4-4835-9a83-e9a8a40cebad	t	${role_view-groups}	view-groups	9a97cd68-2f02-4213-a560-1f7696277d76	98f32754-80e4-4835-9a83-e9a8a40cebad	\N
b6fb1919-84ec-4abb-802d-8b2f17378a99	98f32754-80e4-4835-9a83-e9a8a40cebad	t	${role_delete-account}	delete-account	9a97cd68-2f02-4213-a560-1f7696277d76	98f32754-80e4-4835-9a83-e9a8a40cebad	\N
a088fe46-35e7-48d2-9a8c-eac0024da26b	c7c13253-98e4-4b5e-9b7f-634298c5e8a5	t	${role_read-token}	read-token	9a97cd68-2f02-4213-a560-1f7696277d76	c7c13253-98e4-4b5e-9b7f-634298c5e8a5	\N
66f9c1c2-cde8-434f-9fa2-c88b1342e52c	2c5fd935-c489-41f4-be87-eda2243aebfb	t	${role_impersonation}	impersonation	9a97cd68-2f02-4213-a560-1f7696277d76	2c5fd935-c489-41f4-be87-eda2243aebfb	\N
d737b4b1-a6bd-4e9c-aaf7-4041ec0082b9	9a97cd68-2f02-4213-a560-1f7696277d76	f	${role_offline-access}	offline_access	9a97cd68-2f02-4213-a560-1f7696277d76	\N	\N
7c012943-0b3d-4314-a2de-2149939df504	9a97cd68-2f02-4213-a560-1f7696277d76	f	${role_uma_authorization}	uma_authorization	9a97cd68-2f02-4213-a560-1f7696277d76	\N	\N
57259c62-3a25-49de-8783-6266b70da763	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	f	${role_default-roles}	default-roles-inventory	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	\N	\N
2ed72307-17f4-4ed1-8edd-52a8835654ef	bb1f96ce-d16a-43eb-885b-8a43e65bda94	t	${role_create-client}	create-client	9a97cd68-2f02-4213-a560-1f7696277d76	bb1f96ce-d16a-43eb-885b-8a43e65bda94	\N
1ed7b518-a9f5-4bfd-83ff-bcdc6427d239	bb1f96ce-d16a-43eb-885b-8a43e65bda94	t	${role_view-realm}	view-realm	9a97cd68-2f02-4213-a560-1f7696277d76	bb1f96ce-d16a-43eb-885b-8a43e65bda94	\N
2002605b-6da0-4a63-918a-d8448313cff7	bb1f96ce-d16a-43eb-885b-8a43e65bda94	t	${role_view-users}	view-users	9a97cd68-2f02-4213-a560-1f7696277d76	bb1f96ce-d16a-43eb-885b-8a43e65bda94	\N
ff8e3756-2b6b-401a-8fdf-f7f493f1c566	bb1f96ce-d16a-43eb-885b-8a43e65bda94	t	${role_view-clients}	view-clients	9a97cd68-2f02-4213-a560-1f7696277d76	bb1f96ce-d16a-43eb-885b-8a43e65bda94	\N
3583eabb-791f-4771-9b7e-43714dad6b45	bb1f96ce-d16a-43eb-885b-8a43e65bda94	t	${role_view-events}	view-events	9a97cd68-2f02-4213-a560-1f7696277d76	bb1f96ce-d16a-43eb-885b-8a43e65bda94	\N
d2598ca7-3992-42be-9761-622e022618da	bb1f96ce-d16a-43eb-885b-8a43e65bda94	t	${role_view-identity-providers}	view-identity-providers	9a97cd68-2f02-4213-a560-1f7696277d76	bb1f96ce-d16a-43eb-885b-8a43e65bda94	\N
0fc9ec6a-8ec8-4569-a0b7-42d57e918c83	bb1f96ce-d16a-43eb-885b-8a43e65bda94	t	${role_view-authorization}	view-authorization	9a97cd68-2f02-4213-a560-1f7696277d76	bb1f96ce-d16a-43eb-885b-8a43e65bda94	\N
dab18e0a-d6b1-4d09-961b-6ec32b77cf03	bb1f96ce-d16a-43eb-885b-8a43e65bda94	t	${role_manage-realm}	manage-realm	9a97cd68-2f02-4213-a560-1f7696277d76	bb1f96ce-d16a-43eb-885b-8a43e65bda94	\N
d3178e1f-f0ab-4196-aae6-6f8d4fe091fc	bb1f96ce-d16a-43eb-885b-8a43e65bda94	t	${role_manage-users}	manage-users	9a97cd68-2f02-4213-a560-1f7696277d76	bb1f96ce-d16a-43eb-885b-8a43e65bda94	\N
c9def11c-e71f-4b43-a7e5-5462f72741a9	bb1f96ce-d16a-43eb-885b-8a43e65bda94	t	${role_manage-clients}	manage-clients	9a97cd68-2f02-4213-a560-1f7696277d76	bb1f96ce-d16a-43eb-885b-8a43e65bda94	\N
85d6e6bb-785f-4068-8491-daaa6b07d593	bb1f96ce-d16a-43eb-885b-8a43e65bda94	t	${role_manage-events}	manage-events	9a97cd68-2f02-4213-a560-1f7696277d76	bb1f96ce-d16a-43eb-885b-8a43e65bda94	\N
af7bc791-530a-4f82-a9a2-6edf074f9601	bb1f96ce-d16a-43eb-885b-8a43e65bda94	t	${role_manage-identity-providers}	manage-identity-providers	9a97cd68-2f02-4213-a560-1f7696277d76	bb1f96ce-d16a-43eb-885b-8a43e65bda94	\N
46c85d95-b071-465b-a830-1e005c62834e	bb1f96ce-d16a-43eb-885b-8a43e65bda94	t	${role_manage-authorization}	manage-authorization	9a97cd68-2f02-4213-a560-1f7696277d76	bb1f96ce-d16a-43eb-885b-8a43e65bda94	\N
d7062474-2755-415a-82a9-6b6535d9714d	bb1f96ce-d16a-43eb-885b-8a43e65bda94	t	${role_query-users}	query-users	9a97cd68-2f02-4213-a560-1f7696277d76	bb1f96ce-d16a-43eb-885b-8a43e65bda94	\N
db51de87-f3a6-474e-bae2-2c9c328d5ffb	bb1f96ce-d16a-43eb-885b-8a43e65bda94	t	${role_query-clients}	query-clients	9a97cd68-2f02-4213-a560-1f7696277d76	bb1f96ce-d16a-43eb-885b-8a43e65bda94	\N
ef745fb3-100a-4c1d-a4ee-bdf9a346fdc4	bb1f96ce-d16a-43eb-885b-8a43e65bda94	t	${role_query-realms}	query-realms	9a97cd68-2f02-4213-a560-1f7696277d76	bb1f96ce-d16a-43eb-885b-8a43e65bda94	\N
84df03d6-c73e-4b96-9a0f-276f1ee3ff78	bb1f96ce-d16a-43eb-885b-8a43e65bda94	t	${role_query-groups}	query-groups	9a97cd68-2f02-4213-a560-1f7696277d76	bb1f96ce-d16a-43eb-885b-8a43e65bda94	\N
dbad86a3-354e-47dd-bc04-191ea51598c4	812e1083-38a9-403b-a664-ca02cced092e	t	${role_realm-admin}	realm-admin	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	812e1083-38a9-403b-a664-ca02cced092e	\N
5ce68e24-3df8-4c69-9041-f55884053691	812e1083-38a9-403b-a664-ca02cced092e	t	${role_create-client}	create-client	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	812e1083-38a9-403b-a664-ca02cced092e	\N
4cdca85c-394c-471b-8e10-27c57252bf7b	812e1083-38a9-403b-a664-ca02cced092e	t	${role_view-realm}	view-realm	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	812e1083-38a9-403b-a664-ca02cced092e	\N
75e7b6a4-5938-433d-a26b-58f393a6b2eb	812e1083-38a9-403b-a664-ca02cced092e	t	${role_view-users}	view-users	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	812e1083-38a9-403b-a664-ca02cced092e	\N
6089c606-bc83-4a4d-9018-9512951fd516	812e1083-38a9-403b-a664-ca02cced092e	t	${role_view-clients}	view-clients	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	812e1083-38a9-403b-a664-ca02cced092e	\N
c87be5c2-2489-4984-b12b-7d8007538dcd	812e1083-38a9-403b-a664-ca02cced092e	t	${role_view-events}	view-events	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	812e1083-38a9-403b-a664-ca02cced092e	\N
5fc08bb7-fb12-470a-97f8-3f27c1adb0bd	812e1083-38a9-403b-a664-ca02cced092e	t	${role_view-identity-providers}	view-identity-providers	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	812e1083-38a9-403b-a664-ca02cced092e	\N
4520ec7f-72d1-4860-b2f4-6e0db13c907c	812e1083-38a9-403b-a664-ca02cced092e	t	${role_view-authorization}	view-authorization	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	812e1083-38a9-403b-a664-ca02cced092e	\N
675acd12-1884-468d-aed8-5220e8cba60e	812e1083-38a9-403b-a664-ca02cced092e	t	${role_manage-realm}	manage-realm	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	812e1083-38a9-403b-a664-ca02cced092e	\N
5f45979b-0d24-4680-90d1-58ce9cb0917b	812e1083-38a9-403b-a664-ca02cced092e	t	${role_manage-users}	manage-users	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	812e1083-38a9-403b-a664-ca02cced092e	\N
d6d98e00-f7ba-4925-ba1c-327b45de279d	812e1083-38a9-403b-a664-ca02cced092e	t	${role_manage-clients}	manage-clients	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	812e1083-38a9-403b-a664-ca02cced092e	\N
a3ac365f-8814-40d6-8c4f-82f06d860a43	812e1083-38a9-403b-a664-ca02cced092e	t	${role_manage-events}	manage-events	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	812e1083-38a9-403b-a664-ca02cced092e	\N
a9888621-dc08-4400-81ba-27bd16a4b1b9	812e1083-38a9-403b-a664-ca02cced092e	t	${role_manage-identity-providers}	manage-identity-providers	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	812e1083-38a9-403b-a664-ca02cced092e	\N
c81c1eac-eb05-4524-8acd-cd03cc701f3e	812e1083-38a9-403b-a664-ca02cced092e	t	${role_manage-authorization}	manage-authorization	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	812e1083-38a9-403b-a664-ca02cced092e	\N
c937b333-932b-4bbe-9a4d-0da3ca48c983	812e1083-38a9-403b-a664-ca02cced092e	t	${role_query-users}	query-users	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	812e1083-38a9-403b-a664-ca02cced092e	\N
f5c2899d-6f8b-45f4-96b6-024f75ca2586	812e1083-38a9-403b-a664-ca02cced092e	t	${role_query-clients}	query-clients	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	812e1083-38a9-403b-a664-ca02cced092e	\N
a8d1b454-ab2a-4726-8d6e-cccdedf8930f	812e1083-38a9-403b-a664-ca02cced092e	t	${role_query-realms}	query-realms	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	812e1083-38a9-403b-a664-ca02cced092e	\N
40a40f54-d08e-4f25-83e4-1c9f33d70a33	812e1083-38a9-403b-a664-ca02cced092e	t	${role_query-groups}	query-groups	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	812e1083-38a9-403b-a664-ca02cced092e	\N
dec0c118-2ab8-4795-9c41-9dd641064125	08070c05-e13c-4eb2-8afd-b4d4b5b58691	t	${role_view-profile}	view-profile	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	08070c05-e13c-4eb2-8afd-b4d4b5b58691	\N
b483f57e-3b13-4eb3-be6e-4afd09933af0	08070c05-e13c-4eb2-8afd-b4d4b5b58691	t	${role_manage-account}	manage-account	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	08070c05-e13c-4eb2-8afd-b4d4b5b58691	\N
7fa4c3b2-a2ba-4f2c-aeba-cf1d1cf7ca52	08070c05-e13c-4eb2-8afd-b4d4b5b58691	t	${role_manage-account-links}	manage-account-links	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	08070c05-e13c-4eb2-8afd-b4d4b5b58691	\N
d65b48a3-4ecc-4b57-b38a-c7884a160448	08070c05-e13c-4eb2-8afd-b4d4b5b58691	t	${role_view-applications}	view-applications	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	08070c05-e13c-4eb2-8afd-b4d4b5b58691	\N
fdab071a-b892-4324-bccf-db91adb14883	08070c05-e13c-4eb2-8afd-b4d4b5b58691	t	${role_view-consent}	view-consent	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	08070c05-e13c-4eb2-8afd-b4d4b5b58691	\N
15e06fff-36f5-47d8-a6ea-9e41384933f3	08070c05-e13c-4eb2-8afd-b4d4b5b58691	t	${role_manage-consent}	manage-consent	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	08070c05-e13c-4eb2-8afd-b4d4b5b58691	\N
0b095e87-ca67-420b-a051-805de295565c	08070c05-e13c-4eb2-8afd-b4d4b5b58691	t	${role_view-groups}	view-groups	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	08070c05-e13c-4eb2-8afd-b4d4b5b58691	\N
7872921c-ddc8-4802-adc8-b7cfdb2a30d6	08070c05-e13c-4eb2-8afd-b4d4b5b58691	t	${role_delete-account}	delete-account	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	08070c05-e13c-4eb2-8afd-b4d4b5b58691	\N
55d89044-e68b-4707-a2e3-51cd0d9896d9	bb1f96ce-d16a-43eb-885b-8a43e65bda94	t	${role_impersonation}	impersonation	9a97cd68-2f02-4213-a560-1f7696277d76	bb1f96ce-d16a-43eb-885b-8a43e65bda94	\N
71feae85-acca-40ce-a7c9-3b39128f5389	812e1083-38a9-403b-a664-ca02cced092e	t	${role_impersonation}	impersonation	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	812e1083-38a9-403b-a664-ca02cced092e	\N
375716ee-6035-4086-a97c-1bc2e99f98e4	5289f5f1-e9d3-4593-8ab8-8bb40aed188e	t	${role_read-token}	read-token	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	5289f5f1-e9d3-4593-8ab8-8bb40aed188e	\N
276c902b-cc02-4db0-87be-ea9876a02ac7	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	f	${role_offline-access}	offline_access	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	\N	\N
5181f235-894f-42fc-8ccc-4cd01650128b	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	f	Super Administrador - Acceso total al sistema	SUPER_ADMINISTRADOR	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	\N	\N
43964e18-2d94-42d5-9285-dfa35b2f6cd6	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	f	Administrador - Gestión operativa del negocio	ADMINISTRADOR	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	\N	\N
efbe0220-8a18-4ff9-b127-e54642a6d7a4	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	f	Cajero - Operaciones de venta y caja	CAJERO	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	\N	\N
a457f4bf-0cad-48d3-9560-5e057d2ecb74	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	f	${role_uma_authorization}	uma_authorization	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	\N	\N
\.


--
-- Data for Name: migration_model; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.migration_model (id, version, update_time) FROM stdin;
il2ig	25.0.6	1779118658
\.


--
-- Data for Name: offline_client_session; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.offline_client_session (user_session_id, client_id, offline_flag, "timestamp", data, client_storage_provider, external_client_id, version) FROM stdin;
\.


--
-- Data for Name: offline_user_session; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.offline_user_session (user_session_id, user_id, realm_id, created_on, offline_flag, data, last_session_refresh, broker_session_id, version) FROM stdin;
\.


--
-- Data for Name: org; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.org (id, enabled, realm_id, group_id, name, description) FROM stdin;
\.


--
-- Data for Name: org_domain; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.org_domain (id, name, verified, org_id) FROM stdin;
\.


--
-- Data for Name: policy_config; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.policy_config (policy_id, name, value) FROM stdin;
\.


--
-- Data for Name: protocol_mapper; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.protocol_mapper (id, name, protocol, protocol_mapper_name, client_id, client_scope_id) FROM stdin;
db6312ac-44d4-46df-9584-929168b549d1	audience resolve	openid-connect	oidc-audience-resolve-mapper	ca7ffbf1-c30a-4a29-90f3-86c70d437ed1	\N
d919466c-58b4-45bf-bcd9-832b7a959289	locale	openid-connect	oidc-usermodel-attribute-mapper	a68e7ff4-fbc6-4374-a503-802a347de6ac	\N
191112cf-a630-4fd0-ab87-26d948493bf7	role list	saml	saml-role-list-mapper	\N	26ff69ff-a806-4230-8bac-7e6d098b2904
508caed3-afd3-4cc1-978a-72f32e6739a0	full name	openid-connect	oidc-full-name-mapper	\N	11a2da8a-20e6-4b1e-bcaf-8462982dd828
976c4907-d912-4dae-90f3-de124f4302c6	family name	openid-connect	oidc-usermodel-attribute-mapper	\N	11a2da8a-20e6-4b1e-bcaf-8462982dd828
f06db8bb-894b-429c-a0d8-2259438aa57b	given name	openid-connect	oidc-usermodel-attribute-mapper	\N	11a2da8a-20e6-4b1e-bcaf-8462982dd828
12e574f3-ace2-439a-aa2d-13f69761b127	middle name	openid-connect	oidc-usermodel-attribute-mapper	\N	11a2da8a-20e6-4b1e-bcaf-8462982dd828
15cf3748-6246-4d91-a08d-bfb901fb5901	nickname	openid-connect	oidc-usermodel-attribute-mapper	\N	11a2da8a-20e6-4b1e-bcaf-8462982dd828
273cafd1-53ef-48bf-8633-818a6299f003	username	openid-connect	oidc-usermodel-attribute-mapper	\N	11a2da8a-20e6-4b1e-bcaf-8462982dd828
51174d8d-3b38-429d-a5ec-62ba40725dc2	profile	openid-connect	oidc-usermodel-attribute-mapper	\N	11a2da8a-20e6-4b1e-bcaf-8462982dd828
f2beb9bb-978e-4d4c-92cf-c67303f95ab9	picture	openid-connect	oidc-usermodel-attribute-mapper	\N	11a2da8a-20e6-4b1e-bcaf-8462982dd828
a1b13587-40bc-4df6-bf45-625f8226b2df	website	openid-connect	oidc-usermodel-attribute-mapper	\N	11a2da8a-20e6-4b1e-bcaf-8462982dd828
f1ad44bc-41ea-4899-8ba0-cab8f84254fa	gender	openid-connect	oidc-usermodel-attribute-mapper	\N	11a2da8a-20e6-4b1e-bcaf-8462982dd828
e3ecbb11-60c6-4bfd-b1d2-72ad58f6c6a5	birthdate	openid-connect	oidc-usermodel-attribute-mapper	\N	11a2da8a-20e6-4b1e-bcaf-8462982dd828
6df68d3a-0bf7-4820-a770-4ee00aaec554	zoneinfo	openid-connect	oidc-usermodel-attribute-mapper	\N	11a2da8a-20e6-4b1e-bcaf-8462982dd828
344907ad-5397-4a07-8570-32f6c7237f5e	locale	openid-connect	oidc-usermodel-attribute-mapper	\N	11a2da8a-20e6-4b1e-bcaf-8462982dd828
ed50f687-47ea-452d-8fa4-d87ece5bb4f8	updated at	openid-connect	oidc-usermodel-attribute-mapper	\N	11a2da8a-20e6-4b1e-bcaf-8462982dd828
6801afe5-cfeb-468a-a207-c599d90d2115	email	openid-connect	oidc-usermodel-attribute-mapper	\N	da2b9ae6-97e4-4242-9cdf-e88fdc2575e1
a7a77246-505d-4e28-a4eb-484baf687b54	email verified	openid-connect	oidc-usermodel-property-mapper	\N	da2b9ae6-97e4-4242-9cdf-e88fdc2575e1
bec3613c-f948-4a87-81b5-77c3c4b5464b	address	openid-connect	oidc-address-mapper	\N	ce197625-f7b0-41f2-b8e1-09ab8ca56489
660cbf11-9cea-463a-97f9-95a1e8a917c4	phone number	openid-connect	oidc-usermodel-attribute-mapper	\N	764d3a1f-f825-45e2-bddc-606de70b90b0
d5e7de8d-7b9a-43cd-9018-503e503b17fb	phone number verified	openid-connect	oidc-usermodel-attribute-mapper	\N	764d3a1f-f825-45e2-bddc-606de70b90b0
7bde36da-a290-4716-ae3e-5d339749f896	realm roles	openid-connect	oidc-usermodel-realm-role-mapper	\N	dec2dada-bcd5-453a-a45c-43c7e6964497
8478f4a3-7f67-4c83-8963-a40d796ae091	client roles	openid-connect	oidc-usermodel-client-role-mapper	\N	dec2dada-bcd5-453a-a45c-43c7e6964497
efe96f86-2178-434b-b4db-0308e34ae068	audience resolve	openid-connect	oidc-audience-resolve-mapper	\N	dec2dada-bcd5-453a-a45c-43c7e6964497
24b53d2f-5ace-4b68-a79c-146ef0aa4fd4	allowed web origins	openid-connect	oidc-allowed-origins-mapper	\N	caaf5764-484b-44f0-b64f-7062584ceec6
7c2e97e2-bedd-4246-9a01-9b49bd5a4a68	upn	openid-connect	oidc-usermodel-attribute-mapper	\N	ca339a4d-498e-4b02-96cc-d5c0170808da
182b7a95-ec37-4e91-a81c-dfa6b1ee581f	groups	openid-connect	oidc-usermodel-realm-role-mapper	\N	ca339a4d-498e-4b02-96cc-d5c0170808da
86051821-7396-4cd2-8ea1-4165864eb8a2	acr loa level	openid-connect	oidc-acr-mapper	\N	78b18b42-4294-486f-860e-65bc75620250
6bc7b8c7-3dac-4892-8299-0e3291b6fec4	auth_time	openid-connect	oidc-usersessionmodel-note-mapper	\N	cb7af951-ab7f-43e9-b85e-61d295a8c2c8
34c81297-0eba-4061-8abd-d282581ea8b8	sub	openid-connect	oidc-sub-mapper	\N	cb7af951-ab7f-43e9-b85e-61d295a8c2c8
e0a89511-e91c-4e07-8179-26efdff2e111	audience resolve	openid-connect	oidc-audience-resolve-mapper	f5bec733-cf3b-4eb3-a759-9dcd218c0b9e	\N
05039433-a304-442d-a593-a41634c4a4df	role list	saml	saml-role-list-mapper	\N	d6ac81dc-9f4d-4792-b3d6-5a58d61449ec
2dd0574d-a049-43fe-8864-dd43319084dd	full name	openid-connect	oidc-full-name-mapper	\N	0ffbd751-1a8f-4206-bde0-09d0b944ef3a
629b03d5-044b-4748-bd9c-f45b46ab9328	family name	openid-connect	oidc-usermodel-attribute-mapper	\N	0ffbd751-1a8f-4206-bde0-09d0b944ef3a
50daaa95-dfa2-486d-b9ce-8a92c5ba2170	given name	openid-connect	oidc-usermodel-attribute-mapper	\N	0ffbd751-1a8f-4206-bde0-09d0b944ef3a
d4689541-75c7-4780-9196-e568f248362d	middle name	openid-connect	oidc-usermodel-attribute-mapper	\N	0ffbd751-1a8f-4206-bde0-09d0b944ef3a
b8a8fcdf-7a70-4b73-8ad1-9f29ff63d2ca	nickname	openid-connect	oidc-usermodel-attribute-mapper	\N	0ffbd751-1a8f-4206-bde0-09d0b944ef3a
bc6721af-a125-47fd-8044-e63b59fe8e88	username	openid-connect	oidc-usermodel-attribute-mapper	\N	0ffbd751-1a8f-4206-bde0-09d0b944ef3a
97e1356a-354d-4668-bfcd-d87a456a9836	profile	openid-connect	oidc-usermodel-attribute-mapper	\N	0ffbd751-1a8f-4206-bde0-09d0b944ef3a
049f98cf-517c-4253-80d7-4eca31c86fc1	picture	openid-connect	oidc-usermodel-attribute-mapper	\N	0ffbd751-1a8f-4206-bde0-09d0b944ef3a
04ab3ad3-63fa-44a3-82ec-88d64d3d8b90	website	openid-connect	oidc-usermodel-attribute-mapper	\N	0ffbd751-1a8f-4206-bde0-09d0b944ef3a
f7eb18bc-2c0b-4f76-9b26-9e47048b4a5c	gender	openid-connect	oidc-usermodel-attribute-mapper	\N	0ffbd751-1a8f-4206-bde0-09d0b944ef3a
b3406a84-ccbc-41ff-b20e-fa74fb2b3ee0	birthdate	openid-connect	oidc-usermodel-attribute-mapper	\N	0ffbd751-1a8f-4206-bde0-09d0b944ef3a
a5af0b81-32c9-457f-ba0d-ea2a33f86eee	zoneinfo	openid-connect	oidc-usermodel-attribute-mapper	\N	0ffbd751-1a8f-4206-bde0-09d0b944ef3a
7726bead-2ad8-4f43-a388-546a600d7c04	locale	openid-connect	oidc-usermodel-attribute-mapper	\N	0ffbd751-1a8f-4206-bde0-09d0b944ef3a
821c5309-2e61-4477-ab93-1f19d3e10afc	updated at	openid-connect	oidc-usermodel-attribute-mapper	\N	0ffbd751-1a8f-4206-bde0-09d0b944ef3a
5f9758d3-c11a-410f-8006-50a594ec7896	email	openid-connect	oidc-usermodel-attribute-mapper	\N	bb7dbd7f-2b09-4922-938e-5d99fab04021
3486d73d-da09-4caf-9a74-6b61f6a330a0	email verified	openid-connect	oidc-usermodel-property-mapper	\N	bb7dbd7f-2b09-4922-938e-5d99fab04021
6d7aa28e-ad29-4df1-82d9-543ebf9040f5	address	openid-connect	oidc-address-mapper	\N	754bca75-7c68-44c1-9f53-4fd6cb5e05f1
88bcc1cc-36e4-4a71-9cc1-c232b2934511	phone number	openid-connect	oidc-usermodel-attribute-mapper	\N	50445a82-b24e-4c9a-8336-5cea7d2ae817
6521bd13-7276-4d59-8ab7-f6350f60afa2	phone number verified	openid-connect	oidc-usermodel-attribute-mapper	\N	50445a82-b24e-4c9a-8336-5cea7d2ae817
8fed2877-83e7-4326-924e-da4f0e1d6e05	realm roles	openid-connect	oidc-usermodel-realm-role-mapper	\N	d927e25c-aab0-4793-a247-bb2ed7fcfdfb
d06475da-50b9-494f-8c44-0d9f92c274cb	client roles	openid-connect	oidc-usermodel-client-role-mapper	\N	d927e25c-aab0-4793-a247-bb2ed7fcfdfb
c55658cc-0011-44b9-af32-a9d807887edd	audience resolve	openid-connect	oidc-audience-resolve-mapper	\N	d927e25c-aab0-4793-a247-bb2ed7fcfdfb
87130081-3ac8-4a69-941a-1ff4ba1898f0	allowed web origins	openid-connect	oidc-allowed-origins-mapper	\N	ab825560-c7fa-49a7-8c72-626787c363bc
b853f485-52bf-4858-b05b-1aa904051e4c	upn	openid-connect	oidc-usermodel-attribute-mapper	\N	e41a2773-48b0-4ae0-a929-87bfca1274c8
4c810e0c-16e6-46a9-bff1-af6451623f71	groups	openid-connect	oidc-usermodel-realm-role-mapper	\N	e41a2773-48b0-4ae0-a929-87bfca1274c8
f7b7430d-0fe8-4af3-8d55-7a98b5c13606	acr loa level	openid-connect	oidc-acr-mapper	\N	c79051b5-e811-40c2-beb8-e22a52ac9894
493a221d-43b5-4ecb-a345-5ac19d796b8e	auth_time	openid-connect	oidc-usersessionmodel-note-mapper	\N	5100f0ae-22ec-4175-aa7b-c7953eb64db4
cec18529-07e0-4dc9-b7a9-e079dae8e0e1	sub	openid-connect	oidc-sub-mapper	\N	5100f0ae-22ec-4175-aa7b-c7953eb64db4
409cd9a4-a712-407b-9fe1-cc08cca3d705	realm-roles	openid-connect	oidc-usermodel-realm-role-mapper	7e5c8c81-ae15-4638-8a35-cf3dc8e8f77c	\N
6e37cd61-1e14-4267-9eba-610463151f67	locale	openid-connect	oidc-usermodel-attribute-mapper	24136744-c2d9-4a78-b09f-a93579a78455	\N
\.


--
-- Data for Name: protocol_mapper_config; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.protocol_mapper_config (protocol_mapper_id, value, name) FROM stdin;
d919466c-58b4-45bf-bcd9-832b7a959289	true	introspection.token.claim
d919466c-58b4-45bf-bcd9-832b7a959289	true	userinfo.token.claim
d919466c-58b4-45bf-bcd9-832b7a959289	locale	user.attribute
d919466c-58b4-45bf-bcd9-832b7a959289	true	id.token.claim
d919466c-58b4-45bf-bcd9-832b7a959289	true	access.token.claim
d919466c-58b4-45bf-bcd9-832b7a959289	locale	claim.name
d919466c-58b4-45bf-bcd9-832b7a959289	String	jsonType.label
191112cf-a630-4fd0-ab87-26d948493bf7	false	single
191112cf-a630-4fd0-ab87-26d948493bf7	Basic	attribute.nameformat
191112cf-a630-4fd0-ab87-26d948493bf7	Role	attribute.name
12e574f3-ace2-439a-aa2d-13f69761b127	true	introspection.token.claim
12e574f3-ace2-439a-aa2d-13f69761b127	true	userinfo.token.claim
12e574f3-ace2-439a-aa2d-13f69761b127	middleName	user.attribute
12e574f3-ace2-439a-aa2d-13f69761b127	true	id.token.claim
12e574f3-ace2-439a-aa2d-13f69761b127	true	access.token.claim
12e574f3-ace2-439a-aa2d-13f69761b127	middle_name	claim.name
12e574f3-ace2-439a-aa2d-13f69761b127	String	jsonType.label
15cf3748-6246-4d91-a08d-bfb901fb5901	true	introspection.token.claim
15cf3748-6246-4d91-a08d-bfb901fb5901	true	userinfo.token.claim
15cf3748-6246-4d91-a08d-bfb901fb5901	nickname	user.attribute
15cf3748-6246-4d91-a08d-bfb901fb5901	true	id.token.claim
15cf3748-6246-4d91-a08d-bfb901fb5901	true	access.token.claim
15cf3748-6246-4d91-a08d-bfb901fb5901	nickname	claim.name
15cf3748-6246-4d91-a08d-bfb901fb5901	String	jsonType.label
273cafd1-53ef-48bf-8633-818a6299f003	true	introspection.token.claim
273cafd1-53ef-48bf-8633-818a6299f003	true	userinfo.token.claim
273cafd1-53ef-48bf-8633-818a6299f003	username	user.attribute
273cafd1-53ef-48bf-8633-818a6299f003	true	id.token.claim
273cafd1-53ef-48bf-8633-818a6299f003	true	access.token.claim
273cafd1-53ef-48bf-8633-818a6299f003	preferred_username	claim.name
273cafd1-53ef-48bf-8633-818a6299f003	String	jsonType.label
344907ad-5397-4a07-8570-32f6c7237f5e	true	introspection.token.claim
344907ad-5397-4a07-8570-32f6c7237f5e	true	userinfo.token.claim
344907ad-5397-4a07-8570-32f6c7237f5e	locale	user.attribute
344907ad-5397-4a07-8570-32f6c7237f5e	true	id.token.claim
344907ad-5397-4a07-8570-32f6c7237f5e	true	access.token.claim
344907ad-5397-4a07-8570-32f6c7237f5e	locale	claim.name
344907ad-5397-4a07-8570-32f6c7237f5e	String	jsonType.label
508caed3-afd3-4cc1-978a-72f32e6739a0	true	introspection.token.claim
508caed3-afd3-4cc1-978a-72f32e6739a0	true	userinfo.token.claim
508caed3-afd3-4cc1-978a-72f32e6739a0	true	id.token.claim
508caed3-afd3-4cc1-978a-72f32e6739a0	true	access.token.claim
51174d8d-3b38-429d-a5ec-62ba40725dc2	true	introspection.token.claim
51174d8d-3b38-429d-a5ec-62ba40725dc2	true	userinfo.token.claim
51174d8d-3b38-429d-a5ec-62ba40725dc2	profile	user.attribute
51174d8d-3b38-429d-a5ec-62ba40725dc2	true	id.token.claim
51174d8d-3b38-429d-a5ec-62ba40725dc2	true	access.token.claim
51174d8d-3b38-429d-a5ec-62ba40725dc2	profile	claim.name
51174d8d-3b38-429d-a5ec-62ba40725dc2	String	jsonType.label
6df68d3a-0bf7-4820-a770-4ee00aaec554	true	introspection.token.claim
6df68d3a-0bf7-4820-a770-4ee00aaec554	true	userinfo.token.claim
6df68d3a-0bf7-4820-a770-4ee00aaec554	zoneinfo	user.attribute
6df68d3a-0bf7-4820-a770-4ee00aaec554	true	id.token.claim
6df68d3a-0bf7-4820-a770-4ee00aaec554	true	access.token.claim
6df68d3a-0bf7-4820-a770-4ee00aaec554	zoneinfo	claim.name
6df68d3a-0bf7-4820-a770-4ee00aaec554	String	jsonType.label
976c4907-d912-4dae-90f3-de124f4302c6	true	introspection.token.claim
976c4907-d912-4dae-90f3-de124f4302c6	true	userinfo.token.claim
976c4907-d912-4dae-90f3-de124f4302c6	lastName	user.attribute
976c4907-d912-4dae-90f3-de124f4302c6	true	id.token.claim
976c4907-d912-4dae-90f3-de124f4302c6	true	access.token.claim
976c4907-d912-4dae-90f3-de124f4302c6	family_name	claim.name
976c4907-d912-4dae-90f3-de124f4302c6	String	jsonType.label
a1b13587-40bc-4df6-bf45-625f8226b2df	true	introspection.token.claim
a1b13587-40bc-4df6-bf45-625f8226b2df	true	userinfo.token.claim
a1b13587-40bc-4df6-bf45-625f8226b2df	website	user.attribute
a1b13587-40bc-4df6-bf45-625f8226b2df	true	id.token.claim
a1b13587-40bc-4df6-bf45-625f8226b2df	true	access.token.claim
a1b13587-40bc-4df6-bf45-625f8226b2df	website	claim.name
a1b13587-40bc-4df6-bf45-625f8226b2df	String	jsonType.label
e3ecbb11-60c6-4bfd-b1d2-72ad58f6c6a5	true	introspection.token.claim
e3ecbb11-60c6-4bfd-b1d2-72ad58f6c6a5	true	userinfo.token.claim
e3ecbb11-60c6-4bfd-b1d2-72ad58f6c6a5	birthdate	user.attribute
e3ecbb11-60c6-4bfd-b1d2-72ad58f6c6a5	true	id.token.claim
e3ecbb11-60c6-4bfd-b1d2-72ad58f6c6a5	true	access.token.claim
e3ecbb11-60c6-4bfd-b1d2-72ad58f6c6a5	birthdate	claim.name
e3ecbb11-60c6-4bfd-b1d2-72ad58f6c6a5	String	jsonType.label
ed50f687-47ea-452d-8fa4-d87ece5bb4f8	true	introspection.token.claim
ed50f687-47ea-452d-8fa4-d87ece5bb4f8	true	userinfo.token.claim
ed50f687-47ea-452d-8fa4-d87ece5bb4f8	updatedAt	user.attribute
ed50f687-47ea-452d-8fa4-d87ece5bb4f8	true	id.token.claim
ed50f687-47ea-452d-8fa4-d87ece5bb4f8	true	access.token.claim
ed50f687-47ea-452d-8fa4-d87ece5bb4f8	updated_at	claim.name
ed50f687-47ea-452d-8fa4-d87ece5bb4f8	long	jsonType.label
f06db8bb-894b-429c-a0d8-2259438aa57b	true	introspection.token.claim
f06db8bb-894b-429c-a0d8-2259438aa57b	true	userinfo.token.claim
f06db8bb-894b-429c-a0d8-2259438aa57b	firstName	user.attribute
f06db8bb-894b-429c-a0d8-2259438aa57b	true	id.token.claim
f06db8bb-894b-429c-a0d8-2259438aa57b	true	access.token.claim
f06db8bb-894b-429c-a0d8-2259438aa57b	given_name	claim.name
f06db8bb-894b-429c-a0d8-2259438aa57b	String	jsonType.label
f1ad44bc-41ea-4899-8ba0-cab8f84254fa	true	introspection.token.claim
f1ad44bc-41ea-4899-8ba0-cab8f84254fa	true	userinfo.token.claim
f1ad44bc-41ea-4899-8ba0-cab8f84254fa	gender	user.attribute
f1ad44bc-41ea-4899-8ba0-cab8f84254fa	true	id.token.claim
f1ad44bc-41ea-4899-8ba0-cab8f84254fa	true	access.token.claim
f1ad44bc-41ea-4899-8ba0-cab8f84254fa	gender	claim.name
f1ad44bc-41ea-4899-8ba0-cab8f84254fa	String	jsonType.label
f2beb9bb-978e-4d4c-92cf-c67303f95ab9	true	introspection.token.claim
f2beb9bb-978e-4d4c-92cf-c67303f95ab9	true	userinfo.token.claim
f2beb9bb-978e-4d4c-92cf-c67303f95ab9	picture	user.attribute
f2beb9bb-978e-4d4c-92cf-c67303f95ab9	true	id.token.claim
f2beb9bb-978e-4d4c-92cf-c67303f95ab9	true	access.token.claim
f2beb9bb-978e-4d4c-92cf-c67303f95ab9	picture	claim.name
f2beb9bb-978e-4d4c-92cf-c67303f95ab9	String	jsonType.label
6801afe5-cfeb-468a-a207-c599d90d2115	true	introspection.token.claim
6801afe5-cfeb-468a-a207-c599d90d2115	true	userinfo.token.claim
6801afe5-cfeb-468a-a207-c599d90d2115	email	user.attribute
6801afe5-cfeb-468a-a207-c599d90d2115	true	id.token.claim
6801afe5-cfeb-468a-a207-c599d90d2115	true	access.token.claim
6801afe5-cfeb-468a-a207-c599d90d2115	email	claim.name
6801afe5-cfeb-468a-a207-c599d90d2115	String	jsonType.label
a7a77246-505d-4e28-a4eb-484baf687b54	true	introspection.token.claim
a7a77246-505d-4e28-a4eb-484baf687b54	true	userinfo.token.claim
a7a77246-505d-4e28-a4eb-484baf687b54	emailVerified	user.attribute
a7a77246-505d-4e28-a4eb-484baf687b54	true	id.token.claim
a7a77246-505d-4e28-a4eb-484baf687b54	true	access.token.claim
a7a77246-505d-4e28-a4eb-484baf687b54	email_verified	claim.name
a7a77246-505d-4e28-a4eb-484baf687b54	boolean	jsonType.label
bec3613c-f948-4a87-81b5-77c3c4b5464b	formatted	user.attribute.formatted
bec3613c-f948-4a87-81b5-77c3c4b5464b	country	user.attribute.country
bec3613c-f948-4a87-81b5-77c3c4b5464b	true	introspection.token.claim
bec3613c-f948-4a87-81b5-77c3c4b5464b	postal_code	user.attribute.postal_code
bec3613c-f948-4a87-81b5-77c3c4b5464b	true	userinfo.token.claim
bec3613c-f948-4a87-81b5-77c3c4b5464b	street	user.attribute.street
bec3613c-f948-4a87-81b5-77c3c4b5464b	true	id.token.claim
bec3613c-f948-4a87-81b5-77c3c4b5464b	region	user.attribute.region
bec3613c-f948-4a87-81b5-77c3c4b5464b	true	access.token.claim
bec3613c-f948-4a87-81b5-77c3c4b5464b	locality	user.attribute.locality
660cbf11-9cea-463a-97f9-95a1e8a917c4	true	introspection.token.claim
660cbf11-9cea-463a-97f9-95a1e8a917c4	true	userinfo.token.claim
660cbf11-9cea-463a-97f9-95a1e8a917c4	phoneNumber	user.attribute
660cbf11-9cea-463a-97f9-95a1e8a917c4	true	id.token.claim
660cbf11-9cea-463a-97f9-95a1e8a917c4	true	access.token.claim
660cbf11-9cea-463a-97f9-95a1e8a917c4	phone_number	claim.name
660cbf11-9cea-463a-97f9-95a1e8a917c4	String	jsonType.label
d5e7de8d-7b9a-43cd-9018-503e503b17fb	true	introspection.token.claim
d5e7de8d-7b9a-43cd-9018-503e503b17fb	true	userinfo.token.claim
d5e7de8d-7b9a-43cd-9018-503e503b17fb	phoneNumberVerified	user.attribute
d5e7de8d-7b9a-43cd-9018-503e503b17fb	true	id.token.claim
d5e7de8d-7b9a-43cd-9018-503e503b17fb	true	access.token.claim
d5e7de8d-7b9a-43cd-9018-503e503b17fb	phone_number_verified	claim.name
d5e7de8d-7b9a-43cd-9018-503e503b17fb	boolean	jsonType.label
7bde36da-a290-4716-ae3e-5d339749f896	true	introspection.token.claim
7bde36da-a290-4716-ae3e-5d339749f896	true	multivalued
7bde36da-a290-4716-ae3e-5d339749f896	foo	user.attribute
7bde36da-a290-4716-ae3e-5d339749f896	true	access.token.claim
7bde36da-a290-4716-ae3e-5d339749f896	realm_access.roles	claim.name
7bde36da-a290-4716-ae3e-5d339749f896	String	jsonType.label
8478f4a3-7f67-4c83-8963-a40d796ae091	true	introspection.token.claim
8478f4a3-7f67-4c83-8963-a40d796ae091	true	multivalued
8478f4a3-7f67-4c83-8963-a40d796ae091	foo	user.attribute
8478f4a3-7f67-4c83-8963-a40d796ae091	true	access.token.claim
8478f4a3-7f67-4c83-8963-a40d796ae091	resource_access.${client_id}.roles	claim.name
8478f4a3-7f67-4c83-8963-a40d796ae091	String	jsonType.label
efe96f86-2178-434b-b4db-0308e34ae068	true	introspection.token.claim
efe96f86-2178-434b-b4db-0308e34ae068	true	access.token.claim
24b53d2f-5ace-4b68-a79c-146ef0aa4fd4	true	introspection.token.claim
24b53d2f-5ace-4b68-a79c-146ef0aa4fd4	true	access.token.claim
182b7a95-ec37-4e91-a81c-dfa6b1ee581f	true	introspection.token.claim
182b7a95-ec37-4e91-a81c-dfa6b1ee581f	true	multivalued
182b7a95-ec37-4e91-a81c-dfa6b1ee581f	foo	user.attribute
182b7a95-ec37-4e91-a81c-dfa6b1ee581f	true	id.token.claim
182b7a95-ec37-4e91-a81c-dfa6b1ee581f	true	access.token.claim
182b7a95-ec37-4e91-a81c-dfa6b1ee581f	groups	claim.name
182b7a95-ec37-4e91-a81c-dfa6b1ee581f	String	jsonType.label
7c2e97e2-bedd-4246-9a01-9b49bd5a4a68	true	introspection.token.claim
7c2e97e2-bedd-4246-9a01-9b49bd5a4a68	true	userinfo.token.claim
7c2e97e2-bedd-4246-9a01-9b49bd5a4a68	username	user.attribute
7c2e97e2-bedd-4246-9a01-9b49bd5a4a68	true	id.token.claim
7c2e97e2-bedd-4246-9a01-9b49bd5a4a68	true	access.token.claim
7c2e97e2-bedd-4246-9a01-9b49bd5a4a68	upn	claim.name
7c2e97e2-bedd-4246-9a01-9b49bd5a4a68	String	jsonType.label
86051821-7396-4cd2-8ea1-4165864eb8a2	true	introspection.token.claim
86051821-7396-4cd2-8ea1-4165864eb8a2	true	id.token.claim
86051821-7396-4cd2-8ea1-4165864eb8a2	true	access.token.claim
34c81297-0eba-4061-8abd-d282581ea8b8	true	introspection.token.claim
34c81297-0eba-4061-8abd-d282581ea8b8	true	access.token.claim
6bc7b8c7-3dac-4892-8299-0e3291b6fec4	AUTH_TIME	user.session.note
6bc7b8c7-3dac-4892-8299-0e3291b6fec4	true	introspection.token.claim
6bc7b8c7-3dac-4892-8299-0e3291b6fec4	true	id.token.claim
6bc7b8c7-3dac-4892-8299-0e3291b6fec4	true	access.token.claim
6bc7b8c7-3dac-4892-8299-0e3291b6fec4	auth_time	claim.name
6bc7b8c7-3dac-4892-8299-0e3291b6fec4	long	jsonType.label
05039433-a304-442d-a593-a41634c4a4df	false	single
05039433-a304-442d-a593-a41634c4a4df	Basic	attribute.nameformat
05039433-a304-442d-a593-a41634c4a4df	Role	attribute.name
049f98cf-517c-4253-80d7-4eca31c86fc1	true	introspection.token.claim
049f98cf-517c-4253-80d7-4eca31c86fc1	true	userinfo.token.claim
049f98cf-517c-4253-80d7-4eca31c86fc1	picture	user.attribute
049f98cf-517c-4253-80d7-4eca31c86fc1	true	id.token.claim
049f98cf-517c-4253-80d7-4eca31c86fc1	true	access.token.claim
049f98cf-517c-4253-80d7-4eca31c86fc1	picture	claim.name
049f98cf-517c-4253-80d7-4eca31c86fc1	String	jsonType.label
04ab3ad3-63fa-44a3-82ec-88d64d3d8b90	true	introspection.token.claim
04ab3ad3-63fa-44a3-82ec-88d64d3d8b90	true	userinfo.token.claim
04ab3ad3-63fa-44a3-82ec-88d64d3d8b90	website	user.attribute
04ab3ad3-63fa-44a3-82ec-88d64d3d8b90	true	id.token.claim
04ab3ad3-63fa-44a3-82ec-88d64d3d8b90	true	access.token.claim
04ab3ad3-63fa-44a3-82ec-88d64d3d8b90	website	claim.name
04ab3ad3-63fa-44a3-82ec-88d64d3d8b90	String	jsonType.label
2dd0574d-a049-43fe-8864-dd43319084dd	true	introspection.token.claim
2dd0574d-a049-43fe-8864-dd43319084dd	true	userinfo.token.claim
2dd0574d-a049-43fe-8864-dd43319084dd	true	id.token.claim
2dd0574d-a049-43fe-8864-dd43319084dd	true	access.token.claim
50daaa95-dfa2-486d-b9ce-8a92c5ba2170	true	introspection.token.claim
50daaa95-dfa2-486d-b9ce-8a92c5ba2170	true	userinfo.token.claim
50daaa95-dfa2-486d-b9ce-8a92c5ba2170	firstName	user.attribute
50daaa95-dfa2-486d-b9ce-8a92c5ba2170	true	id.token.claim
50daaa95-dfa2-486d-b9ce-8a92c5ba2170	true	access.token.claim
50daaa95-dfa2-486d-b9ce-8a92c5ba2170	given_name	claim.name
50daaa95-dfa2-486d-b9ce-8a92c5ba2170	String	jsonType.label
629b03d5-044b-4748-bd9c-f45b46ab9328	true	introspection.token.claim
629b03d5-044b-4748-bd9c-f45b46ab9328	true	userinfo.token.claim
629b03d5-044b-4748-bd9c-f45b46ab9328	lastName	user.attribute
629b03d5-044b-4748-bd9c-f45b46ab9328	true	id.token.claim
629b03d5-044b-4748-bd9c-f45b46ab9328	true	access.token.claim
629b03d5-044b-4748-bd9c-f45b46ab9328	family_name	claim.name
629b03d5-044b-4748-bd9c-f45b46ab9328	String	jsonType.label
7726bead-2ad8-4f43-a388-546a600d7c04	true	introspection.token.claim
7726bead-2ad8-4f43-a388-546a600d7c04	true	userinfo.token.claim
7726bead-2ad8-4f43-a388-546a600d7c04	locale	user.attribute
7726bead-2ad8-4f43-a388-546a600d7c04	true	id.token.claim
7726bead-2ad8-4f43-a388-546a600d7c04	true	access.token.claim
7726bead-2ad8-4f43-a388-546a600d7c04	locale	claim.name
7726bead-2ad8-4f43-a388-546a600d7c04	String	jsonType.label
821c5309-2e61-4477-ab93-1f19d3e10afc	true	introspection.token.claim
821c5309-2e61-4477-ab93-1f19d3e10afc	true	userinfo.token.claim
821c5309-2e61-4477-ab93-1f19d3e10afc	updatedAt	user.attribute
821c5309-2e61-4477-ab93-1f19d3e10afc	true	id.token.claim
821c5309-2e61-4477-ab93-1f19d3e10afc	true	access.token.claim
821c5309-2e61-4477-ab93-1f19d3e10afc	updated_at	claim.name
821c5309-2e61-4477-ab93-1f19d3e10afc	long	jsonType.label
97e1356a-354d-4668-bfcd-d87a456a9836	true	introspection.token.claim
97e1356a-354d-4668-bfcd-d87a456a9836	true	userinfo.token.claim
97e1356a-354d-4668-bfcd-d87a456a9836	profile	user.attribute
97e1356a-354d-4668-bfcd-d87a456a9836	true	id.token.claim
97e1356a-354d-4668-bfcd-d87a456a9836	true	access.token.claim
97e1356a-354d-4668-bfcd-d87a456a9836	profile	claim.name
97e1356a-354d-4668-bfcd-d87a456a9836	String	jsonType.label
a5af0b81-32c9-457f-ba0d-ea2a33f86eee	true	introspection.token.claim
a5af0b81-32c9-457f-ba0d-ea2a33f86eee	true	userinfo.token.claim
a5af0b81-32c9-457f-ba0d-ea2a33f86eee	zoneinfo	user.attribute
a5af0b81-32c9-457f-ba0d-ea2a33f86eee	true	id.token.claim
a5af0b81-32c9-457f-ba0d-ea2a33f86eee	true	access.token.claim
a5af0b81-32c9-457f-ba0d-ea2a33f86eee	zoneinfo	claim.name
a5af0b81-32c9-457f-ba0d-ea2a33f86eee	String	jsonType.label
b3406a84-ccbc-41ff-b20e-fa74fb2b3ee0	true	introspection.token.claim
b3406a84-ccbc-41ff-b20e-fa74fb2b3ee0	true	userinfo.token.claim
b3406a84-ccbc-41ff-b20e-fa74fb2b3ee0	birthdate	user.attribute
b3406a84-ccbc-41ff-b20e-fa74fb2b3ee0	true	id.token.claim
b3406a84-ccbc-41ff-b20e-fa74fb2b3ee0	true	access.token.claim
b3406a84-ccbc-41ff-b20e-fa74fb2b3ee0	birthdate	claim.name
b3406a84-ccbc-41ff-b20e-fa74fb2b3ee0	String	jsonType.label
b8a8fcdf-7a70-4b73-8ad1-9f29ff63d2ca	true	introspection.token.claim
b8a8fcdf-7a70-4b73-8ad1-9f29ff63d2ca	true	userinfo.token.claim
b8a8fcdf-7a70-4b73-8ad1-9f29ff63d2ca	nickname	user.attribute
b8a8fcdf-7a70-4b73-8ad1-9f29ff63d2ca	true	id.token.claim
b8a8fcdf-7a70-4b73-8ad1-9f29ff63d2ca	true	access.token.claim
b8a8fcdf-7a70-4b73-8ad1-9f29ff63d2ca	nickname	claim.name
b8a8fcdf-7a70-4b73-8ad1-9f29ff63d2ca	String	jsonType.label
bc6721af-a125-47fd-8044-e63b59fe8e88	true	introspection.token.claim
bc6721af-a125-47fd-8044-e63b59fe8e88	true	userinfo.token.claim
bc6721af-a125-47fd-8044-e63b59fe8e88	username	user.attribute
bc6721af-a125-47fd-8044-e63b59fe8e88	true	id.token.claim
bc6721af-a125-47fd-8044-e63b59fe8e88	true	access.token.claim
bc6721af-a125-47fd-8044-e63b59fe8e88	preferred_username	claim.name
bc6721af-a125-47fd-8044-e63b59fe8e88	String	jsonType.label
d4689541-75c7-4780-9196-e568f248362d	true	introspection.token.claim
d4689541-75c7-4780-9196-e568f248362d	true	userinfo.token.claim
d4689541-75c7-4780-9196-e568f248362d	middleName	user.attribute
d4689541-75c7-4780-9196-e568f248362d	true	id.token.claim
d4689541-75c7-4780-9196-e568f248362d	true	access.token.claim
d4689541-75c7-4780-9196-e568f248362d	middle_name	claim.name
d4689541-75c7-4780-9196-e568f248362d	String	jsonType.label
f7eb18bc-2c0b-4f76-9b26-9e47048b4a5c	true	introspection.token.claim
f7eb18bc-2c0b-4f76-9b26-9e47048b4a5c	true	userinfo.token.claim
f7eb18bc-2c0b-4f76-9b26-9e47048b4a5c	gender	user.attribute
f7eb18bc-2c0b-4f76-9b26-9e47048b4a5c	true	id.token.claim
f7eb18bc-2c0b-4f76-9b26-9e47048b4a5c	true	access.token.claim
f7eb18bc-2c0b-4f76-9b26-9e47048b4a5c	gender	claim.name
f7eb18bc-2c0b-4f76-9b26-9e47048b4a5c	String	jsonType.label
3486d73d-da09-4caf-9a74-6b61f6a330a0	true	introspection.token.claim
3486d73d-da09-4caf-9a74-6b61f6a330a0	true	userinfo.token.claim
3486d73d-da09-4caf-9a74-6b61f6a330a0	emailVerified	user.attribute
3486d73d-da09-4caf-9a74-6b61f6a330a0	true	id.token.claim
3486d73d-da09-4caf-9a74-6b61f6a330a0	true	access.token.claim
3486d73d-da09-4caf-9a74-6b61f6a330a0	email_verified	claim.name
3486d73d-da09-4caf-9a74-6b61f6a330a0	boolean	jsonType.label
5f9758d3-c11a-410f-8006-50a594ec7896	true	introspection.token.claim
5f9758d3-c11a-410f-8006-50a594ec7896	true	userinfo.token.claim
5f9758d3-c11a-410f-8006-50a594ec7896	email	user.attribute
5f9758d3-c11a-410f-8006-50a594ec7896	true	id.token.claim
5f9758d3-c11a-410f-8006-50a594ec7896	true	access.token.claim
5f9758d3-c11a-410f-8006-50a594ec7896	email	claim.name
5f9758d3-c11a-410f-8006-50a594ec7896	String	jsonType.label
6d7aa28e-ad29-4df1-82d9-543ebf9040f5	formatted	user.attribute.formatted
6d7aa28e-ad29-4df1-82d9-543ebf9040f5	country	user.attribute.country
6d7aa28e-ad29-4df1-82d9-543ebf9040f5	true	introspection.token.claim
6d7aa28e-ad29-4df1-82d9-543ebf9040f5	postal_code	user.attribute.postal_code
6d7aa28e-ad29-4df1-82d9-543ebf9040f5	true	userinfo.token.claim
6d7aa28e-ad29-4df1-82d9-543ebf9040f5	street	user.attribute.street
6d7aa28e-ad29-4df1-82d9-543ebf9040f5	true	id.token.claim
6d7aa28e-ad29-4df1-82d9-543ebf9040f5	region	user.attribute.region
6d7aa28e-ad29-4df1-82d9-543ebf9040f5	true	access.token.claim
6d7aa28e-ad29-4df1-82d9-543ebf9040f5	locality	user.attribute.locality
6521bd13-7276-4d59-8ab7-f6350f60afa2	true	introspection.token.claim
6521bd13-7276-4d59-8ab7-f6350f60afa2	true	userinfo.token.claim
6521bd13-7276-4d59-8ab7-f6350f60afa2	phoneNumberVerified	user.attribute
6521bd13-7276-4d59-8ab7-f6350f60afa2	true	id.token.claim
6521bd13-7276-4d59-8ab7-f6350f60afa2	true	access.token.claim
6521bd13-7276-4d59-8ab7-f6350f60afa2	phone_number_verified	claim.name
6521bd13-7276-4d59-8ab7-f6350f60afa2	boolean	jsonType.label
88bcc1cc-36e4-4a71-9cc1-c232b2934511	true	introspection.token.claim
88bcc1cc-36e4-4a71-9cc1-c232b2934511	true	userinfo.token.claim
88bcc1cc-36e4-4a71-9cc1-c232b2934511	phoneNumber	user.attribute
88bcc1cc-36e4-4a71-9cc1-c232b2934511	true	id.token.claim
88bcc1cc-36e4-4a71-9cc1-c232b2934511	true	access.token.claim
88bcc1cc-36e4-4a71-9cc1-c232b2934511	phone_number	claim.name
88bcc1cc-36e4-4a71-9cc1-c232b2934511	String	jsonType.label
8fed2877-83e7-4326-924e-da4f0e1d6e05	true	introspection.token.claim
8fed2877-83e7-4326-924e-da4f0e1d6e05	true	multivalued
8fed2877-83e7-4326-924e-da4f0e1d6e05	foo	user.attribute
8fed2877-83e7-4326-924e-da4f0e1d6e05	true	access.token.claim
8fed2877-83e7-4326-924e-da4f0e1d6e05	realm_access.roles	claim.name
8fed2877-83e7-4326-924e-da4f0e1d6e05	String	jsonType.label
c55658cc-0011-44b9-af32-a9d807887edd	true	introspection.token.claim
c55658cc-0011-44b9-af32-a9d807887edd	true	access.token.claim
d06475da-50b9-494f-8c44-0d9f92c274cb	true	introspection.token.claim
d06475da-50b9-494f-8c44-0d9f92c274cb	true	multivalued
d06475da-50b9-494f-8c44-0d9f92c274cb	foo	user.attribute
d06475da-50b9-494f-8c44-0d9f92c274cb	true	access.token.claim
d06475da-50b9-494f-8c44-0d9f92c274cb	resource_access.${client_id}.roles	claim.name
d06475da-50b9-494f-8c44-0d9f92c274cb	String	jsonType.label
87130081-3ac8-4a69-941a-1ff4ba1898f0	true	introspection.token.claim
87130081-3ac8-4a69-941a-1ff4ba1898f0	true	access.token.claim
4c810e0c-16e6-46a9-bff1-af6451623f71	true	introspection.token.claim
4c810e0c-16e6-46a9-bff1-af6451623f71	true	multivalued
4c810e0c-16e6-46a9-bff1-af6451623f71	foo	user.attribute
4c810e0c-16e6-46a9-bff1-af6451623f71	true	id.token.claim
4c810e0c-16e6-46a9-bff1-af6451623f71	true	access.token.claim
4c810e0c-16e6-46a9-bff1-af6451623f71	groups	claim.name
4c810e0c-16e6-46a9-bff1-af6451623f71	String	jsonType.label
b853f485-52bf-4858-b05b-1aa904051e4c	true	introspection.token.claim
b853f485-52bf-4858-b05b-1aa904051e4c	true	userinfo.token.claim
b853f485-52bf-4858-b05b-1aa904051e4c	username	user.attribute
b853f485-52bf-4858-b05b-1aa904051e4c	true	id.token.claim
b853f485-52bf-4858-b05b-1aa904051e4c	true	access.token.claim
b853f485-52bf-4858-b05b-1aa904051e4c	upn	claim.name
b853f485-52bf-4858-b05b-1aa904051e4c	String	jsonType.label
f7b7430d-0fe8-4af3-8d55-7a98b5c13606	true	introspection.token.claim
f7b7430d-0fe8-4af3-8d55-7a98b5c13606	true	id.token.claim
f7b7430d-0fe8-4af3-8d55-7a98b5c13606	true	access.token.claim
493a221d-43b5-4ecb-a345-5ac19d796b8e	AUTH_TIME	user.session.note
493a221d-43b5-4ecb-a345-5ac19d796b8e	true	introspection.token.claim
493a221d-43b5-4ecb-a345-5ac19d796b8e	true	id.token.claim
493a221d-43b5-4ecb-a345-5ac19d796b8e	true	access.token.claim
493a221d-43b5-4ecb-a345-5ac19d796b8e	auth_time	claim.name
493a221d-43b5-4ecb-a345-5ac19d796b8e	long	jsonType.label
cec18529-07e0-4dc9-b7a9-e079dae8e0e1	true	introspection.token.claim
cec18529-07e0-4dc9-b7a9-e079dae8e0e1	true	access.token.claim
409cd9a4-a712-407b-9fe1-cc08cca3d705	true	id.token.claim
409cd9a4-a712-407b-9fe1-cc08cca3d705	true	access.token.claim
409cd9a4-a712-407b-9fe1-cc08cca3d705	realm_roles	claim.name
409cd9a4-a712-407b-9fe1-cc08cca3d705	String	jsonType.label
409cd9a4-a712-407b-9fe1-cc08cca3d705	true	multivalued
409cd9a4-a712-407b-9fe1-cc08cca3d705	true	userinfo.token.claim
6e37cd61-1e14-4267-9eba-610463151f67	true	introspection.token.claim
6e37cd61-1e14-4267-9eba-610463151f67	true	userinfo.token.claim
6e37cd61-1e14-4267-9eba-610463151f67	locale	user.attribute
6e37cd61-1e14-4267-9eba-610463151f67	true	id.token.claim
6e37cd61-1e14-4267-9eba-610463151f67	true	access.token.claim
6e37cd61-1e14-4267-9eba-610463151f67	locale	claim.name
6e37cd61-1e14-4267-9eba-610463151f67	String	jsonType.label
\.


--
-- Data for Name: realm; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.realm (id, access_code_lifespan, user_action_lifespan, access_token_lifespan, account_theme, admin_theme, email_theme, enabled, events_enabled, events_expiration, login_theme, name, not_before, password_policy, registration_allowed, remember_me, reset_password_allowed, social, ssl_required, sso_idle_timeout, sso_max_lifespan, update_profile_on_soc_login, verify_email, master_admin_client, login_lifespan, internationalization_enabled, default_locale, reg_email_as_username, admin_events_enabled, admin_events_details_enabled, edit_username_allowed, otp_policy_counter, otp_policy_window, otp_policy_period, otp_policy_digits, otp_policy_alg, otp_policy_type, browser_flow, registration_flow, direct_grant_flow, reset_credentials_flow, client_auth_flow, offline_session_idle_timeout, revoke_refresh_token, access_token_life_implicit, login_with_email_allowed, duplicate_emails_allowed, docker_auth_flow, refresh_token_max_reuse, allow_user_managed_access, sso_max_lifespan_remember_me, sso_idle_timeout_remember_me, default_role) FROM stdin;
9a97cd68-2f02-4213-a560-1f7696277d76	60	300	60	\N	\N	\N	t	f	0	\N	master	0	\N	f	f	f	f	EXTERNAL	1800	36000	f	f	2c5fd935-c489-41f4-be87-eda2243aebfb	1800	f	\N	f	f	f	f	0	1	30	6	HmacSHA1	totp	c9db7ac5-8e23-425b-a55a-3d0bf460b3ad	2aa4d441-b508-410b-be13-e26c0ade4f60	b947041e-0624-4b0e-be6b-06f201514be2	07f050df-5146-4da5-8bb7-02cc5f27a351	81408586-fc64-4594-bdcc-6d71b69ba207	2592000	f	900	t	f	f024cf75-885b-455b-98fb-1f2b762696d1	0	f	0	0	fa7c5b60-9c57-4078-9005-5d917953aac8
1f8b22bb-145f-4eaa-83e4-79fc73e6564f	60	300	300	\N	\N	\N	t	f	0	\N	inventory	0	\N	f	f	t	f	NONE	1800	36000	f	f	bb1f96ce-d16a-43eb-885b-8a43e65bda94	1800	f	\N	f	f	f	f	0	0	30	6	HmacSHA1	totp	051eb8c7-cefd-4c04-94b5-c22cb47e6cb3	e8351c96-a835-4fe7-b0d7-414d73b242f1	e6ee66b7-68aa-491a-8b0d-5380806df792	b470a57e-acb7-41a7-80e0-5c53db54ae17	935cebea-7b40-4e60-9270-5fa0f99d15db	2592000	t	900	t	f	bb36f69e-2ab1-4da5-9fec-d7a3e8cdec80	0	f	0	0	57259c62-3a25-49de-8783-6266b70da763
\.


--
-- Data for Name: realm_attribute; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.realm_attribute (name, realm_id, value) FROM stdin;
_browser_header.contentSecurityPolicyReportOnly	9a97cd68-2f02-4213-a560-1f7696277d76	
_browser_header.xContentTypeOptions	9a97cd68-2f02-4213-a560-1f7696277d76	nosniff
_browser_header.referrerPolicy	9a97cd68-2f02-4213-a560-1f7696277d76	no-referrer
_browser_header.xRobotsTag	9a97cd68-2f02-4213-a560-1f7696277d76	none
_browser_header.xFrameOptions	9a97cd68-2f02-4213-a560-1f7696277d76	SAMEORIGIN
_browser_header.contentSecurityPolicy	9a97cd68-2f02-4213-a560-1f7696277d76	frame-src 'self'; frame-ancestors 'self'; object-src 'none';
_browser_header.xXSSProtection	9a97cd68-2f02-4213-a560-1f7696277d76	1; mode=block
_browser_header.strictTransportSecurity	9a97cd68-2f02-4213-a560-1f7696277d76	max-age=31536000; includeSubDomains
bruteForceProtected	9a97cd68-2f02-4213-a560-1f7696277d76	false
permanentLockout	9a97cd68-2f02-4213-a560-1f7696277d76	false
maxTemporaryLockouts	9a97cd68-2f02-4213-a560-1f7696277d76	0
maxFailureWaitSeconds	9a97cd68-2f02-4213-a560-1f7696277d76	900
minimumQuickLoginWaitSeconds	9a97cd68-2f02-4213-a560-1f7696277d76	60
waitIncrementSeconds	9a97cd68-2f02-4213-a560-1f7696277d76	60
quickLoginCheckMilliSeconds	9a97cd68-2f02-4213-a560-1f7696277d76	1000
maxDeltaTimeSeconds	9a97cd68-2f02-4213-a560-1f7696277d76	43200
failureFactor	9a97cd68-2f02-4213-a560-1f7696277d76	30
realmReusableOtpCode	9a97cd68-2f02-4213-a560-1f7696277d76	false
firstBrokerLoginFlowId	9a97cd68-2f02-4213-a560-1f7696277d76	8b9a5127-b255-44a7-bf23-189eb189d4a3
displayName	9a97cd68-2f02-4213-a560-1f7696277d76	Keycloak
displayNameHtml	9a97cd68-2f02-4213-a560-1f7696277d76	<div class="kc-logo-text"><span>Keycloak</span></div>
defaultSignatureAlgorithm	9a97cd68-2f02-4213-a560-1f7696277d76	RS256
offlineSessionMaxLifespanEnabled	9a97cd68-2f02-4213-a560-1f7696277d76	false
offlineSessionMaxLifespan	9a97cd68-2f02-4213-a560-1f7696277d76	5184000
_browser_header.contentSecurityPolicyReportOnly	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	
_browser_header.xContentTypeOptions	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	nosniff
_browser_header.referrerPolicy	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	no-referrer
_browser_header.xRobotsTag	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	none
_browser_header.xFrameOptions	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	SAMEORIGIN
_browser_header.contentSecurityPolicy	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	frame-src 'self'; frame-ancestors 'self'; object-src 'none';
_browser_header.xXSSProtection	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	1; mode=block
_browser_header.strictTransportSecurity	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	max-age=31536000; includeSubDomains
permanentLockout	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	false
maxTemporaryLockouts	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	0
maxFailureWaitSeconds	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	900
minimumQuickLoginWaitSeconds	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	60
waitIncrementSeconds	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	60
quickLoginCheckMilliSeconds	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	1000
maxDeltaTimeSeconds	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	43200
failureFactor	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	30
realmReusableOtpCode	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	false
displayName	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	Sistema de Inventario
defaultSignatureAlgorithm	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	RS256
bruteForceProtected	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	true
offlineSessionMaxLifespanEnabled	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	false
offlineSessionMaxLifespan	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	5184000
actionTokenGeneratedByAdminLifespan	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	43200
actionTokenGeneratedByUserLifespan	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	300
oauth2DeviceCodeLifespan	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	600
oauth2DevicePollingInterval	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	5
webAuthnPolicyRpEntityName	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	keycloak
webAuthnPolicySignatureAlgorithms	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	ES256
webAuthnPolicyRpId	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	
webAuthnPolicyAttestationConveyancePreference	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	not specified
webAuthnPolicyAuthenticatorAttachment	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	not specified
webAuthnPolicyRequireResidentKey	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	not specified
webAuthnPolicyUserVerificationRequirement	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	not specified
webAuthnPolicyCreateTimeout	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	0
webAuthnPolicyAvoidSameAuthenticatorRegister	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	false
webAuthnPolicyRpEntityNamePasswordless	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	keycloak
webAuthnPolicySignatureAlgorithmsPasswordless	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	ES256
webAuthnPolicyRpIdPasswordless	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	
webAuthnPolicyAttestationConveyancePreferencePasswordless	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	not specified
webAuthnPolicyAuthenticatorAttachmentPasswordless	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	not specified
webAuthnPolicyRequireResidentKeyPasswordless	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	not specified
webAuthnPolicyUserVerificationRequirementPasswordless	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	not specified
webAuthnPolicyCreateTimeoutPasswordless	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	0
webAuthnPolicyAvoidSameAuthenticatorRegisterPasswordless	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	false
cibaBackchannelTokenDeliveryMode	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	poll
cibaExpiresIn	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	120
cibaInterval	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	5
cibaAuthRequestedUserHint	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	login_hint
parRequestUriLifespan	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	60
firstBrokerLoginFlowId	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	bc0672c0-be72-4af8-adfe-faebe5c49b98
\.


--
-- Data for Name: realm_default_groups; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.realm_default_groups (realm_id, group_id) FROM stdin;
\.


--
-- Data for Name: realm_enabled_event_types; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.realm_enabled_event_types (realm_id, value) FROM stdin;
\.


--
-- Data for Name: realm_events_listeners; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.realm_events_listeners (realm_id, value) FROM stdin;
9a97cd68-2f02-4213-a560-1f7696277d76	jboss-logging
1f8b22bb-145f-4eaa-83e4-79fc73e6564f	jboss-logging
\.


--
-- Data for Name: realm_localizations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.realm_localizations (realm_id, locale, texts) FROM stdin;
\.


--
-- Data for Name: realm_required_credential; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.realm_required_credential (type, form_label, input, secret, realm_id) FROM stdin;
password	password	t	t	9a97cd68-2f02-4213-a560-1f7696277d76
password	password	t	t	1f8b22bb-145f-4eaa-83e4-79fc73e6564f
\.


--
-- Data for Name: realm_smtp_config; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.realm_smtp_config (realm_id, value, name) FROM stdin;
\.


--
-- Data for Name: realm_supported_locales; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.realm_supported_locales (realm_id, value) FROM stdin;
\.


--
-- Data for Name: redirect_uris; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.redirect_uris (client_id, value) FROM stdin;
98f32754-80e4-4835-9a83-e9a8a40cebad	/realms/master/account/*
ca7ffbf1-c30a-4a29-90f3-86c70d437ed1	/realms/master/account/*
a68e7ff4-fbc6-4374-a503-802a347de6ac	/admin/master/console/*
08070c05-e13c-4eb2-8afd-b4d4b5b58691	/realms/inventory/account/*
f5bec733-cf3b-4eb3-a759-9dcd218c0b9e	/realms/inventory/account/*
24136744-c2d9-4a78-b09f-a93579a78455	/admin/inventory/console/*
7e5c8c81-ae15-4638-8a35-cf3dc8e8f77c	http://localhost:5173/*
7e5c8c81-ae15-4638-8a35-cf3dc8e8f77c	http://localhost/*
7e5c8c81-ae15-4638-8a35-cf3dc8e8f77c	http://127.0.0.1:5173/*
7e5c8c81-ae15-4638-8a35-cf3dc8e8f77c	http://127.0.0.1/*
\.


--
-- Data for Name: required_action_config; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.required_action_config (required_action_id, value, name) FROM stdin;
\.


--
-- Data for Name: required_action_provider; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.required_action_provider (id, alias, name, realm_id, enabled, default_action, provider_id, priority) FROM stdin;
f3178174-eb94-4534-ba55-0fed81d43d08	VERIFY_EMAIL	Verify Email	9a97cd68-2f02-4213-a560-1f7696277d76	t	f	VERIFY_EMAIL	50
1d053250-5321-44ac-8690-195aead03bd3	UPDATE_PROFILE	Update Profile	9a97cd68-2f02-4213-a560-1f7696277d76	t	f	UPDATE_PROFILE	40
f3ac1045-4f9c-43c6-a59f-aea3f946517e	CONFIGURE_TOTP	Configure OTP	9a97cd68-2f02-4213-a560-1f7696277d76	t	f	CONFIGURE_TOTP	10
1310a029-ea6d-4453-80a5-290899c4dc5a	UPDATE_PASSWORD	Update Password	9a97cd68-2f02-4213-a560-1f7696277d76	t	f	UPDATE_PASSWORD	30
071bab09-2b5a-451a-9f07-a9e84fd030a5	TERMS_AND_CONDITIONS	Terms and Conditions	9a97cd68-2f02-4213-a560-1f7696277d76	f	f	TERMS_AND_CONDITIONS	20
9baaede5-5adc-4a80-8ad2-ac316ff99a1f	delete_account	Delete Account	9a97cd68-2f02-4213-a560-1f7696277d76	f	f	delete_account	60
e579f259-c2d1-46c2-b967-2aaf7da79c9a	delete_credential	Delete Credential	9a97cd68-2f02-4213-a560-1f7696277d76	t	f	delete_credential	100
d7c4a017-7bfb-4ff0-9055-0fcf5662aa71	update_user_locale	Update User Locale	9a97cd68-2f02-4213-a560-1f7696277d76	t	f	update_user_locale	1000
5f7195ec-eb36-44f9-8576-abe75e61b81d	webauthn-register	Webauthn Register	9a97cd68-2f02-4213-a560-1f7696277d76	t	f	webauthn-register	70
2d03e9f6-af83-44c4-bcf3-09333a289f26	webauthn-register-passwordless	Webauthn Register Passwordless	9a97cd68-2f02-4213-a560-1f7696277d76	t	f	webauthn-register-passwordless	80
93b27e6f-2d52-4721-b359-b468795fc0e8	VERIFY_PROFILE	Verify Profile	9a97cd68-2f02-4213-a560-1f7696277d76	t	f	VERIFY_PROFILE	90
c66df078-588c-4084-ac0c-fb23d9b64e6e	VERIFY_EMAIL	Verify Email	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	t	f	VERIFY_EMAIL	50
c5a1763c-1428-4ab6-a0b8-46d06aee0433	UPDATE_PROFILE	Update Profile	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	t	f	UPDATE_PROFILE	40
b90fec9b-8987-4912-b102-c1534faabb29	CONFIGURE_TOTP	Configure OTP	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	t	f	CONFIGURE_TOTP	10
1383dc2f-abc8-48e4-ab1d-831046fcd761	UPDATE_PASSWORD	Update Password	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	t	f	UPDATE_PASSWORD	30
5dffef01-c04f-46c8-9e93-7e0b5ba1771b	TERMS_AND_CONDITIONS	Terms and Conditions	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	f	f	TERMS_AND_CONDITIONS	20
02dcfd46-142d-4b75-b481-acb26e6bc9bd	delete_account	Delete Account	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	f	f	delete_account	60
37a14dce-0b6f-47ad-9f8a-1d3f803c5a08	delete_credential	Delete Credential	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	t	f	delete_credential	100
543ee75b-f649-4983-bff7-dca30ae3a2cc	update_user_locale	Update User Locale	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	t	f	update_user_locale	1000
57d2a976-e9cc-4ed1-847e-f15ab9bd864f	webauthn-register	Webauthn Register	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	t	f	webauthn-register	70
1f5b0f16-2d19-4caa-900a-a1278d93f627	webauthn-register-passwordless	Webauthn Register Passwordless	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	t	f	webauthn-register-passwordless	80
faca4ea3-06d8-487c-ba7d-3060733ce2f9	VERIFY_PROFILE	Verify Profile	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	t	f	VERIFY_PROFILE	90
\.


--
-- Data for Name: resource_attribute; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.resource_attribute (id, name, value, resource_id) FROM stdin;
\.


--
-- Data for Name: resource_policy; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.resource_policy (resource_id, policy_id) FROM stdin;
\.


--
-- Data for Name: resource_scope; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.resource_scope (resource_id, scope_id) FROM stdin;
\.


--
-- Data for Name: resource_server; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.resource_server (id, allow_rs_remote_mgmt, policy_enforce_mode, decision_strategy) FROM stdin;
\.


--
-- Data for Name: resource_server_perm_ticket; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.resource_server_perm_ticket (id, owner, requester, created_timestamp, granted_timestamp, resource_id, scope_id, resource_server_id, policy_id) FROM stdin;
\.


--
-- Data for Name: resource_server_policy; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.resource_server_policy (id, name, description, type, decision_strategy, logic, resource_server_id, owner) FROM stdin;
\.


--
-- Data for Name: resource_server_resource; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.resource_server_resource (id, name, type, icon_uri, owner, resource_server_id, owner_managed_access, display_name) FROM stdin;
\.


--
-- Data for Name: resource_server_scope; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.resource_server_scope (id, name, icon_uri, resource_server_id, display_name) FROM stdin;
\.


--
-- Data for Name: resource_uris; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.resource_uris (resource_id, value) FROM stdin;
\.


--
-- Data for Name: role_attribute; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.role_attribute (id, role_id, name, value) FROM stdin;
\.


--
-- Data for Name: scope_mapping; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.scope_mapping (client_id, role_id) FROM stdin;
ca7ffbf1-c30a-4a29-90f3-86c70d437ed1	706f5a97-24be-434c-b7ed-f36cbfc9c011
ca7ffbf1-c30a-4a29-90f3-86c70d437ed1	d5b48abf-7451-4f9d-8251-7ff9616103ca
f5bec733-cf3b-4eb3-a759-9dcd218c0b9e	0b095e87-ca67-420b-a051-805de295565c
f5bec733-cf3b-4eb3-a759-9dcd218c0b9e	b483f57e-3b13-4eb3-be6e-4afd09933af0
\.


--
-- Data for Name: scope_policy; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.scope_policy (scope_id, policy_id) FROM stdin;
\.


--
-- Data for Name: user_attribute; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_attribute (name, value, user_id, id, long_value_hash, long_value_hash_lower_case, long_value) FROM stdin;
\.


--
-- Data for Name: user_consent; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_consent (id, client_id, user_id, created_date, last_updated_date, client_storage_provider, external_client_id) FROM stdin;
\.


--
-- Data for Name: user_consent_client_scope; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_consent_client_scope (user_consent_id, scope_id) FROM stdin;
\.


--
-- Data for Name: user_entity; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_entity (id, email, email_constraint, email_verified, enabled, federation_link, first_name, last_name, realm_id, username, created_timestamp, service_account_client_link, not_before) FROM stdin;
544a8207-60cb-49fc-abc2-5931698254f3	admin@inventory.local	admin@inventory.local	t	t	\N	Super	Administrador	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	superadmin	\N	\N	0
b3faedcf-50a2-44d4-80b8-9453e0e6d7dc	admin2@inventory.local	admin2@inventory.local	t	t	\N	Admin	Usuario	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	administrador	\N	\N	0
568a5798-7e06-40b8-b3cf-be6983c00ee9	cajero@inventory.local	cajero@inventory.local	t	t	\N	Cajero	Usuario	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	cajero	\N	\N	0
223e0276-43e7-40d2-92d6-f85d0f93291a	\N	8ebfa735-c591-4d0c-9d64-83cdfdb51268	f	t	\N	\N	\N	9a97cd68-2f02-4213-a560-1f7696277d76	admin	1779118661350	\N	0
43f03a98-d9e1-4bb1-a690-f1cef899f982	cajero@gmail.com	cajero@gmail.com	t	t	\N	cajero	cajero	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	cajero@gmail.com	1779137417304	\N	0
ecd2616f-6d85-4591-b516-71039f42aa07	administrador@gmail.com	administrador@gmail.com	t	t	\N	administrador1	1	1f8b22bb-145f-4eaa-83e4-79fc73e6564f	administrador@gmail.com	1779137890016	\N	0
\.


--
-- Data for Name: user_federation_config; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_federation_config (user_federation_provider_id, value, name) FROM stdin;
\.


--
-- Data for Name: user_federation_mapper; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_federation_mapper (id, name, federation_provider_id, federation_mapper_type, realm_id) FROM stdin;
\.


--
-- Data for Name: user_federation_mapper_config; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_federation_mapper_config (user_federation_mapper_id, value, name) FROM stdin;
\.


--
-- Data for Name: user_federation_provider; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_federation_provider (id, changed_sync_period, display_name, full_sync_period, last_sync, priority, provider_name, realm_id) FROM stdin;
\.


--
-- Data for Name: user_group_membership; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_group_membership (group_id, user_id) FROM stdin;
\.


--
-- Data for Name: user_required_action; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_required_action (user_id, required_action) FROM stdin;
\.


--
-- Data for Name: user_role_mapping; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_role_mapping (role_id, user_id) FROM stdin;
5181f235-894f-42fc-8ccc-4cd01650128b	544a8207-60cb-49fc-abc2-5931698254f3
43964e18-2d94-42d5-9285-dfa35b2f6cd6	b3faedcf-50a2-44d4-80b8-9453e0e6d7dc
efbe0220-8a18-4ff9-b127-e54642a6d7a4	568a5798-7e06-40b8-b3cf-be6983c00ee9
fa7c5b60-9c57-4078-9005-5d917953aac8	223e0276-43e7-40d2-92d6-f85d0f93291a
22e059c4-7274-4727-83e7-39668b9d6116	223e0276-43e7-40d2-92d6-f85d0f93291a
57259c62-3a25-49de-8783-6266b70da763	43f03a98-d9e1-4bb1-a690-f1cef899f982
efbe0220-8a18-4ff9-b127-e54642a6d7a4	43f03a98-d9e1-4bb1-a690-f1cef899f982
57259c62-3a25-49de-8783-6266b70da763	ecd2616f-6d85-4591-b516-71039f42aa07
43964e18-2d94-42d5-9285-dfa35b2f6cd6	ecd2616f-6d85-4591-b516-71039f42aa07
\.


--
-- Data for Name: user_session; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_session (id, auth_method, ip_address, last_session_refresh, login_username, realm_id, remember_me, started, user_id, user_session_state, broker_session_id, broker_user_id) FROM stdin;
\.


--
-- Data for Name: user_session_note; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_session_note (user_session, name, value) FROM stdin;
\.


--
-- Data for Name: username_login_failure; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.username_login_failure (realm_id, username, failed_login_not_before, last_failure, last_ip_failure, num_failures) FROM stdin;
\.


--
-- Data for Name: web_origins; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.web_origins (client_id, value) FROM stdin;
a68e7ff4-fbc6-4374-a503-802a347de6ac	+
24136744-c2d9-4a78-b09f-a93579a78455	+
7e5c8c81-ae15-4638-8a35-cf3dc8e8f77c	http://127.0.0.1
7e5c8c81-ae15-4638-8a35-cf3dc8e8f77c	http://localhost
7e5c8c81-ae15-4638-8a35-cf3dc8e8f77c	http://localhost:5173
7e5c8c81-ae15-4638-8a35-cf3dc8e8f77c	http://127.0.0.1:5173
\.


--
-- Name: username_login_failure CONSTRAINT_17-2; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.username_login_failure
    ADD CONSTRAINT "CONSTRAINT_17-2" PRIMARY KEY (realm_id, username);


--
-- Name: org_domain ORG_DOMAIN_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.org_domain
    ADD CONSTRAINT "ORG_DOMAIN_pkey" PRIMARY KEY (id, name);


--
-- Name: org ORG_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.org
    ADD CONSTRAINT "ORG_pkey" PRIMARY KEY (id);


--
-- Name: keycloak_role UK_J3RWUVD56ONTGSUHOGM184WW2-2; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.keycloak_role
    ADD CONSTRAINT "UK_J3RWUVD56ONTGSUHOGM184WW2-2" UNIQUE (name, client_realm_constraint);


--
-- Name: client_auth_flow_bindings c_cli_flow_bind; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_auth_flow_bindings
    ADD CONSTRAINT c_cli_flow_bind PRIMARY KEY (client_id, binding_name);


--
-- Name: client_scope_client c_cli_scope_bind; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_scope_client
    ADD CONSTRAINT c_cli_scope_bind PRIMARY KEY (client_id, scope_id);


--
-- Name: client_initial_access cnstr_client_init_acc_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_initial_access
    ADD CONSTRAINT cnstr_client_init_acc_pk PRIMARY KEY (id);


--
-- Name: realm_default_groups con_group_id_def_groups; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.realm_default_groups
    ADD CONSTRAINT con_group_id_def_groups UNIQUE (group_id);


--
-- Name: broker_link constr_broker_link_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.broker_link
    ADD CONSTRAINT constr_broker_link_pk PRIMARY KEY (identity_provider, user_id);


--
-- Name: client_user_session_note constr_cl_usr_ses_note; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_user_session_note
    ADD CONSTRAINT constr_cl_usr_ses_note PRIMARY KEY (client_session, name);


--
-- Name: component_config constr_component_config_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.component_config
    ADD CONSTRAINT constr_component_config_pk PRIMARY KEY (id);


--
-- Name: component constr_component_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.component
    ADD CONSTRAINT constr_component_pk PRIMARY KEY (id);


--
-- Name: fed_user_required_action constr_fed_required_action; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fed_user_required_action
    ADD CONSTRAINT constr_fed_required_action PRIMARY KEY (required_action, user_id);


--
-- Name: fed_user_attribute constr_fed_user_attr_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fed_user_attribute
    ADD CONSTRAINT constr_fed_user_attr_pk PRIMARY KEY (id);


--
-- Name: fed_user_consent constr_fed_user_consent_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fed_user_consent
    ADD CONSTRAINT constr_fed_user_consent_pk PRIMARY KEY (id);


--
-- Name: fed_user_credential constr_fed_user_cred_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fed_user_credential
    ADD CONSTRAINT constr_fed_user_cred_pk PRIMARY KEY (id);


--
-- Name: fed_user_group_membership constr_fed_user_group; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fed_user_group_membership
    ADD CONSTRAINT constr_fed_user_group PRIMARY KEY (group_id, user_id);


--
-- Name: fed_user_role_mapping constr_fed_user_role; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fed_user_role_mapping
    ADD CONSTRAINT constr_fed_user_role PRIMARY KEY (role_id, user_id);


--
-- Name: federated_user constr_federated_user; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.federated_user
    ADD CONSTRAINT constr_federated_user PRIMARY KEY (id);


--
-- Name: realm_default_groups constr_realm_default_groups; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.realm_default_groups
    ADD CONSTRAINT constr_realm_default_groups PRIMARY KEY (realm_id, group_id);


--
-- Name: realm_enabled_event_types constr_realm_enabl_event_types; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.realm_enabled_event_types
    ADD CONSTRAINT constr_realm_enabl_event_types PRIMARY KEY (realm_id, value);


--
-- Name: realm_events_listeners constr_realm_events_listeners; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.realm_events_listeners
    ADD CONSTRAINT constr_realm_events_listeners PRIMARY KEY (realm_id, value);


--
-- Name: realm_supported_locales constr_realm_supported_locales; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.realm_supported_locales
    ADD CONSTRAINT constr_realm_supported_locales PRIMARY KEY (realm_id, value);


--
-- Name: identity_provider constraint_2b; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.identity_provider
    ADD CONSTRAINT constraint_2b PRIMARY KEY (internal_id);


--
-- Name: client_attributes constraint_3c; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_attributes
    ADD CONSTRAINT constraint_3c PRIMARY KEY (client_id, name);


--
-- Name: event_entity constraint_4; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_entity
    ADD CONSTRAINT constraint_4 PRIMARY KEY (id);


--
-- Name: federated_identity constraint_40; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.federated_identity
    ADD CONSTRAINT constraint_40 PRIMARY KEY (identity_provider, user_id);


--
-- Name: realm constraint_4a; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.realm
    ADD CONSTRAINT constraint_4a PRIMARY KEY (id);


--
-- Name: client_session_role constraint_5; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_session_role
    ADD CONSTRAINT constraint_5 PRIMARY KEY (client_session, role_id);


--
-- Name: user_session constraint_57; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_session
    ADD CONSTRAINT constraint_57 PRIMARY KEY (id);


--
-- Name: user_federation_provider constraint_5c; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_federation_provider
    ADD CONSTRAINT constraint_5c PRIMARY KEY (id);


--
-- Name: client_session_note constraint_5e; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_session_note
    ADD CONSTRAINT constraint_5e PRIMARY KEY (client_session, name);


--
-- Name: client constraint_7; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client
    ADD CONSTRAINT constraint_7 PRIMARY KEY (id);


--
-- Name: client_session constraint_8; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_session
    ADD CONSTRAINT constraint_8 PRIMARY KEY (id);


--
-- Name: scope_mapping constraint_81; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scope_mapping
    ADD CONSTRAINT constraint_81 PRIMARY KEY (client_id, role_id);


--
-- Name: client_node_registrations constraint_84; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_node_registrations
    ADD CONSTRAINT constraint_84 PRIMARY KEY (client_id, name);


--
-- Name: realm_attribute constraint_9; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.realm_attribute
    ADD CONSTRAINT constraint_9 PRIMARY KEY (name, realm_id);


--
-- Name: realm_required_credential constraint_92; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.realm_required_credential
    ADD CONSTRAINT constraint_92 PRIMARY KEY (realm_id, type);


--
-- Name: keycloak_role constraint_a; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.keycloak_role
    ADD CONSTRAINT constraint_a PRIMARY KEY (id);


--
-- Name: admin_event_entity constraint_admin_event_entity; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_event_entity
    ADD CONSTRAINT constraint_admin_event_entity PRIMARY KEY (id);


--
-- Name: authenticator_config_entry constraint_auth_cfg_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.authenticator_config_entry
    ADD CONSTRAINT constraint_auth_cfg_pk PRIMARY KEY (authenticator_id, name);


--
-- Name: authentication_execution constraint_auth_exec_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.authentication_execution
    ADD CONSTRAINT constraint_auth_exec_pk PRIMARY KEY (id);


--
-- Name: authentication_flow constraint_auth_flow_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.authentication_flow
    ADD CONSTRAINT constraint_auth_flow_pk PRIMARY KEY (id);


--
-- Name: authenticator_config constraint_auth_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.authenticator_config
    ADD CONSTRAINT constraint_auth_pk PRIMARY KEY (id);


--
-- Name: client_session_auth_status constraint_auth_status_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_session_auth_status
    ADD CONSTRAINT constraint_auth_status_pk PRIMARY KEY (client_session, authenticator);


--
-- Name: user_role_mapping constraint_c; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_role_mapping
    ADD CONSTRAINT constraint_c PRIMARY KEY (role_id, user_id);


--
-- Name: composite_role constraint_composite_role; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.composite_role
    ADD CONSTRAINT constraint_composite_role PRIMARY KEY (composite, child_role);


--
-- Name: client_session_prot_mapper constraint_cs_pmp_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_session_prot_mapper
    ADD CONSTRAINT constraint_cs_pmp_pk PRIMARY KEY (client_session, protocol_mapper_id);


--
-- Name: identity_provider_config constraint_d; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.identity_provider_config
    ADD CONSTRAINT constraint_d PRIMARY KEY (identity_provider_id, name);


--
-- Name: policy_config constraint_dpc; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.policy_config
    ADD CONSTRAINT constraint_dpc PRIMARY KEY (policy_id, name);


--
-- Name: realm_smtp_config constraint_e; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.realm_smtp_config
    ADD CONSTRAINT constraint_e PRIMARY KEY (realm_id, name);


--
-- Name: credential constraint_f; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credential
    ADD CONSTRAINT constraint_f PRIMARY KEY (id);


--
-- Name: user_federation_config constraint_f9; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_federation_config
    ADD CONSTRAINT constraint_f9 PRIMARY KEY (user_federation_provider_id, name);


--
-- Name: resource_server_perm_ticket constraint_fapmt; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_server_perm_ticket
    ADD CONSTRAINT constraint_fapmt PRIMARY KEY (id);


--
-- Name: resource_server_resource constraint_farsr; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_server_resource
    ADD CONSTRAINT constraint_farsr PRIMARY KEY (id);


--
-- Name: resource_server_policy constraint_farsrp; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_server_policy
    ADD CONSTRAINT constraint_farsrp PRIMARY KEY (id);


--
-- Name: associated_policy constraint_farsrpap; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.associated_policy
    ADD CONSTRAINT constraint_farsrpap PRIMARY KEY (policy_id, associated_policy_id);


--
-- Name: resource_policy constraint_farsrpp; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_policy
    ADD CONSTRAINT constraint_farsrpp PRIMARY KEY (resource_id, policy_id);


--
-- Name: resource_server_scope constraint_farsrs; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_server_scope
    ADD CONSTRAINT constraint_farsrs PRIMARY KEY (id);


--
-- Name: resource_scope constraint_farsrsp; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_scope
    ADD CONSTRAINT constraint_farsrsp PRIMARY KEY (resource_id, scope_id);


--
-- Name: scope_policy constraint_farsrsps; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scope_policy
    ADD CONSTRAINT constraint_farsrsps PRIMARY KEY (scope_id, policy_id);


--
-- Name: user_entity constraint_fb; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_entity
    ADD CONSTRAINT constraint_fb PRIMARY KEY (id);


--
-- Name: user_federation_mapper_config constraint_fedmapper_cfg_pm; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_federation_mapper_config
    ADD CONSTRAINT constraint_fedmapper_cfg_pm PRIMARY KEY (user_federation_mapper_id, name);


--
-- Name: user_federation_mapper constraint_fedmapperpm; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_federation_mapper
    ADD CONSTRAINT constraint_fedmapperpm PRIMARY KEY (id);


--
-- Name: fed_user_consent_cl_scope constraint_fgrntcsnt_clsc_pm; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fed_user_consent_cl_scope
    ADD CONSTRAINT constraint_fgrntcsnt_clsc_pm PRIMARY KEY (user_consent_id, scope_id);


--
-- Name: user_consent_client_scope constraint_grntcsnt_clsc_pm; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_consent_client_scope
    ADD CONSTRAINT constraint_grntcsnt_clsc_pm PRIMARY KEY (user_consent_id, scope_id);


--
-- Name: user_consent constraint_grntcsnt_pm; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_consent
    ADD CONSTRAINT constraint_grntcsnt_pm PRIMARY KEY (id);


--
-- Name: keycloak_group constraint_group; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.keycloak_group
    ADD CONSTRAINT constraint_group PRIMARY KEY (id);


--
-- Name: group_attribute constraint_group_attribute_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_attribute
    ADD CONSTRAINT constraint_group_attribute_pk PRIMARY KEY (id);


--
-- Name: group_role_mapping constraint_group_role; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_role_mapping
    ADD CONSTRAINT constraint_group_role PRIMARY KEY (role_id, group_id);


--
-- Name: identity_provider_mapper constraint_idpm; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.identity_provider_mapper
    ADD CONSTRAINT constraint_idpm PRIMARY KEY (id);


--
-- Name: idp_mapper_config constraint_idpmconfig; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.idp_mapper_config
    ADD CONSTRAINT constraint_idpmconfig PRIMARY KEY (idp_mapper_id, name);


--
-- Name: migration_model constraint_migmod; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migration_model
    ADD CONSTRAINT constraint_migmod PRIMARY KEY (id);


--
-- Name: offline_client_session constraint_offl_cl_ses_pk3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offline_client_session
    ADD CONSTRAINT constraint_offl_cl_ses_pk3 PRIMARY KEY (user_session_id, client_id, client_storage_provider, external_client_id, offline_flag);


--
-- Name: offline_user_session constraint_offl_us_ses_pk2; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offline_user_session
    ADD CONSTRAINT constraint_offl_us_ses_pk2 PRIMARY KEY (user_session_id, offline_flag);


--
-- Name: protocol_mapper constraint_pcm; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.protocol_mapper
    ADD CONSTRAINT constraint_pcm PRIMARY KEY (id);


--
-- Name: protocol_mapper_config constraint_pmconfig; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.protocol_mapper_config
    ADD CONSTRAINT constraint_pmconfig PRIMARY KEY (protocol_mapper_id, name);


--
-- Name: redirect_uris constraint_redirect_uris; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.redirect_uris
    ADD CONSTRAINT constraint_redirect_uris PRIMARY KEY (client_id, value);


--
-- Name: required_action_config constraint_req_act_cfg_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.required_action_config
    ADD CONSTRAINT constraint_req_act_cfg_pk PRIMARY KEY (required_action_id, name);


--
-- Name: required_action_provider constraint_req_act_prv_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.required_action_provider
    ADD CONSTRAINT constraint_req_act_prv_pk PRIMARY KEY (id);


--
-- Name: user_required_action constraint_required_action; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_required_action
    ADD CONSTRAINT constraint_required_action PRIMARY KEY (required_action, user_id);


--
-- Name: resource_uris constraint_resour_uris_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_uris
    ADD CONSTRAINT constraint_resour_uris_pk PRIMARY KEY (resource_id, value);


--
-- Name: role_attribute constraint_role_attribute_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_attribute
    ADD CONSTRAINT constraint_role_attribute_pk PRIMARY KEY (id);


--
-- Name: user_attribute constraint_user_attribute_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_attribute
    ADD CONSTRAINT constraint_user_attribute_pk PRIMARY KEY (id);


--
-- Name: user_group_membership constraint_user_group; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_group_membership
    ADD CONSTRAINT constraint_user_group PRIMARY KEY (group_id, user_id);


--
-- Name: user_session_note constraint_usn_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_session_note
    ADD CONSTRAINT constraint_usn_pk PRIMARY KEY (user_session, name);


--
-- Name: web_origins constraint_web_origins; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.web_origins
    ADD CONSTRAINT constraint_web_origins PRIMARY KEY (client_id, value);


--
-- Name: databasechangeloglock databasechangeloglock_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.databasechangeloglock
    ADD CONSTRAINT databasechangeloglock_pkey PRIMARY KEY (id);


--
-- Name: client_scope_attributes pk_cl_tmpl_attr; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_scope_attributes
    ADD CONSTRAINT pk_cl_tmpl_attr PRIMARY KEY (scope_id, name);


--
-- Name: client_scope pk_cli_template; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_scope
    ADD CONSTRAINT pk_cli_template PRIMARY KEY (id);


--
-- Name: resource_server pk_resource_server; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_server
    ADD CONSTRAINT pk_resource_server PRIMARY KEY (id);


--
-- Name: client_scope_role_mapping pk_template_scope; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_scope_role_mapping
    ADD CONSTRAINT pk_template_scope PRIMARY KEY (scope_id, role_id);


--
-- Name: default_client_scope r_def_cli_scope_bind; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.default_client_scope
    ADD CONSTRAINT r_def_cli_scope_bind PRIMARY KEY (realm_id, scope_id);


--
-- Name: realm_localizations realm_localizations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.realm_localizations
    ADD CONSTRAINT realm_localizations_pkey PRIMARY KEY (realm_id, locale);


--
-- Name: resource_attribute res_attr_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_attribute
    ADD CONSTRAINT res_attr_pk PRIMARY KEY (id);


--
-- Name: keycloak_group sibling_names; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.keycloak_group
    ADD CONSTRAINT sibling_names UNIQUE (realm_id, parent_group, name);


--
-- Name: identity_provider uk_2daelwnibji49avxsrtuf6xj33; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.identity_provider
    ADD CONSTRAINT uk_2daelwnibji49avxsrtuf6xj33 UNIQUE (provider_alias, realm_id);


--
-- Name: client uk_b71cjlbenv945rb6gcon438at; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client
    ADD CONSTRAINT uk_b71cjlbenv945rb6gcon438at UNIQUE (realm_id, client_id);


--
-- Name: client_scope uk_cli_scope; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_scope
    ADD CONSTRAINT uk_cli_scope UNIQUE (realm_id, name);


--
-- Name: user_entity uk_dykn684sl8up1crfei6eckhd7; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_entity
    ADD CONSTRAINT uk_dykn684sl8up1crfei6eckhd7 UNIQUE (realm_id, email_constraint);


--
-- Name: user_consent uk_external_consent; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_consent
    ADD CONSTRAINT uk_external_consent UNIQUE (client_storage_provider, external_client_id, user_id);


--
-- Name: resource_server_resource uk_frsr6t700s9v50bu18ws5ha6; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_server_resource
    ADD CONSTRAINT uk_frsr6t700s9v50bu18ws5ha6 UNIQUE (name, owner, resource_server_id);


--
-- Name: resource_server_perm_ticket uk_frsr6t700s9v50bu18ws5pmt; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_server_perm_ticket
    ADD CONSTRAINT uk_frsr6t700s9v50bu18ws5pmt UNIQUE (owner, requester, resource_server_id, resource_id, scope_id);


--
-- Name: resource_server_policy uk_frsrpt700s9v50bu18ws5ha6; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_server_policy
    ADD CONSTRAINT uk_frsrpt700s9v50bu18ws5ha6 UNIQUE (name, resource_server_id);


--
-- Name: resource_server_scope uk_frsrst700s9v50bu18ws5ha6; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_server_scope
    ADD CONSTRAINT uk_frsrst700s9v50bu18ws5ha6 UNIQUE (name, resource_server_id);


--
-- Name: user_consent uk_local_consent; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_consent
    ADD CONSTRAINT uk_local_consent UNIQUE (client_id, user_id);


--
-- Name: org uk_org_group; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.org
    ADD CONSTRAINT uk_org_group UNIQUE (group_id);


--
-- Name: org uk_org_name; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.org
    ADD CONSTRAINT uk_org_name UNIQUE (realm_id, name);


--
-- Name: realm uk_orvsdmla56612eaefiq6wl5oi; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.realm
    ADD CONSTRAINT uk_orvsdmla56612eaefiq6wl5oi UNIQUE (name);


--
-- Name: user_entity uk_ru8tt6t700s9v50bu18ws5ha6; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_entity
    ADD CONSTRAINT uk_ru8tt6t700s9v50bu18ws5ha6 UNIQUE (realm_id, username);


--
-- Name: fed_user_attr_long_values; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX fed_user_attr_long_values ON public.fed_user_attribute USING btree (long_value_hash, name);


--
-- Name: fed_user_attr_long_values_lower_case; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX fed_user_attr_long_values_lower_case ON public.fed_user_attribute USING btree (long_value_hash_lower_case, name);


--
-- Name: idx_admin_event_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_event_time ON public.admin_event_entity USING btree (realm_id, admin_event_time);


--
-- Name: idx_assoc_pol_assoc_pol_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assoc_pol_assoc_pol_id ON public.associated_policy USING btree (associated_policy_id);


--
-- Name: idx_auth_config_realm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auth_config_realm ON public.authenticator_config USING btree (realm_id);


--
-- Name: idx_auth_exec_flow; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auth_exec_flow ON public.authentication_execution USING btree (flow_id);


--
-- Name: idx_auth_exec_realm_flow; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auth_exec_realm_flow ON public.authentication_execution USING btree (realm_id, flow_id);


--
-- Name: idx_auth_flow_realm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auth_flow_realm ON public.authentication_flow USING btree (realm_id);


--
-- Name: idx_cl_clscope; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cl_clscope ON public.client_scope_client USING btree (scope_id);


--
-- Name: idx_client_att_by_name_value; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_att_by_name_value ON public.client_attributes USING btree (name, substr(value, 1, 255));


--
-- Name: idx_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_id ON public.client USING btree (client_id);


--
-- Name: idx_client_init_acc_realm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_init_acc_realm ON public.client_initial_access USING btree (realm_id);


--
-- Name: idx_client_session_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_session_session ON public.client_session USING btree (session_id);


--
-- Name: idx_clscope_attrs; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clscope_attrs ON public.client_scope_attributes USING btree (scope_id);


--
-- Name: idx_clscope_cl; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clscope_cl ON public.client_scope_client USING btree (client_id);


--
-- Name: idx_clscope_protmap; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clscope_protmap ON public.protocol_mapper USING btree (client_scope_id);


--
-- Name: idx_clscope_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clscope_role ON public.client_scope_role_mapping USING btree (scope_id);


--
-- Name: idx_compo_config_compo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_compo_config_compo ON public.component_config USING btree (component_id);


--
-- Name: idx_component_provider_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_component_provider_type ON public.component USING btree (provider_type);


--
-- Name: idx_component_realm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_component_realm ON public.component USING btree (realm_id);


--
-- Name: idx_composite; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_composite ON public.composite_role USING btree (composite);


--
-- Name: idx_composite_child; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_composite_child ON public.composite_role USING btree (child_role);


--
-- Name: idx_defcls_realm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_defcls_realm ON public.default_client_scope USING btree (realm_id);


--
-- Name: idx_defcls_scope; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_defcls_scope ON public.default_client_scope USING btree (scope_id);


--
-- Name: idx_event_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_time ON public.event_entity USING btree (realm_id, event_time);


--
-- Name: idx_fedidentity_feduser; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fedidentity_feduser ON public.federated_identity USING btree (federated_user_id);


--
-- Name: idx_fedidentity_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fedidentity_user ON public.federated_identity USING btree (user_id);


--
-- Name: idx_fu_attribute; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fu_attribute ON public.fed_user_attribute USING btree (user_id, realm_id, name);


--
-- Name: idx_fu_cnsnt_ext; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fu_cnsnt_ext ON public.fed_user_consent USING btree (user_id, client_storage_provider, external_client_id);


--
-- Name: idx_fu_consent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fu_consent ON public.fed_user_consent USING btree (user_id, client_id);


--
-- Name: idx_fu_consent_ru; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fu_consent_ru ON public.fed_user_consent USING btree (realm_id, user_id);


--
-- Name: idx_fu_credential; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fu_credential ON public.fed_user_credential USING btree (user_id, type);


--
-- Name: idx_fu_credential_ru; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fu_credential_ru ON public.fed_user_credential USING btree (realm_id, user_id);


--
-- Name: idx_fu_group_membership; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fu_group_membership ON public.fed_user_group_membership USING btree (user_id, group_id);


--
-- Name: idx_fu_group_membership_ru; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fu_group_membership_ru ON public.fed_user_group_membership USING btree (realm_id, user_id);


--
-- Name: idx_fu_required_action; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fu_required_action ON public.fed_user_required_action USING btree (user_id, required_action);


--
-- Name: idx_fu_required_action_ru; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fu_required_action_ru ON public.fed_user_required_action USING btree (realm_id, user_id);


--
-- Name: idx_fu_role_mapping; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fu_role_mapping ON public.fed_user_role_mapping USING btree (user_id, role_id);


--
-- Name: idx_fu_role_mapping_ru; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fu_role_mapping_ru ON public.fed_user_role_mapping USING btree (realm_id, user_id);


--
-- Name: idx_group_att_by_name_value; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_group_att_by_name_value ON public.group_attribute USING btree (name, ((value)::character varying(250)));


--
-- Name: idx_group_attr_group; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_group_attr_group ON public.group_attribute USING btree (group_id);


--
-- Name: idx_group_role_mapp_group; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_group_role_mapp_group ON public.group_role_mapping USING btree (group_id);


--
-- Name: idx_id_prov_mapp_realm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_id_prov_mapp_realm ON public.identity_provider_mapper USING btree (realm_id);


--
-- Name: idx_ident_prov_realm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ident_prov_realm ON public.identity_provider USING btree (realm_id);


--
-- Name: idx_keycloak_role_client; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_keycloak_role_client ON public.keycloak_role USING btree (client);


--
-- Name: idx_keycloak_role_realm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_keycloak_role_realm ON public.keycloak_role USING btree (realm);


--
-- Name: idx_offline_uss_by_broker_session_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_offline_uss_by_broker_session_id ON public.offline_user_session USING btree (broker_session_id, realm_id);


--
-- Name: idx_offline_uss_by_last_session_refresh; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_offline_uss_by_last_session_refresh ON public.offline_user_session USING btree (realm_id, offline_flag, last_session_refresh);


--
-- Name: idx_offline_uss_by_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_offline_uss_by_user ON public.offline_user_session USING btree (user_id, realm_id, offline_flag);


--
-- Name: idx_perm_ticket_owner; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_perm_ticket_owner ON public.resource_server_perm_ticket USING btree (owner);


--
-- Name: idx_perm_ticket_requester; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_perm_ticket_requester ON public.resource_server_perm_ticket USING btree (requester);


--
-- Name: idx_protocol_mapper_client; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_protocol_mapper_client ON public.protocol_mapper USING btree (client_id);


--
-- Name: idx_realm_attr_realm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_realm_attr_realm ON public.realm_attribute USING btree (realm_id);


--
-- Name: idx_realm_clscope; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_realm_clscope ON public.client_scope USING btree (realm_id);


--
-- Name: idx_realm_def_grp_realm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_realm_def_grp_realm ON public.realm_default_groups USING btree (realm_id);


--
-- Name: idx_realm_evt_list_realm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_realm_evt_list_realm ON public.realm_events_listeners USING btree (realm_id);


--
-- Name: idx_realm_evt_types_realm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_realm_evt_types_realm ON public.realm_enabled_event_types USING btree (realm_id);


--
-- Name: idx_realm_master_adm_cli; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_realm_master_adm_cli ON public.realm USING btree (master_admin_client);


--
-- Name: idx_realm_supp_local_realm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_realm_supp_local_realm ON public.realm_supported_locales USING btree (realm_id);


--
-- Name: idx_redir_uri_client; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_redir_uri_client ON public.redirect_uris USING btree (client_id);


--
-- Name: idx_req_act_prov_realm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_req_act_prov_realm ON public.required_action_provider USING btree (realm_id);


--
-- Name: idx_res_policy_policy; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_res_policy_policy ON public.resource_policy USING btree (policy_id);


--
-- Name: idx_res_scope_scope; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_res_scope_scope ON public.resource_scope USING btree (scope_id);


--
-- Name: idx_res_serv_pol_res_serv; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_res_serv_pol_res_serv ON public.resource_server_policy USING btree (resource_server_id);


--
-- Name: idx_res_srv_res_res_srv; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_res_srv_res_res_srv ON public.resource_server_resource USING btree (resource_server_id);


--
-- Name: idx_res_srv_scope_res_srv; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_res_srv_scope_res_srv ON public.resource_server_scope USING btree (resource_server_id);


--
-- Name: idx_role_attribute; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_role_attribute ON public.role_attribute USING btree (role_id);


--
-- Name: idx_role_clscope; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_role_clscope ON public.client_scope_role_mapping USING btree (role_id);


--
-- Name: idx_scope_mapping_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scope_mapping_role ON public.scope_mapping USING btree (role_id);


--
-- Name: idx_scope_policy_policy; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scope_policy_policy ON public.scope_policy USING btree (policy_id);


--
-- Name: idx_update_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_update_time ON public.migration_model USING btree (update_time);


--
-- Name: idx_us_sess_id_on_cl_sess; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_us_sess_id_on_cl_sess ON public.offline_client_session USING btree (user_session_id);


--
-- Name: idx_usconsent_clscope; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usconsent_clscope ON public.user_consent_client_scope USING btree (user_consent_id);


--
-- Name: idx_usconsent_scope_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usconsent_scope_id ON public.user_consent_client_scope USING btree (scope_id);


--
-- Name: idx_user_attribute; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_attribute ON public.user_attribute USING btree (user_id);


--
-- Name: idx_user_attribute_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_attribute_name ON public.user_attribute USING btree (name, value);


--
-- Name: idx_user_consent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_consent ON public.user_consent USING btree (user_id);


--
-- Name: idx_user_credential; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_credential ON public.credential USING btree (user_id);


--
-- Name: idx_user_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_email ON public.user_entity USING btree (email);


--
-- Name: idx_user_group_mapping; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_group_mapping ON public.user_group_membership USING btree (user_id);


--
-- Name: idx_user_reqactions; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_reqactions ON public.user_required_action USING btree (user_id);


--
-- Name: idx_user_role_mapping; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_role_mapping ON public.user_role_mapping USING btree (user_id);


--
-- Name: idx_user_service_account; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_service_account ON public.user_entity USING btree (realm_id, service_account_client_link);


--
-- Name: idx_usr_fed_map_fed_prv; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usr_fed_map_fed_prv ON public.user_federation_mapper USING btree (federation_provider_id);


--
-- Name: idx_usr_fed_map_realm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usr_fed_map_realm ON public.user_federation_mapper USING btree (realm_id);


--
-- Name: idx_usr_fed_prv_realm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usr_fed_prv_realm ON public.user_federation_provider USING btree (realm_id);


--
-- Name: idx_web_orig_client; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_web_orig_client ON public.web_origins USING btree (client_id);


--
-- Name: user_attr_long_values; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_attr_long_values ON public.user_attribute USING btree (long_value_hash, name);


--
-- Name: user_attr_long_values_lower_case; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_attr_long_values_lower_case ON public.user_attribute USING btree (long_value_hash_lower_case, name);


--
-- Name: client_session_auth_status auth_status_constraint; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_session_auth_status
    ADD CONSTRAINT auth_status_constraint FOREIGN KEY (client_session) REFERENCES public.client_session(id);


--
-- Name: identity_provider fk2b4ebc52ae5c3b34; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.identity_provider
    ADD CONSTRAINT fk2b4ebc52ae5c3b34 FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: client_attributes fk3c47c64beacca966; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_attributes
    ADD CONSTRAINT fk3c47c64beacca966 FOREIGN KEY (client_id) REFERENCES public.client(id);


--
-- Name: federated_identity fk404288b92ef007a6; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.federated_identity
    ADD CONSTRAINT fk404288b92ef007a6 FOREIGN KEY (user_id) REFERENCES public.user_entity(id);


--
-- Name: client_node_registrations fk4129723ba992f594; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_node_registrations
    ADD CONSTRAINT fk4129723ba992f594 FOREIGN KEY (client_id) REFERENCES public.client(id);


--
-- Name: client_session_note fk5edfb00ff51c2736; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_session_note
    ADD CONSTRAINT fk5edfb00ff51c2736 FOREIGN KEY (client_session) REFERENCES public.client_session(id);


--
-- Name: user_session_note fk5edfb00ff51d3472; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_session_note
    ADD CONSTRAINT fk5edfb00ff51d3472 FOREIGN KEY (user_session) REFERENCES public.user_session(id);


--
-- Name: client_session_role fk_11b7sgqw18i532811v7o2dv76; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_session_role
    ADD CONSTRAINT fk_11b7sgqw18i532811v7o2dv76 FOREIGN KEY (client_session) REFERENCES public.client_session(id);


--
-- Name: redirect_uris fk_1burs8pb4ouj97h5wuppahv9f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.redirect_uris
    ADD CONSTRAINT fk_1burs8pb4ouj97h5wuppahv9f FOREIGN KEY (client_id) REFERENCES public.client(id);


--
-- Name: user_federation_provider fk_1fj32f6ptolw2qy60cd8n01e8; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_federation_provider
    ADD CONSTRAINT fk_1fj32f6ptolw2qy60cd8n01e8 FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: client_session_prot_mapper fk_33a8sgqw18i532811v7o2dk89; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_session_prot_mapper
    ADD CONSTRAINT fk_33a8sgqw18i532811v7o2dk89 FOREIGN KEY (client_session) REFERENCES public.client_session(id);


--
-- Name: realm_required_credential fk_5hg65lybevavkqfki3kponh9v; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.realm_required_credential
    ADD CONSTRAINT fk_5hg65lybevavkqfki3kponh9v FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: resource_attribute fk_5hrm2vlf9ql5fu022kqepovbr; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_attribute
    ADD CONSTRAINT fk_5hrm2vlf9ql5fu022kqepovbr FOREIGN KEY (resource_id) REFERENCES public.resource_server_resource(id);


--
-- Name: user_attribute fk_5hrm2vlf9ql5fu043kqepovbr; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_attribute
    ADD CONSTRAINT fk_5hrm2vlf9ql5fu043kqepovbr FOREIGN KEY (user_id) REFERENCES public.user_entity(id);


--
-- Name: user_required_action fk_6qj3w1jw9cvafhe19bwsiuvmd; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_required_action
    ADD CONSTRAINT fk_6qj3w1jw9cvafhe19bwsiuvmd FOREIGN KEY (user_id) REFERENCES public.user_entity(id);


--
-- Name: keycloak_role fk_6vyqfe4cn4wlq8r6kt5vdsj5c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.keycloak_role
    ADD CONSTRAINT fk_6vyqfe4cn4wlq8r6kt5vdsj5c FOREIGN KEY (realm) REFERENCES public.realm(id);


--
-- Name: realm_smtp_config fk_70ej8xdxgxd0b9hh6180irr0o; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.realm_smtp_config
    ADD CONSTRAINT fk_70ej8xdxgxd0b9hh6180irr0o FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: realm_attribute fk_8shxd6l3e9atqukacxgpffptw; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.realm_attribute
    ADD CONSTRAINT fk_8shxd6l3e9atqukacxgpffptw FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: composite_role fk_a63wvekftu8jo1pnj81e7mce2; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.composite_role
    ADD CONSTRAINT fk_a63wvekftu8jo1pnj81e7mce2 FOREIGN KEY (composite) REFERENCES public.keycloak_role(id);


--
-- Name: authentication_execution fk_auth_exec_flow; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.authentication_execution
    ADD CONSTRAINT fk_auth_exec_flow FOREIGN KEY (flow_id) REFERENCES public.authentication_flow(id);


--
-- Name: authentication_execution fk_auth_exec_realm; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.authentication_execution
    ADD CONSTRAINT fk_auth_exec_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: authentication_flow fk_auth_flow_realm; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.authentication_flow
    ADD CONSTRAINT fk_auth_flow_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: authenticator_config fk_auth_realm; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.authenticator_config
    ADD CONSTRAINT fk_auth_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: client_session fk_b4ao2vcvat6ukau74wbwtfqo1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_session
    ADD CONSTRAINT fk_b4ao2vcvat6ukau74wbwtfqo1 FOREIGN KEY (session_id) REFERENCES public.user_session(id);


--
-- Name: user_role_mapping fk_c4fqv34p1mbylloxang7b1q3l; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_role_mapping
    ADD CONSTRAINT fk_c4fqv34p1mbylloxang7b1q3l FOREIGN KEY (user_id) REFERENCES public.user_entity(id);


--
-- Name: client_scope_attributes fk_cl_scope_attr_scope; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_scope_attributes
    ADD CONSTRAINT fk_cl_scope_attr_scope FOREIGN KEY (scope_id) REFERENCES public.client_scope(id);


--
-- Name: client_scope_role_mapping fk_cl_scope_rm_scope; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_scope_role_mapping
    ADD CONSTRAINT fk_cl_scope_rm_scope FOREIGN KEY (scope_id) REFERENCES public.client_scope(id);


--
-- Name: client_user_session_note fk_cl_usr_ses_note; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_user_session_note
    ADD CONSTRAINT fk_cl_usr_ses_note FOREIGN KEY (client_session) REFERENCES public.client_session(id);


--
-- Name: protocol_mapper fk_cli_scope_mapper; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.protocol_mapper
    ADD CONSTRAINT fk_cli_scope_mapper FOREIGN KEY (client_scope_id) REFERENCES public.client_scope(id);


--
-- Name: client_initial_access fk_client_init_acc_realm; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_initial_access
    ADD CONSTRAINT fk_client_init_acc_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: component_config fk_component_config; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.component_config
    ADD CONSTRAINT fk_component_config FOREIGN KEY (component_id) REFERENCES public.component(id);


--
-- Name: component fk_component_realm; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.component
    ADD CONSTRAINT fk_component_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: realm_default_groups fk_def_groups_realm; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.realm_default_groups
    ADD CONSTRAINT fk_def_groups_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: user_federation_mapper_config fk_fedmapper_cfg; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_federation_mapper_config
    ADD CONSTRAINT fk_fedmapper_cfg FOREIGN KEY (user_federation_mapper_id) REFERENCES public.user_federation_mapper(id);


--
-- Name: user_federation_mapper fk_fedmapperpm_fedprv; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_federation_mapper
    ADD CONSTRAINT fk_fedmapperpm_fedprv FOREIGN KEY (federation_provider_id) REFERENCES public.user_federation_provider(id);


--
-- Name: user_federation_mapper fk_fedmapperpm_realm; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_federation_mapper
    ADD CONSTRAINT fk_fedmapperpm_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: associated_policy fk_frsr5s213xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.associated_policy
    ADD CONSTRAINT fk_frsr5s213xcx4wnkog82ssrfy FOREIGN KEY (associated_policy_id) REFERENCES public.resource_server_policy(id);


--
-- Name: scope_policy fk_frsrasp13xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scope_policy
    ADD CONSTRAINT fk_frsrasp13xcx4wnkog82ssrfy FOREIGN KEY (policy_id) REFERENCES public.resource_server_policy(id);


--
-- Name: resource_server_perm_ticket fk_frsrho213xcx4wnkog82sspmt; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_server_perm_ticket
    ADD CONSTRAINT fk_frsrho213xcx4wnkog82sspmt FOREIGN KEY (resource_server_id) REFERENCES public.resource_server(id);


--
-- Name: resource_server_resource fk_frsrho213xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_server_resource
    ADD CONSTRAINT fk_frsrho213xcx4wnkog82ssrfy FOREIGN KEY (resource_server_id) REFERENCES public.resource_server(id);


--
-- Name: resource_server_perm_ticket fk_frsrho213xcx4wnkog83sspmt; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_server_perm_ticket
    ADD CONSTRAINT fk_frsrho213xcx4wnkog83sspmt FOREIGN KEY (resource_id) REFERENCES public.resource_server_resource(id);


--
-- Name: resource_server_perm_ticket fk_frsrho213xcx4wnkog84sspmt; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_server_perm_ticket
    ADD CONSTRAINT fk_frsrho213xcx4wnkog84sspmt FOREIGN KEY (scope_id) REFERENCES public.resource_server_scope(id);


--
-- Name: associated_policy fk_frsrpas14xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.associated_policy
    ADD CONSTRAINT fk_frsrpas14xcx4wnkog82ssrfy FOREIGN KEY (policy_id) REFERENCES public.resource_server_policy(id);


--
-- Name: scope_policy fk_frsrpass3xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scope_policy
    ADD CONSTRAINT fk_frsrpass3xcx4wnkog82ssrfy FOREIGN KEY (scope_id) REFERENCES public.resource_server_scope(id);


--
-- Name: resource_server_perm_ticket fk_frsrpo2128cx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_server_perm_ticket
    ADD CONSTRAINT fk_frsrpo2128cx4wnkog82ssrfy FOREIGN KEY (policy_id) REFERENCES public.resource_server_policy(id);


--
-- Name: resource_server_policy fk_frsrpo213xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_server_policy
    ADD CONSTRAINT fk_frsrpo213xcx4wnkog82ssrfy FOREIGN KEY (resource_server_id) REFERENCES public.resource_server(id);


--
-- Name: resource_scope fk_frsrpos13xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_scope
    ADD CONSTRAINT fk_frsrpos13xcx4wnkog82ssrfy FOREIGN KEY (resource_id) REFERENCES public.resource_server_resource(id);


--
-- Name: resource_policy fk_frsrpos53xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_policy
    ADD CONSTRAINT fk_frsrpos53xcx4wnkog82ssrfy FOREIGN KEY (resource_id) REFERENCES public.resource_server_resource(id);


--
-- Name: resource_policy fk_frsrpp213xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_policy
    ADD CONSTRAINT fk_frsrpp213xcx4wnkog82ssrfy FOREIGN KEY (policy_id) REFERENCES public.resource_server_policy(id);


--
-- Name: resource_scope fk_frsrps213xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_scope
    ADD CONSTRAINT fk_frsrps213xcx4wnkog82ssrfy FOREIGN KEY (scope_id) REFERENCES public.resource_server_scope(id);


--
-- Name: resource_server_scope fk_frsrso213xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_server_scope
    ADD CONSTRAINT fk_frsrso213xcx4wnkog82ssrfy FOREIGN KEY (resource_server_id) REFERENCES public.resource_server(id);


--
-- Name: composite_role fk_gr7thllb9lu8q4vqa4524jjy8; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.composite_role
    ADD CONSTRAINT fk_gr7thllb9lu8q4vqa4524jjy8 FOREIGN KEY (child_role) REFERENCES public.keycloak_role(id);


--
-- Name: user_consent_client_scope fk_grntcsnt_clsc_usc; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_consent_client_scope
    ADD CONSTRAINT fk_grntcsnt_clsc_usc FOREIGN KEY (user_consent_id) REFERENCES public.user_consent(id);


--
-- Name: user_consent fk_grntcsnt_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_consent
    ADD CONSTRAINT fk_grntcsnt_user FOREIGN KEY (user_id) REFERENCES public.user_entity(id);


--
-- Name: group_attribute fk_group_attribute_group; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_attribute
    ADD CONSTRAINT fk_group_attribute_group FOREIGN KEY (group_id) REFERENCES public.keycloak_group(id);


--
-- Name: group_role_mapping fk_group_role_group; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_role_mapping
    ADD CONSTRAINT fk_group_role_group FOREIGN KEY (group_id) REFERENCES public.keycloak_group(id);


--
-- Name: realm_enabled_event_types fk_h846o4h0w8epx5nwedrf5y69j; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.realm_enabled_event_types
    ADD CONSTRAINT fk_h846o4h0w8epx5nwedrf5y69j FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: realm_events_listeners fk_h846o4h0w8epx5nxev9f5y69j; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.realm_events_listeners
    ADD CONSTRAINT fk_h846o4h0w8epx5nxev9f5y69j FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: identity_provider_mapper fk_idpm_realm; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.identity_provider_mapper
    ADD CONSTRAINT fk_idpm_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: idp_mapper_config fk_idpmconfig; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.idp_mapper_config
    ADD CONSTRAINT fk_idpmconfig FOREIGN KEY (idp_mapper_id) REFERENCES public.identity_provider_mapper(id);


--
-- Name: web_origins fk_lojpho213xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.web_origins
    ADD CONSTRAINT fk_lojpho213xcx4wnkog82ssrfy FOREIGN KEY (client_id) REFERENCES public.client(id);


--
-- Name: scope_mapping fk_ouse064plmlr732lxjcn1q5f1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scope_mapping
    ADD CONSTRAINT fk_ouse064plmlr732lxjcn1q5f1 FOREIGN KEY (client_id) REFERENCES public.client(id);


--
-- Name: protocol_mapper fk_pcm_realm; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.protocol_mapper
    ADD CONSTRAINT fk_pcm_realm FOREIGN KEY (client_id) REFERENCES public.client(id);


--
-- Name: credential fk_pfyr0glasqyl0dei3kl69r6v0; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credential
    ADD CONSTRAINT fk_pfyr0glasqyl0dei3kl69r6v0 FOREIGN KEY (user_id) REFERENCES public.user_entity(id);


--
-- Name: protocol_mapper_config fk_pmconfig; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.protocol_mapper_config
    ADD CONSTRAINT fk_pmconfig FOREIGN KEY (protocol_mapper_id) REFERENCES public.protocol_mapper(id);


--
-- Name: default_client_scope fk_r_def_cli_scope_realm; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.default_client_scope
    ADD CONSTRAINT fk_r_def_cli_scope_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: required_action_provider fk_req_act_realm; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.required_action_provider
    ADD CONSTRAINT fk_req_act_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: resource_uris fk_resource_server_uris; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_uris
    ADD CONSTRAINT fk_resource_server_uris FOREIGN KEY (resource_id) REFERENCES public.resource_server_resource(id);


--
-- Name: role_attribute fk_role_attribute_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_attribute
    ADD CONSTRAINT fk_role_attribute_id FOREIGN KEY (role_id) REFERENCES public.keycloak_role(id);


--
-- Name: realm_supported_locales fk_supported_locales_realm; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.realm_supported_locales
    ADD CONSTRAINT fk_supported_locales_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: user_federation_config fk_t13hpu1j94r2ebpekr39x5eu5; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_federation_config
    ADD CONSTRAINT fk_t13hpu1j94r2ebpekr39x5eu5 FOREIGN KEY (user_federation_provider_id) REFERENCES public.user_federation_provider(id);


--
-- Name: user_group_membership fk_user_group_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_group_membership
    ADD CONSTRAINT fk_user_group_user FOREIGN KEY (user_id) REFERENCES public.user_entity(id);


--
-- Name: policy_config fkdc34197cf864c4e43; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.policy_config
    ADD CONSTRAINT fkdc34197cf864c4e43 FOREIGN KEY (policy_id) REFERENCES public.resource_server_policy(id);


--
-- Name: identity_provider_config fkdc4897cf864c4e43; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.identity_provider_config
    ADD CONSTRAINT fkdc4897cf864c4e43 FOREIGN KEY (identity_provider_id) REFERENCES public.identity_provider(internal_id);


--
-- PostgreSQL database dump complete
--

\unrestrict pzGVf1tKPv2AaH2BrriXWKQJPWs0ULeOdBeTacKgPxteszfre4h3VaepB4c1V9y

