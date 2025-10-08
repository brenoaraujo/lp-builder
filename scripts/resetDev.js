import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if we're in development
if (process.env.VITE_ENV !== 'development' && process.env.NODE_ENV !== 'development') {
  console.error('❌ This script can only be run in development environment');
  console.error('Set VITE_ENV=development or NODE_ENV=development');
  process.exit(1);
}

// Load environment variables
let envVars = {};
try {
  const envFile = readFileSync(join(__dirname, '..', '.env.local'), 'utf8');
  envFile.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  });
} catch (error) {
  console.warn('⚠️  Could not load .env.local file');
}

const supabaseUrl = envVars.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('  - VITE_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  console.error('');
  console.error('Please set these in your .env.local file or environment');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetDatabase() {
  console.log('🔄 Resetting development database...');

  try {
    // Truncate invites table
    console.log('  📝 Clearing invites table...');
    const { error: invitesError } = await supabase
      .from('invites')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

    if (invitesError) {
      throw new Error(`Failed to clear invites table: ${invitesError.message}`);
    }

    console.log('  ✅ Invites table cleared');

    // Clear storage bucket if it exists
    console.log('  🗂️  Clearing charity-logos storage bucket...');
    try {
      const { data: files, error: listError } = await supabase.storage
        .from('charity-logos')
        .list();

      if (listError && listError.message !== 'Bucket not found') {
        throw listError;
      }

      if (files && files.length > 0) {
        const filePaths = files.map(file => file.name);
        const { error: deleteError } = await supabase.storage
          .from('charity-logos')
          .remove(filePaths);

        if (deleteError) {
          throw deleteError;
        }
        console.log(`  ✅ Removed ${filePaths.length} files from storage`);
      } else {
        console.log('  ✅ Storage bucket is already empty');
      }
    } catch (storageError) {
      console.warn(`  ⚠️  Could not clear storage bucket: ${storageError.message}`);
    }

    console.log('🎉 Development database reset completed successfully!');
    console.log('');
    console.log('You can now start fresh with your development work.');

  } catch (error) {
    console.error('❌ Error resetting database:', error.message);
    process.exit(1);
  }
}

// Run the reset
resetDatabase();
