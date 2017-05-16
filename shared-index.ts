/*\
title: $:/plugins/hoelzro/full-text-search/shared-index.js
type: application/javascript
module-type: library

\*/

declare var require;
declare var $tw;
declare var setTimeout;
declare var setInterval;

module SharedIndex {
    var lunr = require('$:/plugins/hoelzro/full-text-search/lunr.min.js');

    var index = lunr(function() {
        // XXX configurable boost? configurable fields?
        this.field('title', {boost: 10})
        this.field('tags', {boost: 5});
        this.field('text');

        this.ref('title');
    });

    var initialized = false;

    export function buildIndex(tiddlers, progressCallback) {
        var i = 0;
        var indexSingleTiddler = function indexSingleTiddler() {
            while(i < tiddlers.length) {
                var tiddler = $tw.wiki.getTiddler(tiddlers[i]);
                i++;
                if(tiddler === undefined) { // avoid drafts that were open when we started
                    continue;
                }
                var type = tiddler.fields.type || 'text/vnd.tiddlywiki';
                if(!type.startsWith('text/')) {
                    continue;
                }
                index.add(tiddler.fields);
                if(i < tiddlers.length) {
                    setTimeout(indexSingleTiddler, 1);
                }
                progressCallback(i);

                break;
            }
        };
        setTimeout(indexSingleTiddler, 1);
    };

    export function getIndex() {
        return index;
    };
}
export = SharedIndex;

// vim:sts=4:sw=4
