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
        if (content.includes('import { supabase as supabaseAdmin } from')) {
            content = content.replace(
                "import { supabase as supabaseAdmin } from '@/lib/supabase';",
                "import { supabaseAdmin } from '@/lib/supabase';"
            );
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Patched:', filePath);
        }
    }
});
