/**
 * Loads every template under templates/ into Handlebars as a partial named by its Foundry path
 * (modules/fhcs/templates/...), with an English `localize`. Templates use only core helpers (dnd5e's helpers don't
 * exist offline), so what renders here is what renders in Foundry.
 */
import Handlebars from 'handlebars';
import { existsSync, readdirSync, readFileSync } from 'node:fs';

const root = new URL('..', import.meta.url).pathname;
const lang = JSON.parse(readFileSync(`${root}lang/en.json`, 'utf8'));

/** @returns {string} The English text for a key, or the key. */
export const localize = (key) => key.replace(/^FHCS\./, '').split('.').reduce((o, p) => o?.[p], lang.FHCS) ?? key;

Handlebars.registerHelper('localize', (key) => localize(key));
if (existsSync(`${root}templates`))
{
   for (const file of readdirSync(`${root}templates`, { recursive: true }).filter((f) => f.endsWith('.hbs')))
   {
      Handlebars.registerPartial(`modules/fhcs/templates/${file}`, readFileSync(`${root}templates/${file}`, 'utf8'));
   }
}

/** @returns {Function} A compiled template from templates/, by its path without `.hbs`. */
export const template = (name) => Handlebars.compile(readFileSync(`${root}templates/${name}.hbs`, 'utf8'));

export { Handlebars };
