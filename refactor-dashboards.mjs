import fs from 'fs';
import path from 'path';

const basePath = process.cwd();
const srcPath = path.join(basePath, 'src');
const apiPath = path.join(srcPath, 'lib', 'api');
const dashboardsDir = path.join(apiPath, 'dashboards');
const featuresDir = path.join(apiPath, 'features');

// Define mappings
const mapping = {
  'citizen-requests.ts': path.join(featuresDir, 'requests', 'citizen.queries.ts'),
  'comander-queries.ts': path.join(featuresDir, 'commander', 'commander-dashboard.queries.ts'),
  'dispatcher-queries.ts': path.join(featuresDir, 'requests', 'dispatcher.queries.ts'), // Even if it has missions, we put it here for now or split later
  'rescuer-dashboard.ts': path.join(featuresDir, 'missions', 'rescuer-dashboard.queries.ts'),
  'rescuer-mutations.ts': path.join(featuresDir, 'missions', 'rescuer.mutations.ts'),
};

const internalImportsRegex = /from\s+["'](\.\.\/)([^"']+)["']/g;

// Process files
for (const [oldName, newPath] of Object.entries(mapping)) {
  const oldPath = path.join(dashboardsDir, oldName);
  if (fs.existsSync(oldPath)) {
    let content = fs.readFileSync(oldPath, 'utf8');
    
    // Update relative imports like "../services" -> "../../services"
    content = content.replace(internalImportsRegex, (match, p1, p2) => {
      return `from "../../${p2}"`;
    });
    
    // Specific fix for "dispatcher-queries" imported in rescuer-dashboard
    content = content.replace(/from "\.\/dispatcher-queries"/g, 'from "../requests/dispatcher.queries"');

    // Make sure dir exists
    fs.mkdirSync(path.dirname(newPath), { recursive: true });
    
    fs.writeFileSync(newPath, content, 'utf8');
    console.log(`Moved ${oldName} to ${newPath}`);
  }
}

// Now replace imports in the entire src directory
function walk(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) {
      walk(p, callback);
    } else if (p.endsWith('.tsx') || p.endsWith('.ts')) {
      callback(p);
    }
  }
}

const importMap = {
  'citizen-requests': 'features/requests/citizen.queries',
  'comander-queries': 'features/commander/commander-dashboard.queries',
  'dispatcher-queries': 'features/requests/dispatcher.queries',
  'rescuer-dashboard': 'features/missions/rescuer-dashboard.queries',
  'rescuer-mutations': 'features/missions/rescuer.mutations',
};

walk(srcPath, (filePath) => {
  if (filePath.includes('lib\\api\\dashboards')) return; // Skip the directory we are deleting

  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  for (const [oldName, newName] of Object.entries(importMap)) {
    const regex1 = new RegExp(`from ["']@/lib/api/dashboards/${oldName}["']`, 'g');
    if (regex1.test(content)) {
      content = content.replace(regex1, `from "@/lib/api/${newName}"`);
      changed = true;
    }
    
    // Also handle relative imports if any
    const regex2 = new RegExp(`from ["'](.*)/lib/api/dashboards/${oldName}["']`, 'g');
    if (regex2.test(content)) {
      content = content.replace(regex2, `from "$1/lib/api/${newName}"`);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated imports in ${filePath}`);
  }
});

// Finally, delete the dashboards directory
fs.rmSync(dashboardsDir, { recursive: true, force: true });
console.log('Deleted src/lib/api/dashboards');
