-- CRM Sellos Database Schema

-- Drop existing tables if they exist (be careful in production!)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS order_history CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop custom types if they exist
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;

-- Create ENUMs for user roles and order statuses
CREATE TYPE user_role AS ENUM ('admin', 'cliente');
CREATE TYPE order_status AS ENUM (
  'diseno_realizado',
  'procesado_fotopolimero',
  'montaje',
  'correcion',
  'listo_entrega'
);

-- Users table (both admins and clients)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL, -- Stores bcrypt hashed password
  email VARCHAR(100) UNIQUE NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role user_role NOT NULL DEFAULT 'cliente',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_name VARCHAR(200) NOT NULL,
  image_url VARCHAR(500), -- Path to uploaded image
  current_status order_status NOT NULL DEFAULT 'diseno_realizado',
  is_archived BOOLEAN DEFAULT false,
  archived_date TIMESTAMP, -- When order was archived
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order history table (audit trail for all status changes)
CREATE TABLE order_history (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status order_status NOT NULL,
  changed_by INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT -- Optional notes about the change
);

-- Notifications table (internal notification system)
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_orders_client_id ON orders(client_id);
CREATE INDEX idx_orders_status ON orders(current_status);
CREATE INDEX idx_orders_archived ON orders(is_archived);
CREATE INDEX idx_order_history_order_id ON order_history(order_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to auto-update updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user
-- Password: cambiarme123 (hashed with bcrypt, 10 rounds)
INSERT INTO users (username, password, email, full_name, role, is_active)
VALUES (
  'admin',
  '$2b$10$rK8qF5xN.mYXJK5vN5YGOuXxLxJxN5Xx5xX5Xx5Xx5Xx5Xx5Xx5Xx',
  'admin@crm-sellos.com',
  'Administrador del Sistema',
  'admin',
  true
);

-- Note: The actual hashed password will be generated during database initialization
-- This is just a placeholder that will be replaced by init.js
