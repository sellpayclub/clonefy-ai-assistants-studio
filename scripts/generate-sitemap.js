#!/usr/bin/env node
/**
 * Script: generate-sitemap.js
 * Purpose: Auto-generate sitemap.xml from niches.json and ai-niches.json
 * Run: node scripts/generate-sitemap.js
 * 
 * This script reads the data files and generates a complete sitemap
 * for all static and dynamic routes.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOMAIN = 'https://clonefyia.com';
const TODAY = new Date().toISOString().split('T')[0];

// Read JSON data files
const nichesPath = path.join(__dirname, '../src/data/niches.json');
const aiNichesPath = path.join(__dirname, '../src/data/ai-niches.json');

let niches = [];
let aiNiches = [];

try {
    niches = JSON.parse(fs.readFileSync(nichesPath, 'utf-8'));
    console.log(`✓ Loaded ${niches.length} niches from niches.json`);
} catch (e) {
    console.warn('⚠ Could not load niches.json:', e.message);
}

try {
    aiNiches = JSON.parse(fs.readFileSync(aiNichesPath, 'utf-8'));
    console.log(`✓ Loaded ${aiNiches.length} AI niches from ai-niches.json`);
} catch (e) {
    console.warn('⚠ Could not load ai-niches.json:', e.message);
}

// Static routes
const staticRoutes = [
    { loc: '/', priority: '1.0', changefreq: 'weekly' },
    { loc: '/auth', priority: '0.6', changefreq: 'monthly' },
    { loc: '/ferramentas/clickgo', priority: '0.9', changefreq: 'weekly' },
    { loc: '/ferramentas/gerador-link-whatsapp', priority: '0.9', changefreq: 'weekly' },
    { loc: '/ferramentas/gerador-widget-whatsapp', priority: '0.9', changefreq: 'weekly' },
    { loc: '/ferramentas/calculadora-roi-whatsapp', priority: '0.9', changefreq: 'weekly' },
];

// Dynamic routes from niches.json (Link Generator per profession)
const nicheRoutes = niches.map(niche => ({
    loc: `/ferramentas/whatsapp-link/${niche.slug}`,
    priority: '0.8',
    changefreq: 'weekly',
}));

// Dynamic routes from ai-niches.json (IA Solutions per sector)
const aiRoutes = aiNiches.map(sector => ({
    loc: `/ia/${sector.slug}`,
    priority: '0.9',
    changefreq: 'weekly',
}));

// Combine all routes
const allRoutes = [...staticRoutes, ...nicheRoutes, ...aiRoutes];

// Generate XML
const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes.map(route => `  <url>
    <loc>${DOMAIN}${route.loc}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

// Write sitemap
const sitemapPath = path.join(__dirname, '../public/sitemap.xml');
fs.writeFileSync(sitemapPath, sitemapXml);

console.log(`\n✓ Generated sitemap.xml with ${allRoutes.length} URLs`);
console.log(`  - ${staticRoutes.length} static routes`);
console.log(`  - ${nicheRoutes.length} niche routes (Link Generator)`);
console.log(`  - ${aiRoutes.length} AI sector routes (IA Solutions)`);
console.log(`\n📁 Saved to: ${sitemapPath}`);
