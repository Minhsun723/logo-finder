import test from 'node:test';
import assert from 'node:assert/strict';
import { filterItems, titleScore } from './search.js';

const anime = [{ id: 'anime-1', name: '碧藍之海', shortName: '碧藍之海', alternativeTitles: [], logo: { url: 'logo' } }];
const online = [{ id: 'movie-1', name: '電影結果', shortName: '電影結果', alternativeTitles: [], logo: null }];

test('local search scores title variants', () => {
  assert.ok(titleScore('碧藍', anime[0]) >= 99);
});

test('online results never replace category source and clearing restores category', () => {
  const searched = filterItems({ categoryItems: anime, onlineResults: online, keyword: '電影', onlineKeyword: '電影', showingOnlineResults: true, logoFilter: 'all' });
  assert.deepEqual(searched.items, online);
  const cleared = filterItems({ categoryItems: anime, onlineResults: [], keyword: '', onlineKeyword: '', showingOnlineResults: false, logoFilter: 'all' });
  assert.deepEqual(cleared.items, anime);
});

test('logo filter applies to the current source', () => {
  const result = filterItems({ categoryItems: anime, onlineResults: online, keyword: '電影', onlineKeyword: '電影', showingOnlineResults: true, logoFilter: 'with-logo' });
  assert.equal(result.items.length, 0);
});
