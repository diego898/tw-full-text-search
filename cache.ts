/*\
title: $:/plugins/hoelzro/full-text-search/cache.js
type: application/javascript
module-type: library

\*/

declare var $tw;
declare var window;
declare var require;

import * as LocalForageModule from 'localforage';
var localForage : typeof LocalForageModule = require('$:/plugins/hoelzro/full-text-search/localforage.min.js');

module FTSCache {
  function hasFunctionalCache() {
    return localForage.driver() != null;
  }

  interface CacheMeta {
    age: number;
    ftsPluginVersion: string;
  }

  function currentPluginVersion() {
    let pluginTiddler = $tw.wiki.getTiddler('$:/plugins/hoelzro/full-text-search');
    return pluginTiddler.fields.version;
  }

  async function getCacheMetadata() {
    if(!hasFunctionalCache()) {
      return;
    }

    var metaKey = 'tw-fts-index.meta.' + $tw.wiki.getTiddler('$:/SiteTitle').fields.text;
    // XXX how does TS handle the case where the cache item doesn't have the right keys?
    var cacheMeta = await localForage.getItem<CacheMeta>(metaKey);
    if(cacheMeta === null) {
      return;
    }

    if(!('ftsPluginVersion' in cacheMeta) || cacheMeta.ftsPluginVersion != currentPluginVersion()) {
      return;
    }

    return cacheMeta;
  }

  // XXX what about migrating between lunr versions? what about invalid data under the key?
  async function getCacheData() {
    if(!hasFunctionalCache()) {
      return;
    }

    let metaData = await getCacheMetadata();

    if(metaData == null) {
      return null;
    }

    var dataKey = 'tw-fts-index.data.' + $tw.wiki.getTiddler('$:/SiteTitle').fields.text;
    var cacheData = await localForage.getItem(dataKey);

    if(cacheData === null) {
      return null;
    }

    return JSON.parse(cacheData as string);
  }

  export async function getAge() {
    if(!hasFunctionalCache()) {
      return 0;
    }

    var cacheMeta = await getCacheMetadata();
    if(!cacheMeta) {
      return 0;
    }

    return cacheMeta.age;
  }

  export function load() {
    if(!hasFunctionalCache()) {
      return null;
    }

    var cacheData = getCacheData();
    if(!cacheData) {
      return;
    }

    return cacheData;
  }

  export async function save(age, data) {
    if(!hasFunctionalCache()) {
      return;
    }
    var dataKey = 'tw-fts-index.data.' + $tw.wiki.getTiddler('$:/SiteTitle').fields.text;
    var metaKey = 'tw-fts-index.meta.' + $tw.wiki.getTiddler('$:/SiteTitle').fields.text;
    var dataPromise = localForage.setItem(dataKey, JSON.stringify(data));
    var metaPromise = localForage.setItem(metaKey, { age: age, ftsPluginVersion: currentPluginVersion() });
    await Promise.all([ dataPromise, metaPromise ]);
  }

  export async function invalidate() {
    if(!hasFunctionalCache()) {
      return;
    }
    var dataKey = 'tw-fts-index.data.' + $tw.wiki.getTiddler('$:/SiteTitle').fields.text;
    var metaKey = 'tw-fts-index.meta.' + $tw.wiki.getTiddler('$:/SiteTitle').fields.text;
    var dataPromise = localForage.removeItem(dataKey);
    var metaPromise = localForage.removeItem(metaKey);
    await Promise.all([ dataPromise, metaPromise ]);
  }
}

export = FTSCache;
