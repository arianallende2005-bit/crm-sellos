const { createClient } = require('@supabase/supabase-js');

// Configuración del cliente de Supabase
// Utilizamos las variables de entorno si existen, de lo contrario usamos los valores por defecto del proyecto.
// Nota: La anon key es pública por diseño y segura de incluir como fallback.
const supabaseUrl = process.env.SUPABASE_URL || 'https://otuorchtbfodduxtxrtg.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90dW9yY2h0YmZvZGR1eHR4cnRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4OTEwMDAsImV4cCI6MjA4NzQ2NzAwMH0.o12PoCItVYmDM9wQRy5YQnJTSnCOX46zBXPK_EoQjig';

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
