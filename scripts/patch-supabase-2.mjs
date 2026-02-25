import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir('./app/api', (filePath) => {
    if (filePath.endsWith('.js')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let patched = false;

        if (content.includes('import { createAdminClient } from')) {
            content = content.replace(
                "import { createAdminClient } from '@/lib/supabase';",
                "import { supabaseAdmin } from '@/lib/supabase';"
            );
            patched = true;
        }

        if (content.includes('const supabaseAdmin = createAdminClient();')) {
            content = content.replace('const supabaseAdmin = createAdminClient();', '');
            patched = true;
        }

        if (patched) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Patched createAdminClient in:', filePath);
        }
    }
});
