CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    customer_id UUID NOT NULL,
    role VARCHAR(50) NOT NULL,    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_users_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS vessels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100) NOT NULL,
    customer_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vessels_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    vessel_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    serial_number VARCHAR(100),
    installed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_components_vessel FOREIGN KEY (vessel_id) REFERENCES vessels(id) ON DELETE CASCADE,
    CONSTRAINT fk_components_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS maintenance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    component_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    performed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_maintenance_component FOREIGN KEY (component_id) REFERENCES components(id) ON DELETE CASCADE,
    CONSTRAINT fk_maintenance_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    CONSTRAINT fk_maintenance_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Ejemplos completos con relaciones
WITH c AS (
    INSERT INTO customers (name) VALUES ('Cliente 1 Relacional') RETURNING id
), u AS (
    INSERT INTO users (username, password_hash, customer_id, role)
    SELECT 'user1', '$2b$10$mPp5vjbgOo9CkmUmYdKQJehKKcVMdAPI865hrLLDN.UVviXigSjte', id, 'admin' FROM c RETURNING id, customer_id
), v AS (
    INSERT INTO vessels (name, registration_number, customer_id)
    SELECT 'Vessel A', 'REG-A-001', customer_id FROM u RETURNING id, customer_id
), comp AS (
    INSERT INTO components (name, vessel_id, customer_id, serial_number, installed_at)
    SELECT 'Motor Principal 1', id, customer_id, 'SN-001', NOW() FROM v RETURNING id, customer_id
)
INSERT INTO maintenance (component_id, customer_id, description, status, scheduled_at, performed_at, created_by)
SELECT comp.id, comp.customer_id, 'Revisión programada de motor principal 1', 'pending', NOW() + INTERVAL '5 days', NULL, u.id
FROM comp
JOIN u ON u.customer_id = comp.customer_id;

WITH c2 AS (
    INSERT INTO customers (name) VALUES ('Cliente 2 Relacional') RETURNING id
), u2 AS (
    INSERT INTO users (username, password_hash, customer_id, role)
    SELECT 'user2', '$2b$10$pg4l/vIP0SdwhReyxxcPGeJvz.nHt0zK/MmR5B2KRUvOh1arNMxqW', id, 'technician' FROM c2 RETURNING id, customer_id
), v2 AS (
    INSERT INTO vessels (name, registration_number, customer_id)
    SELECT 'Vessel B', 'REG-B-002', customer_id FROM u2 RETURNING id, customer_id
), comp2 AS (
    INSERT INTO components (name, vessel_id, customer_id, serial_number, installed_at)
    SELECT 'Bomba Hidráulica 2', id, customer_id, 'SN-002', NOW() - INTERVAL '30 days' FROM v2 RETURNING id, customer_id
)
INSERT INTO maintenance (component_id, customer_id, description, status, scheduled_at, performed_at, created_by)
SELECT comp2.id, comp2.customer_id, 'Reemplazo de bomba hidráulica 2', 'completed', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days', u2.id
FROM comp2
JOIN u2 ON u2.customer_id = comp2.customer_id;

WITH c3 AS (
    INSERT INTO customers (name) VALUES ('Cliente 3 Relacional') RETURNING id
), u3 AS (
    INSERT INTO users (username, password_hash, customer_id, role)
    SELECT 'user3', '$2b$10$LBLvylBn8wcyMsYgZO15X.Q8mQdJb30MxJli6wvc7h1wQxqM05XLm', id, 'operator' FROM c3 RETURNING id, customer_id
), v3 AS (
    INSERT INTO vessels (name, registration_number, customer_id)
    SELECT 'Vessel C', 'REG-C-003', customer_id FROM u3 RETURNING id, customer_id
), comp3 AS (
    INSERT INTO components (name, vessel_id, customer_id, serial_number, installed_at)
    SELECT 'Generador Eléctrico 3', id, customer_id, 'SN-003', NOW() - INTERVAL '60 days' FROM v3 RETURNING id, customer_id
)
INSERT INTO maintenance (component_id, customer_id, description, status, scheduled_at, performed_at, created_by)
SELECT comp3.id, comp3.customer_id, 'Ajuste y prueba de generador 3', 'in_progress', NOW(), NULL, u3.id
FROM comp3
JOIN u3 ON u3.customer_id = comp3.customer_id;

