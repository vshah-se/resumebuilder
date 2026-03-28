import { tokenize } from './textUtils';

// Map of canonical skill name (lowercase) -> aliases (lowercase)
const SKILLS_MAP: Record<string, string[]> = {
  'javascript': ['js', 'es6', 'es2015', 'ecmascript'],
  'typescript': ['ts'],
  'python': ['py', 'python3'],
  'java': [],
  'c++': ['cpp', 'cplusplus'],
  'c#': ['csharp', 'c-sharp'],
  'go': ['golang'],
  'rust': [],
  'ruby': ['rb'],
  'php': [],
  'react': ['reactjs', 'react.js'],
  'next.js': ['nextjs', 'next'],
  'vue.js': ['vuejs', 'vue'],
  'angular': ['angularjs'],
  'svelte': ['sveltekit'],
  'node.js': ['nodejs', 'node'],
  'express.js': ['expressjs', 'express'],
  'django': [],
  'flask': [],
  'spring boot': ['springboot', 'spring'],
  'html': ['html5'],
  'css': ['css3'],
  'sass': ['scss'],
  'tailwind css': ['tailwindcss', 'tailwind'],
  'material ui': ['mui', 'material-ui'],
  'postgresql': ['postgres', 'psql', 'pg'],
  'mysql': [],
  'mongodb': ['mongo'],
  'redis': [],
  'sqlite': [],
  'firebase': [],
  'aws': ['amazon web services'],
  'azure': ['microsoft azure'],
  'google cloud': ['gcp', 'google cloud platform'],
  'docker': [],
  'kubernetes': ['k8s'],
  'terraform': [],
  'git': [],
  'github': [],
  'gitlab': [],
  'ci/cd': ['cicd', 'ci', 'cd', 'continuous integration', 'continuous deployment'],
  'jenkins': [],
  'rest apis': ['rest', 'restful', 'rest api'],
  'graphql': [],
  'grpc': [],
  'websockets': ['websocket', 'ws'],
  'agile': [],
  'scrum': [],
  'kanban': [],
  'jira': [],
  'confluence': [],
  'machine learning': ['ml'],
  'data science': ['data analytics'],
  'tensorflow': [],
  'pytorch': [],
  'project management': [],
  'leadership': [],
  'communication': [],
  'problem solving': [],
  'team collaboration': ['teamwork'],
  'figma': [],
  'adobe xd': [],
  'sketch': [],
  'ui/ux design': ['ui design', 'ux design', 'ui/ux', 'ux'],
  'linux': [],
  'bash': ['shell', 'shell scripting'],
  'powershell': [],
  'unit testing': [],
  'integration testing': [],
  'jest': [],
  'cypress': [],
  'selenium': [],
  'sql': [],
  'nosql': [],
  'microservices': [],
  'api design': [],
  'system design': [],
  'data structures': [],
  'algorithms': [],
  'object-oriented programming': ['oop'],
  'functional programming': [],
  'devops': [],
  'elasticsearch': ['elastic'],
  'kafka': ['apache kafka'],
  'rabbitmq': [],
  'nginx': [],
  'apache': [],
  'aws lambda': ['lambda'],
  'dynamodb': [],
  's3': ['aws s3'],
  'ec2': ['aws ec2'],
  'cloudformation': [],
  'ansible': [],
  'prometheus': [],
  'grafana': [],
  'datadog': [],
  'new relic': [],
  'splunk': [],
  'tableau': [],
  'power bi': ['powerbi'],
  'pandas': [],
  'numpy': [],
  'scikit-learn': ['sklearn'],
  'keras': [],
  'natural language processing': ['nlp'],
  'computer vision': ['cv'],
  'deep learning': ['dl'],
  'r': [],
  'scala': [],
  'kotlin': [],
  'swift': [],
  'objective-c': [],
  'react native': [],
  'flutter': [],
  'dart': [],
  'xamarin': [],
  'ionic': [],
  'electron': [],
  'three.js': ['threejs'],
  'd3.js': ['d3'],
  'webpack': [],
  'vite': [],
  'rollup': [],
  'babel': [],
  'eslint': [],
  'prettier': [],
  'storybook': [],
  'redux': [],
  'zustand': [],
  'mobx': [],
  'prisma': [],
  'sequelize': [],
  'typeorm': [],
  'mongoose': [],
  'supabase': [],
  'vercel': [],
  'netlify': [],
  'heroku': [],
  'digitalocean': [],
};

// Build reverse lookup: alias -> canonical name
const aliasToCanonical = new Map<string, string>();
for (const [canonical, aliases] of Object.entries(SKILLS_MAP)) {
  aliasToCanonical.set(canonical, canonical);
  for (const alias of aliases) {
    aliasToCanonical.set(alias, canonical);
  }
}

// All searchable terms sorted by length (longest first for greedy matching)
const allTerms = Array.from(aliasToCanonical.keys()).sort((a, b) => b.length - a.length);

export function findSkillsInText(text: string): string[] {
  const lower = text.toLowerCase();
  const found = new Set<string>();

  for (const term of allTerms) {
    // For short terms (<=2 chars like "r", "go"), require word boundaries
    if (term.length <= 2) {
      const re = new RegExp(`\\b${escapeRegex(term)}\\b`, 'i');
      if (re.test(lower)) {
        found.add(aliasToCanonical.get(term)!);
      }
    } else if (lower.includes(term)) {
      found.add(aliasToCanonical.get(term)!);
    }
  }

  return Array.from(found);
}

export function normalizeSkillName(raw: string): string {
  const lower = raw.toLowerCase().trim();
  const canonical = aliasToCanonical.get(lower);
  if (canonical) {
    // Return title-cased canonical
    return canonical
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
  // Return as-is but title-cased
  return raw.trim();
}

export function extractSkillsFromList(text: string): string[] {
  // Split by common delimiters: comma, pipe, bullet, newline
  return text
    .split(/[,|\u2022\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.length < 60);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Re-export tokenize for convenience
export { tokenize };
